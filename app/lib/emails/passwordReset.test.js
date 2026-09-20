// The reset email carries a live account-takeover credential (the link), so the
// tests pin the two things that matter: the link is put in the message intact,
// and nothing the user controls can inject markup or a non-http(s) link.
import { describe, it, expect } from "vitest";
import { passwordResetEmail, RESET_LINK_TTL } from "./passwordReset.js";

const LINK =
  "https://gurdiane-75091.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=abc123&apiKey=k";

describe("passwordResetEmail", () => {
  it("puts the reset link in the button, the fallback link and the text body", () => {
    const { html, text, subject } = passwordResetEmail({
      link: LINK,
      email: "sarah@example.com",
    });
    // `&` is entity-encoded inside HTML attributes; the text body is verbatim.
    const encoded = LINK.replace(/&/g, "&amp;");
    expect(html.split(encoded).length - 1).toBe(3); // button href + fallback href + fallback text
    expect(text).toContain(LINK);
    expect(subject).toBe("Reset your Guardiané password");
  });

  it("shows the GuardianeAI wordmark inside the card, and no lock icon", () => {
    const { html } = passwordResetEmail({ link: LINK });
    expect(html).toContain('Guardiane<span style="color:#1f76cc;">AI</span>');
    expect(html).not.toContain("&#128274;");
    expect(html).not.toContain("Georgia");
    // pinned to the bottom-left of the header, cubes in the top-right cell
    expect(html).toMatch(/valign="bottom" align="left"/);
    expect(html).toMatch(
      /valign="top" align="right"[^>]*>\s*<table[^>]*align="right"/,
    );
  });

  it("states the expiry", () => {
    const { html, text } = passwordResetEmail({ link: LINK });
    expect(html).toContain(RESET_LINK_TTL);
    expect(text).toContain(RESET_LINK_TTL);
  });

  it("greets by first name when known, generically otherwise", () => {
    expect(
      passwordResetEmail({ link: LINK, name: "Sarah Johnson" }).html,
    ).toContain("Hi Sarah,");
    expect(passwordResetEmail({ link: LINK }).html).toContain("Hi there,");
  });

  it("escapes user-controlled values", () => {
    const { html } = passwordResetEmail({
      link: LINK,
      email: '"><script>alert(1)</script>@x.co',
      name: "<img src=x onerror=alert(1)>",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
  });

  it("refuses links that aren't http(s)", () => {
    expect(() => passwordResetEmail({ link: "javascript:alert(1)" })).toThrow();
    expect(() => passwordResetEmail({ link: "not a url" })).toThrow();
    expect(() => passwordResetEmail({ link: "" })).toThrow();
  });
});
