// Server-only outbound mail for the branded emails (password reset, email
// verification). Two interchangeable transports, chosen from env:
//
//   Resend  RESEND_API_KEY + RESEND_FROM (a sender on a domain verified in Resend)
//   SMTP    SMTP_USER + SMTP_PASS          (e.g. Gmail + an App password)
//             optional: SMTP_FROM  display sender, default "Guardiane <SMTP_USER>"
//                       SMTP_HOST / SMTP_PORT  default smtp.gmail.com / 465
//
// Resend wins when both are configured (it is the production-grade option). With
// neither, `getMailer()` returns null and callers fall back to Firebase's stock
// email — nothing breaks unconfigured.

import { Resend } from "resend";
import nodemailer from "nodemailer";

/**
 * Pure: decide which transport `env` configures.
 * @returns {{ kind: "resend", apiKey: string, from: string }
 *   | { kind: "smtp", host: string, port: number, user: string, pass: string, from: string }
 *   | null}
 */
export function resolveMailConfig(env) {
  const apiKey = env.RESEND_API_KEY?.trim();
  // A verified sending domain is required for Resend: its shared
  // onboarding@resend.dev sender only delivers to the account owner, so without
  // RESEND_FROM we don't try.
  const resendFrom = env.RESEND_FROM?.trim();
  if (apiKey && resendFrom) {
    return { kind: "resend", apiKey, from: resendFrom };
  }

  const user = env.SMTP_USER?.trim();
  // Google shows App passwords in four space-separated groups; strip the spaces.
  const pass = env.SMTP_PASS?.replace(/\s+/g, "");
  if (user && pass) {
    const port = Number(env.SMTP_PORT) || 465;
    return {
      kind: "smtp",
      host: env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port,
      user,
      pass,
      from: env.SMTP_FROM?.trim() || `Guardiane <${user}>`,
    };
  }
  return null;
}

/**
 * @returns {{ send: (m: { to: string, subject: string, html: string, text: string }) => Promise<void> } | null}
 * `send` throws on any failure so callers can fall back.
 */
export function getMailer(env = process.env) {
  const config = resolveMailConfig(env);
  if (!config) return null;

  if (config.kind === "resend") {
    const resend = new Resend(config.apiKey);
    return {
      async send({ to, subject, html, text }) {
        const { error } = await resend.emails.send({
          from: config.from,
          to: [to],
          subject,
          html,
          text,
        });
        if (error)
          throw new Error(error.message || "Resend rejected the email.");
      },
    };
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
  return {
    async send({ to, subject, html, text }) {
      await transport.sendMail({ from: config.from, to, subject, html, text });
    },
  };
}
