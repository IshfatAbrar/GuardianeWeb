// Email-verification email — same card as the password reset (see ./layout.js),
// different words. Pure (no I/O): unit-tested and previewable.

import {
  BRAND,
  assertSafeLink,
  escapeHtml,
  greetingFor,
  renderEmail,
  supportEmail,
} from "./layout.js";

/** How long a Firebase email-verification link stays valid (fixed by Firebase: 3 days). */
export const VERIFY_LINK_TTL = "3 days";

/**
 * @param {{ link: string, email?: string, name?: string }} args
 * @returns {{ subject: string, html: string, text: string }}
 */
export function verifyEmailEmail({ link, email, name }) {
  const safeLink = assertSafeLink(link, "Email verification");
  const greeting = greetingFor(name);
  const forLine = email
    ? `<strong style="color:${BRAND.ink};">${escapeHtml(email)}</strong>`
    : "your email address";

  const subject = "Verify your Guardiané email";

  const html = renderEmail({
    subject,
    preheader: `Confirm your email to finish setting up your account. The link works for ${VERIFY_LINK_TTL}.`,
    title: "Verify email",
    greetingHtml: greeting.html,
    introHtml: `Welcome to Guardiané! Please confirm ${forLine} so we know it&rsquo;s really you and can keep your family&rsquo;s account secure.`,
    buttonLabel: "Verify email",
    href: safeLink,
    expiryHtml: `This link works for <strong class="ink" style="color:${BRAND.ink};">${VERIFY_LINK_TTL}</strong>. After that, just request a new one when you sign in.`,
    ignoreHtml: `<strong class="ink" style="color:${BRAND.ink};">Didn&rsquo;t create an account?</strong> You can safely ignore this email &mdash; nothing will be set up without your confirmation.`,
    footerReason:
      "You&rsquo;re receiving this because this address was used to sign up for Guardiané.",
  });

  const text = [
    greeting.text,
    "",
    `Welcome to Guardiané! Please confirm ${email ? email : "your email address"} so we know it's really you and can keep your family's account secure.`,
    "",
    "Verify your email here:",
    safeLink,
    "",
    `This link works for ${VERIFY_LINK_TTL}. After that, just request a new one when you sign in.`,
    "",
    "Didn't create an account? You can safely ignore this email — nothing will be set up without your confirmation.",
    "",
    `Need help? ${supportEmail}`,
    "Guardiané — Protecting children's digital safety and mental wellbeing.",
  ].join("\n");

  return { subject, html, text };
}
