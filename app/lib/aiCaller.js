// Who is calling /api/jojo or /api/classify, and how much they may use.
//
// The JoJo Cloud Function's key used to ship inside every kid app, so anyone
// could pull it out and run unlimited LLM calls on our bill. Now only this
// server holds the key, and every caller is one of:
//
//   parent  Firebase ID token of a `users` doc with role "parent"
//           (web dashboard, iOS parent app, Android parent app)
//   kid     Firebase ID token (the kid apps sign in anonymously) plus the
//           paired `childId`, which must be a `users` doc with role "child"
//   guest   no token — the public /chatbot page. Tight per-IP limit
//           (it marks itself with `x-guardiane-client: web-guest`, so it gets
//           guest limits even before the cutover)
//   legacy  no token during the transition (AI_REQUIRE_AUTH unset): app builds
//           released before this change. Same per-IP shape, looser limit, and
//           logged so we can see when nobody is left on them
//
// A kid token proves "a real install of our app signed in", not "this exact
// device paired with this child": children have no Auth account, and pairing is
// a QR of the child doc id. The daily limit per child is what bounds abuse.
// App Check would close that gap later.

import { createHash } from "node:crypto";
import { getAdminAuth, getAdminFirestore } from "./firebaseAdmin";
import { isValidChildId } from "./screenTimeUnlock";

export class CallerError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Header value the public /chatbot page sends (see app/lib/jojoChat.js). */
export const GUEST_CLIENT = "web-guest";

/** Daily caps per caller kind and route. */
export const DAILY_LIMITS = {
  jojo: { parent: 200, kid: 200, guest: 30, legacy: 300 },
  classify: { parent: 100, kid: 500 },
};

/** True once every client sends a token (see SYSTEM_DESIGN.md, JoJo key). */
export function requireAuth(env = process.env) {
  return env.AI_REQUIRE_AUTH === "true";
}

export function bearerToken(header) {
  const h = String(header ?? "");
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

/** First hop of x-forwarded-for (Vercel sets it), else x-real-ip. */
export function clientIp(headers) {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** IPs are hashed before they're stored as quota keys. */
export function hashIp(ip) {
  return createHash("sha256")
    .update(`guardiane-ai:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Identify the caller of an AI route.
 *
 * @param {object} p
 * @param {string} p.route        "jojo" | "classify"
 * @param {string} p.authorization the Authorization header
 * @param {string} [p.childId]    body.childId (kid callers)
 * @param {string} p.ip
 * @param {boolean} p.strict      AI_REQUIRE_AUTH
 * @param {string} [p.client]     x-guardiane-client header
 * @param {object|null} p.auth    Admin Auth (injectable for tests)
 * @param {object|null} p.db      Admin Firestore (injectable for tests)
 * @returns {Promise<{kind: string, quotaKey: string|null, uid?: string, childId?: string}>}
 *   quotaKey null means "no quota store available" (Admin unconfigured, lenient mode).
 * @throws {CallerError}
 */
export async function identifyCaller({
  route,
  authorization,
  childId,
  ip,
  strict,
  client,
  auth = getAdminAuth(),
  db = getAdminFirestore(),
}) {
  const token = bearerToken(authorization);

  if (!auth || !db) {
    // Without Admin we can't verify anyone. Before the cutover that must not
    // take JoJo down, so let it through unmetered (and loudly logged); after it,
    // refuse rather than run open.
    if (strict)
      throw new CallerError(503, "JoJo isn't configured on this server.");
    console.warn("[ai] Firebase Admin not configured — caller not verified");
    return { kind: token ? "unverified" : "legacy", quotaKey: null };
  }

  if (!token) {
    if (route === "classify")
      throw new CallerError(401, "Missing credentials.");
    const kind = strict || client === GUEST_CLIENT ? "guest" : "legacy";
    return { kind, quotaKey: `${kind}:${hashIp(ip)}` };
  }

  let uid;
  try {
    uid = (await auth.verifyIdToken(token)).uid;
  } catch {
    throw new CallerError(401, "Invalid credentials.");
  }

  const cleanChildId = typeof childId === "string" ? childId.trim() : "";
  if (cleanChildId) {
    if (!isValidChildId(cleanChildId)) {
      throw new CallerError(400, "Invalid childId.");
    }
    const child = await db.collection("users").doc(cleanChildId).get();
    if (!child.exists || child.get("role") !== "child") {
      throw new CallerError(403, "This device isn't paired with a child.");
    }
    return {
      kind: "kid",
      quotaKey: `kid:${cleanChildId}`,
      uid,
      childId: cleanChildId,
    };
  }

  const user = await db.collection("users").doc(uid).get();
  if (user.exists && user.get("role") === "parent") {
    return { kind: "parent", quotaKey: `parent:${uid}`, uid };
  }
  throw new CallerError(403, "This account can't use JoJo.");
}

/** The daily cap for a caller on a route, or null when the kind isn't allowed there. */
export function dailyLimit(route, kind) {
  return DAILY_LIMITS[route]?.[kind] ?? null;
}

/**
 * Identify the caller and charge one call to their daily cap — the shared front
 * half of both AI routes. Returns `{ caller }`, or `{ response }` to send as-is.
 */
export async function authorizeAiRequest(request, route, body, { consume }) {
  let caller;
  try {
    caller = await identifyCaller({
      route,
      authorization: request.headers.get("authorization"),
      childId: body?.childId,
      ip: clientIp(request.headers),
      strict: requireAuth(),
      client: request.headers.get("x-guardiane-client"),
    });
  } catch (e) {
    if (!(e instanceof CallerError)) throw e;
    console.warn(
      `[ai] route=${route} rejected status=${e.status}: ${e.message}`,
    );
    return {
      response: Response.json({ error: e.message }, { status: e.status }),
    };
  }

  const limit = dailyLimit(route, caller.kind);
  const { allowed, count } = await consume({
    route,
    quotaKey: caller.quotaKey,
    limit,
  });
  if (!allowed) {
    console.warn(
      `[ai] route=${route} caller=${caller.kind} over daily limit (${count}/${limit})`,
    );
    return {
      response: Response.json(
        { error: "JoJo has reached today's limit. Please try again tomorrow." },
        { status: 429 },
      ),
    };
  }
  return { caller };
}
