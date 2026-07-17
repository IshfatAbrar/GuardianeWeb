// Tests for the pure, schema-critical helpers in database.js.
//
// childQrPayload encodes the device-pairing contract with the Android child
// app, which is the single easiest thing to break here: the app feeds the
// scanned string straight into doc(db,'users',<scanned>), so any prefix,
// wrapper or trimming silently breaks pairing with a "No user found" toast and
// no clue why.
import { describe, it, expect, vi } from "vitest";

// database.js pulls in ./firebase at module scope, which would try to stand up
// a real Firebase app from env vars that don't exist under vitest.
vi.mock("./firebase", () => ({ db: {} }));

const { childQrPayload, ageFromBirthDate } = await import("./database.js");

describe("childQrPayload", () => {
  it("is the child's raw document id, with nothing added", () => {
    expect(childQrPayload({ id: "abc123XYZ" })).toBe("abc123XYZ");
  });

  it("does not re-introduce the guardiane: prefix the child app rejects", () => {
    const payload = childQrPayload({ id: "abc123", name: "Ann", parentId: "p1" });
    expect(payload).not.toContain("guardiane:");
    expect(payload).not.toContain(":");
    expect(payload).toBe("abc123");
  });

  it("ignores every other field on the child", () => {
    expect(childQrPayload({ id: "x1", name: "Ann", role: "child" })).toBe("x1");
  });

  it("is empty (not 'undefined') when there is no usable id", () => {
    expect(childQrPayload(null)).toBe("");
    expect(childQrPayload(undefined)).toBe("");
    expect(childQrPayload({})).toBe("");
    expect(childQrPayload({ id: 123 })).toBe("");
  });
});

describe("ageFromBirthDate", () => {
  // GuardParent writes birthDate as an MM/DD/YYYY string — never a Timestamp.
  const yearsAgo = (n, monthOffset = 0) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - n);
    d.setMonth(d.getMonth() + monthOffset);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}/${d.getFullYear()}`;
  };

  it("computes whole years from an MM/DD/YYYY string", () => {
    expect(ageFromBirthDate(yearsAgo(10))).toBe(10);
  });

  it("does not round up before the birthday has passed", () => {
    // Born 10 years ago but two months from now → still 9.
    expect(ageFromBirthDate(yearsAgo(10, 2))).toBe(9);
  });

  it("returns null for input it cannot parse", () => {
    expect(ageFromBirthDate("")).toBeNull();
    expect(ageFromBirthDate(null)).toBeNull();
    expect(ageFromBirthDate(undefined)).toBeNull();
    expect(ageFromBirthDate("2015-06-01")).toBeNull(); // ISO, not the stored format
    expect(ageFromBirthDate("nonsense")).toBeNull();
  });

  it("rejects an implausible age rather than rendering a wild number", () => {
    expect(ageFromBirthDate("01/01/1500")).toBeNull();
    expect(ageFromBirthDate(`01/01/${new Date().getFullYear() + 5}`)).toBeNull();
  });
});
