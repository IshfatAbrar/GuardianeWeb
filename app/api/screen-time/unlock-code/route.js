import { Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "../../../lib/firebaseAdmin";
import {
  generateCode,
  newUnlock,
  UNLOCKS_COLLECTION,
  isValidChildId,
} from "../../../lib/screenTimeUnlock";

// POST /api/screen-time/unlock-code
//   Authorization: Bearer <Firebase ID token of the parent>
//   body: { childId }
//   → { code, expiresAt }   — six digits, valid 10 minutes, one use
//
// Issues the code that opens the Screen Time settings on that child's iPhone
// (see app/lib/screenTimeUnlock.js). Only the child's own parent may ask: the
// token proves who is asking, and the child doc's parentId must match. Called
// by the web dashboard and the iOS parent app alike.

export async function POST(request) {
  const header = request.headers.get("authorization") ?? "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) {
    return Response.json({ error: "Missing credentials." }, { status: 401 });
  }

  const auth = getAdminAuth();
  const db = getAdminFirestore();
  if (!auth || !db) {
    return Response.json(
      { error: "Screen Time unlock isn't configured on this server." },
      { status: 503 },
    );
  }

  let uid;
  try {
    uid = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const childId = typeof body?.childId === "string" ? body.childId.trim() : "";
  if (!isValidChildId(childId)) {
    return Response.json(
      { error: "Missing or invalid childId." },
      { status: 400 },
    );
  }

  const child = await db.collection("users").doc(childId).get();
  if (
    !child.exists ||
    child.get("role") !== "child" ||
    child.get("parentId") !== uid
  ) {
    return Response.json({ error: "Not your child." }, { status: 403 });
  }

  const code = generateCode();
  const { expiresAtMs, ...unlock } = newUnlock({ code, parentUid: uid });
  await db
    .collection(UNLOCKS_COLLECTION)
    .doc(childId)
    .set({
      ...unlock,
      expiresAt: Timestamp.fromMillis(expiresAtMs),
      createdAt: Timestamp.now(),
    });

  return Response.json({
    code,
    expiresAt: new Date(expiresAtMs).toISOString(),
  });
}
