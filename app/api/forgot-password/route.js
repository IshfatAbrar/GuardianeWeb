import { getMailer } from "../../lib/mailer";
import { getAdminAuth } from "../../lib/firebaseAdmin";
import { passwordResetEmail } from "../../lib/emails/passwordReset";

// POST { email } → { delivery: "sent" | "firebase" }
//
//   "sent"      we generated the reset link and emailed our branded template.
//   "firebase"  this server can't send it (mail / Admin credentials missing,
//               or something failed) — the client then calls Firebase's built-in
//               sendPasswordResetEmail so the user still gets an email.
//
// The response never reveals whether an account exists: an unknown address gets
// the same "sent" as a real one.

const EMAIL_MAX = 254;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email =
    typeof body?.email === "string"
      ? body.email.trim().slice(0, EMAIL_MAX)
      : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  // Branded send needs a mail transport (Resend or SMTP) and Firebase Admin; if
  // either is missing, use Firebase's stock email instead.
  const mailer = getMailer();
  const auth = getAdminAuth();
  if (!mailer || !auth) {
    return Response.json({ delivery: "firebase" });
  }

  try {
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (err) {
      if (err?.code === "auth/user-not-found") {
        return Response.json({ delivery: "sent" });
      }
      throw err;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
    const link = await auth.generatePasswordResetLink(
      email,
      siteUrl ? { url: `${siteUrl}/login` } : undefined,
    );

    const { subject, html, text } = passwordResetEmail({
      link,
      email,
      name: user.displayName,
    });
    await mailer.send({ to: email, subject, html, text });

    return Response.json({ delivery: "sent" });
  } catch (err) {
    // Log for us, but keep the user unblocked with Firebase's stock email.
    console.error("[forgot-password] branded send failed:", err?.message);
    return Response.json({ delivery: "firebase" });
  }
}
