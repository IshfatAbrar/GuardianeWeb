import { describe, it, expect } from "vitest";
import { resolveMailConfig } from "./mailer.js";

describe("resolveMailConfig", () => {
  it("is null when nothing is configured (callers fall back to Firebase)", () => {
    expect(resolveMailConfig({})).toBeNull();
  });

  it("uses Gmail SMTP from SMTP_USER + SMTP_PASS, stripping spaces in the app password", () => {
    const c = resolveMailConfig({
      SMTP_USER: "me@gmail.com",
      SMTP_PASS: "abcd efgh ijkl mnop",
    });
    expect(c).toMatchObject({
      kind: "smtp",
      host: "smtp.gmail.com",
      port: 465,
      user: "me@gmail.com",
      pass: "abcdefghijklmnop",
      from: "Guardiane <me@gmail.com>",
    });
  });

  it("honours SMTP_FROM / SMTP_HOST / SMTP_PORT", () => {
    const c = resolveMailConfig({
      SMTP_USER: "u",
      SMTP_PASS: "p",
      SMTP_FROM: "Guardiane AI <hi@x.co>",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
    });
    expect(c).toMatchObject({
      host: "smtp.example.com",
      port: 587,
      from: "Guardiane AI <hi@x.co>",
    });
  });

  it("needs both SMTP_USER and SMTP_PASS", () => {
    expect(resolveMailConfig({ SMTP_USER: "me@gmail.com" })).toBeNull();
    expect(resolveMailConfig({ SMTP_PASS: "p" })).toBeNull();
  });

  it("needs RESEND_FROM as well as the key for Resend", () => {
    expect(resolveMailConfig({ RESEND_API_KEY: "re_x" })).toBeNull();
    expect(
      resolveMailConfig({ RESEND_API_KEY: "re_x", RESEND_FROM: "G <a@b.co>" }),
    ).toMatchObject({ kind: "resend", from: "G <a@b.co>" });
  });

  it("prefers Resend when both are configured", () => {
    const c = resolveMailConfig({
      RESEND_API_KEY: "re_x",
      RESEND_FROM: "G <a@b.co>",
      SMTP_USER: "me@gmail.com",
      SMTP_PASS: "p",
    });
    expect(c.kind).toBe("resend");
  });
});
