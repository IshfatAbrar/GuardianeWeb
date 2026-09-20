// The parent's phone is what their child's crisis screen dials, so an
// unusable value is as bad as a missing one.
import { describe, it, expect } from "vitest";
import { isValidPhone } from "./phone.js";

describe("isValidPhone", () => {
  it("accepts common formats", () => {
    expect(isValidPhone("5551234567")).toBe(true);
    expect(isValidPhone("(555) 123-4567")).toBe(true);
    expect(isValidPhone("+1 555 123 4567")).toBe(true);
    expect(isValidPhone("  +44 20 7946 0958  ")).toBe(true);
  });

  it("rejects empty and too-short numbers", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone(null)).toBe(false);
    expect(isValidPhone(undefined)).toBe(false);
    expect(isValidPhone("555-1234")).toBe(false);
  });

  it("rejects more than 15 digits", () => {
    expect(isValidPhone("1234567890123456")).toBe(false);
  });

  it("rejects letters and a + anywhere but the start", () => {
    expect(isValidPhone("555-CALL-NOW-1")).toBe(false);
    expect(isValidPhone("555+123+4567")).toBe(false);
  });
});
