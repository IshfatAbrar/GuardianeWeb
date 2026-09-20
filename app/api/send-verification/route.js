import { getMailer } from "../../lib/mailer";
import { getAdminAuth } from "../../lib/firebaseAdmin";
import { verifyEmailEmail } from "../../lib/emails/verifyEmail";

// POST /api/send-verification
//   Authorization: Bearer <Firebase ID token of the signed-in, unverified user>
//   → { delivery: "sent" | "already" | "firebase" }
//
//   "sent"      our branded verification email went out (or one went out in the
//               last minute — see COOLDOWN_MS; the client must NOT send another).
//   "already"   the address is already verified; nothing to do.
//   "firebase"  this server can't send it (mail / Admin credentials missing,
//               or something failed) — the client should call Firebase's built-in
//               sendEmailVerification so the user still gets an email.
//
// Shared by every parent client (web, iOS, Android): they each call this with
// their own ID token instead of Firebase's stock email. The token proves who is
// asking, and the email only ever goes to that account's own address.

const COOLDOWN_MS = 60_000;
// Best-effort per-instance throttle (serverless instances don't share memory, so
// this bounds accidental hammering, not a determined attacker).
const lastSent = new Map();

export async function POST(request) {
  const header = request.headers.get("authorization") ?? "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) {
    return Response.json({ error: "Missing credentials." }, { status: 401 });
  }

  const mailer = getMailer();
  const auth = getAdminAuth();
  if (!mailer || !auth) {
    return Response.json({ delivery: "firebase" });
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  try {
    const user = await auth.getUser(decoded.uid);
    if (!user.email) return Response.json({ delivery: "firebase" });
    if (user.emailVerified) return Response.json({ delivery: "already" });

    const now = Date.now();
    if (now - (lastSent.get(user.uid) ?? 0) < COOLDOWN_MS) {
      return Response.json({ delivery: "sent" });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
    const link = await auth.generateEmailVerificationLink(
      user.email,
      siteUrl ? { url: `${siteUrl}/login` } : undefined,
    );

    const { subject, html, text } = verifyEmailEmail({
      link,
      email: user.email,
      name: user.displayName,
    });
    await mailer.send({ to: user.email, subject, html, text });

    lastSent.set(user.uid, now);
    return Response.json({ delivery: "sent" });
  } catch (err) {
    console.error("[send-verification] branded send failed:", err?.message);
    return Response.json({ delivery: "firebase" });
  }
}
