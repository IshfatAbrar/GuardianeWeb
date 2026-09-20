// Password-reset email — branded HTML + plain-text alternative.
// Pure (no I/O): unit-tested, and previewable with scripts/preview-email.mjs.
// Layout lives in ./layout.js so it always matches the other emails.

import {
  BRAND,
  assertSafeLink,
  escapeHtml,
  greetingFor,
  renderEmail,
  supportEmail,
} from "./layout.js";

/** How long a Firebase password-reset link stays valid (fixed by Firebase). */
export const RESET_LINK_TTL = "1 hour";

/**
 * @param {{ link: string, email?: string, name?: string }} args
 * @returns {{ subject: string, html: string, text: string }}
 */
export function passwordResetEmail({ link, email, name }) {
  const safeLink = assertSafeLink(link, "Password reset");
  const greeting = greetingFor(name);
  const forLine = email
    ? `for the Guardiané account <strong style="color:${BRAND.ink};">${escapeHtml(email)}</strong>`
    : "for your Guardiané account";

  const subject = "Reset your Guardiané password";

  const html = renderEmail({
    subject,
    preheader: `Use this link to choose a new password. It expires in ${RESET_LINK_TTL}.`,
    title: "Reset password",
    greetingHtml: greeting.html,
    introHtml: `We received a request to reset the password ${forLine}. Choose a new one with the button below.`,
    buttonLabel: "Reset password",
    href: safeLink,
    expiryHtml: `For your security this link expires in <strong class="ink" style="color:${BRAND.ink};">${RESET_LINK_TTL}</strong> and can only be used once.`,
    ignoreHtml: `<strong class="ink" style="color:${BRAND.ink};">Didn&rsquo;t ask for this?</strong> You can safely ignore this email &mdash; your password won&rsquo;t change and your family&rsquo;s data stays private.`,
    footerReason:
      "You&rsquo;re receiving this because a password reset was requested for this address.",
  });

  const text = [
    greeting.text,
    "",
    `We received a request to reset the password ${email ? `for the Guardiané account ${email}` : "for your Guardiané account"}.`,
    "",
    "Choose a new password here:",
    safeLink,
    "",
    `This link expires in ${RESET_LINK_TTL} and can only be used once.`,
    "",
    "Didn't ask for this? You can safely ignore this email — your password won't change.",
    "",
    `Need help? ${supportEmail}`,
    "Guardiané — Protecting children's digital safety and mental wellbeing.",
  ].join("\n");

  return { subject, html, text };
}
