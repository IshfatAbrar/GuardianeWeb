// The verification email carries a live credential (the link) — pin that it is
// delivered intact, that it shares the reset email's card, and that nothing
// user-controlled can inject markup or a non-http(s) link.
import { describe, it, expect } from "vitest";
import { verifyEmailEmail, VERIFY_LINK_TTL } from "./verifyEmail.js";
import { passwordResetEmail } from "./passwordReset.js";

const LINK =
  "https://gurdiane-75091.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=abc123&apiKey=k";

describe("verifyEmailEmail", () => {
  it("puts the link in the button, the fallback link and the text body", () => {
    const { html, text, subject } = verifyEmailEmail({
      link: LINK,
      email: "sarah@example.com",
    });
    const encoded = LINK.replace(/&/g, "&amp;");
    expect(html.split(encoded).length - 1).toBe(3);
    expect(text).toContain(LINK);
    expect(subject).toBe("Verify your Guardiané email");
  });

  it("uses the same card as the password-reset email", () => {
    const a = verifyEmailEmail({ link: LINK }).html;
    const b = passwordResetEmail({ link: LINK }).html;
    for (const marker of [
      'Guardiane<span style="color:#1f76cc;">AI</span>',
      'valign="bottom" align="left"',
      "#dbe8fa",
      "#f5f9ff",
    ]) {
      expect(a).toContain(marker);
      expect(b).toContain(marker);
    }
    expect(a).toContain("Verify email");
    expect(a).not.toContain("Reset password");
  });

  it("states the expiry and greets by first name", () => {
    const { html, text } = verifyEmailEmail({
      link: LINK,
      name: "Sarah Johnson",
    });
    expect(html).toContain(VERIFY_LINK_TTL);
    expect(text).toContain(VERIFY_LINK_TTL);
    expect(html).toContain("Hi Sarah,");
  });

  it("escapes user-controlled values", () => {
    const { html } = verifyEmailEmail({
      link: LINK,
      email: '"><script>alert(1)</script>@x.co',
      name: "<img src=x onerror=alert(1)>",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
  });

  it("refuses links that aren't http(s)", () => {
    expect(() => verifyEmailEmail({ link: "javascript:alert(1)" })).toThrow();
    expect(() => verifyEmailEmail({ link: "" })).toThrow();
  });
});
