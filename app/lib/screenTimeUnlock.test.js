// The Screen Time unlock code is the only thing between a child and turning
// their own limits off, so its checks are pinned down here.
import { describe, it, expect } from "vitest";
import {
  generateCode,
  newUnlock,
  checkGuess,
  cleanCode,
  isValidChildId,
  CODE_LENGTH,
  CODE_TTL_MS,
  MAX_ATTEMPTS,
} from "./screenTimeUnlock.js";

const NOW = 1_700_000_000_000;
const make = (code = "123456") => ({
  ...newUnlock({ code, parentUid: "p1", now: NOW }),
});

describe("generateCode", () => {
  it("is always six digits, leading zeros kept", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
    expect(CODE_LENGTH).toBe(6);
  });
});

describe("newUnlock", () => {
  it("never stores the code itself", () => {
    const u = make("123456");
    expect(JSON.stringify(u)).not.toContain("123456");
    expect(u.attempts).toBe(0);
    expect(u.expiresAtMs).toBe(NOW + CODE_TTL_MS);
    expect(u.createdBy).toBe("p1");
  });

  it("salts each code differently", () => {
    expect(make("123456").codeHash).not.toBe(make("123456").codeHash);
  });
});

describe("checkGuess", () => {
  it("accepts the right code once, then it's gone", () => {
    expect(checkGuess(make("123456"), "123456", NOW + 1000)).toMatchObject({
      result: "ok",
      action: "delete",
    });
  });

  it("accepts spaces and dashes in what was typed", () => {
    expect(cleanCode(" 123-456 ")).toBe("123456");
    expect(checkGuess(make("123456"), "123 456", NOW).result).toBe("ok");
  });

  it("counts wrong guesses down and locks at the limit", () => {
    const u = make("123456");
    const first = checkGuess(u, "000000", NOW);
    expect(first).toMatchObject({
      result: "wrong",
      attemptsLeft: MAX_ATTEMPTS - 1,
      action: "increment",
    });
    const last = checkGuess(
      { ...u, attempts: MAX_ATTEMPTS - 1 },
      "000000",
      NOW,
    );
    expect(last).toMatchObject({ result: "locked", action: "delete" });
  });

  it("refuses even the right code once locked", () => {
    const u = { ...make("123456"), attempts: MAX_ATTEMPTS };
    expect(checkGuess(u, "123456", NOW).result).toBe("locked");
  });

  it("expires after ten minutes", () => {
    const u = make("123456");
    expect(checkGuess(u, "123456", NOW + CODE_TTL_MS).result).toBe("expired");
    expect(checkGuess(null, "123456", NOW).result).toBe("expired");
  });

  it("rejects partial or empty codes", () => {
    const u = make("123456");
    expect(checkGuess(u, "12345", NOW).result).toBe("wrong");
    expect(checkGuess(u, "", NOW).result).toBe("wrong");
  });
});

describe("isValidChildId", () => {
  it("accepts Firestore auto-ids and rejects anything else", () => {
    expect(isValidChildId("3AT2Gp1AzFiDmYJ0Qvv9")).toBe(true);
    expect(isValidChildId("__reserved__")).toBe(false);
    expect(isValidChildId("a/b")).toBe(false);
    expect(isValidChildId("")).toBe(false);
    expect(isValidChildId(42)).toBe(false);
  });
});
