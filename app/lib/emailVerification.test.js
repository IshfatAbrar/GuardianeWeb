import { describe, it, expect } from "vitest";
import { isVerified } from "./emailVerification.js";

describe("isVerified", () => {
  it("passes a verified user", () => {
    expect(isVerified({ email: "a@b.co", emailVerified: true })).toBe(true);
  });

  it("blocks an unverified user", () => {
    expect(isVerified({ email: "a@b.co", emailVerified: false })).toBe(false);
    expect(isVerified({ email: "a@b.co" })).toBe(false);
  });

  it("exempts test@gmail.com only, case-insensitively", () => {
    expect(isVerified({ email: "test@gmail.com", emailVerified: false })).toBe(
      true,
    );
    expect(
      isVerified({ email: " Test@Gmail.com ", emailVerified: false }),
    ).toBe(true);
    expect(isVerified({ email: "test2@gmail.com", emailVerified: false })).toBe(
      false,
    );
    expect(isVerified({ email: "xtest@gmail.com", emailVerified: false })).toBe(
      false,
    );
  });

  it("blocks no user / no email", () => {
    expect(isVerified(null)).toBe(false);
    expect(isVerified({ emailVerified: false })).toBe(false);
  });
});
