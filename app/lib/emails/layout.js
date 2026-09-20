// Shared layout for every Guardiané transactional email (password reset, email
// verification…) — one card, one header, one footer, so they always match.
//
// Pure: no I/O, so it is unit-tested and previewed (scripts/preview-email.mjs)
// without sending anything. Email clients are stuck in 2004, so this is a
// table layout with every style inline; the <style> block only adds
// dark-mode / mobile polish for clients that honour it and is safe to lose.
//
// Colours: accent #1f76cc is the midpoint of Tailwind blue-500 (#3b82f6) and
// sky-700 (#0369a1) — a true blue with a little of the site's sky depth; white
// text on it is ~4.6:1. (The site itself still uses sky #0284c7.)

import { supportEmail } from "../../../lib/siteConfig.js";

export const BRAND = {
  accent: "#1f76cc",
  accentDark: "#1a63ad",
  ink: "#1f2329",
  muted: "#555d66",
  border: "#cfe0f6",
  wash: "#f5f9ff",
  page: "#dbe8fa",
};

// Friendly, rounded-ish sans. Epilogue is the site font but most mail clients
// won't load web fonts, so lead with it and fall back to good system sans.
export const FONT =
  "Epilogue,'Avenir Next',Avenir,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

// Wordmark + title: a step more serious than FONT — a crisp grotesque, bold,
// tightly tracked.
export const FONT_HEAD =
  "'Helvetica Neue',Helvetica,Arial,'Segoe UI',sans-serif";

/** Flat "cube" tiles for the top-right of the header (table cells, so they render in every client). */
const CUBES = [
  [null, "#c7dcf8", BRAND.accent],
  ["#c7dcf8", BRAND.accent, "#9cc3f2"],
  [BRAND.accent, "#6aa5ea", null],
];
function cubesHtml() {
  const cell = (c) =>
    c
      ? `<td width="22" height="22" bgcolor="${c}" style="width:22px;height:22px;background:${c};border-radius:5px;font-size:0;line-height:0;">&nbsp;</td>`
      : `<td width="22" height="22" style="width:22px;height:22px;font-size:0;line-height:0;">&nbsp;</td>`;
  return `<table role="presentation" cellpadding="0" cellspacing="6" border="0" align="right">${CUBES.map(
    (row) => `<tr>${row.map(cell).join("")}</tr>`,
  ).join("")}</table>`;
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only ever put http(s) links behind the button — never `javascript:` etc. */
export function assertSafeLink(link, what = "Email") {
  let url;
  try {
    url = new URL(link);
  } catch {
    throw new Error(`${what} link is not a valid URL.`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`${what} link must be http(s).`);
  }
  return url.toString();
}

export const escapedSupport = escapeHtml(supportEmail);
export { supportEmail };

/** "Hi Sarah," / "Hi there," — first name only, escaped. */
export function greetingFor(name) {
  const firstName = (name || "").trim().split(/\s+/)[0];
  return {
    firstName,
    html: firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,",
    text: firstName ? `Hi ${firstName},` : "Hi there,",
  };
}

/**
 * Render the shared email card.
 *
 * All `*Html` arguments are trusted HTML the caller has already escaped.
 * `href` must be an already-validated (assertSafeLink) http(s) URL.
 */
export function renderEmail({
  subject,
  preheader,
  title,
  greetingHtml,
  introHtml,
  buttonLabel,
  href,
  expiryHtml,
  ignoreHtml,
  footerReason,
}) {
  const safeHref = escapeHtml(href);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<style>
  @media (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .brand { font-size: 32px !important; }
  }
  @media (prefers-color-scheme: dark) {
    body, .page { background: #14181d !important; }
    .card { background: #1d2228 !important; border-color: #2e353d !important; }
    .ink { color: #f2efe9 !important; }
    .muted { color: #a9b1ba !important; }
    .wash { background: #1a2740 !important; }
    .rule { border-color: #2e353d !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};">
<!-- preheader: shown in the inbox list, hidden in the body -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" class="page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.page};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">

        <!-- card -->
        <tr>
          <td class="card" style="background:#ffffff;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

              <!-- band: text pinned bottom-left, cubes top-right -->
              <tr>
                <td class="wash" style="background:${BRAND.wash};padding:0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height:172px;">
                    <tr>
                      <td valign="bottom" align="left" style="padding:0 0 20px 24px;">
                        <div class="ink brand" style="font-family:${FONT_HEAD};font-size:40px;line-height:1;font-weight:700;letter-spacing:-1.6px;color:${BRAND.ink};">Guardiane<span style="color:${BRAND.accent};">AI</span></div>
                        <h1 class="ink" style="margin:8px 0 0;font-family:${FONT_HEAD};font-size:17px;line-height:1.2;font-weight:500;letter-spacing:-0.2px;color:${BRAND.ink};">${escapeHtml(title)}</h1>
                      </td>
                      <td valign="top" align="right" width="110" style="width:110px;padding:18px 20px 0 0;">
                        ${cubesHtml()}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- body -->
              <tr>
                <td class="px" style="padding:30px 40px 8px;font-family:${FONT};font-size:15px;line-height:1.65;color:${BRAND.ink};">
                  <p class="ink" style="margin:0 0 14px;color:${BRAND.ink};">${greetingHtml}</p>
                  <p class="muted" style="margin:0 0 24px;color:${BRAND.muted};">${introHtml}</p>
                </td>
              </tr>

              <!-- button (table-based so Outlook renders it) -->
              <tr>
                <td class="px" align="center" style="padding:0 40px 8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" bgcolor="${BRAND.accent}" style="border-radius:8px;">
                        <a href="${safeHref}" target="_blank" style="display:inline-block;padding:14px 34px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(buttonLabel)}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td class="px" style="padding:20px 40px 0;font-family:${FONT};font-size:13.5px;line-height:1.65;color:${BRAND.muted};">
                  <p class="muted" style="margin:0 0 6px;color:${BRAND.muted};">${expiryHtml}</p>
                </td>
              </tr>

              <!-- divider + didn't request -->
              <tr>
                <td class="px" style="padding:22px 40px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td class="rule" style="border-top:1px solid ${BRAND.border};font-size:0;line-height:0;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="px" style="padding:18px 40px 0;font-family:${FONT};font-size:13.5px;line-height:1.65;color:${BRAND.muted};">
                  <p class="muted" style="margin:0;color:${BRAND.muted};">${ignoreHtml}</p>
                </td>
              </tr>

              <!-- fallback link -->
              <tr>
                <td class="px" style="padding:18px 40px 32px;font-family:${FONT};font-size:12px;line-height:1.6;color:${BRAND.muted};">
                  <p class="muted" style="margin:0 0 4px;color:${BRAND.muted};">Button not working? Paste this link into your browser:</p>
                  <a href="${safeHref}" target="_blank" style="color:${BRAND.accent};word-break:break-all;">${safeHref}</a>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td align="center" class="muted" style="padding:22px 24px 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${BRAND.muted};">
            Need help? Write to <a href="mailto:${escapedSupport}" style="color:${BRAND.accent};text-decoration:none;">${escapedSupport}</a><br>
            Guardiané &middot; Protecting children&rsquo;s digital safety and mental wellbeing.<br>
            <span style="color:#8a929b;">${footerReason}</span>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
