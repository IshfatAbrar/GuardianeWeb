// Answers to a child's app-access request. firestore.rules only accepts a
// whole number of minutes from 1 to 240; reject anything else before writing.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./firebase", () => ({ db: {} }));
const updateDoc = vi.fn(async () => {});
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn((_db, col, id) => ({ col, id })),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  updateDoc: (...args) => updateDoc(...args),
  serverTimestamp: () => "SERVER_TS",
}));

const {
  approveAccessRequest,
  denyAccessRequest,
  pendingRequests,
  MAX_GRANT_MINUTES,
} = await import("./accessRequests.js");

beforeEach(() => updateDoc.mockClear());

describe("approveAccessRequest", () => {
  it("writes approved + minutes + respondedAt only", async () => {
    await approveAccessRequest("r1", 30);
    expect(updateDoc).toHaveBeenCalledWith(
      { col: "access_requests", id: "r1" },
      { status: "approved", grantedMinutes: 30, respondedAt: "SERVER_TS" },
    );
  });

  it("rounds to whole minutes", async () => {
    await approveAccessRequest("r1", 14.6);
    expect(updateDoc.mock.calls[0][1].grantedMinutes).toBe(15);
  });

  it("rejects what the rules would refuse", async () => {
    for (const bad of [0, -5, MAX_GRANT_MINUTES + 1, NaN, "abc"]) {
      await expect(approveAccessRequest("r1", bad)).rejects.toThrow();
    }
    await expect(approveAccessRequest("", 15)).rejects.toThrow();
    expect(updateDoc).not.toHaveBeenCalled();
  });
});

describe("denyAccessRequest", () => {
  it("writes denied + respondedAt only", async () => {
    await denyAccessRequest("r2");
    expect(updateDoc).toHaveBeenCalledWith(
      { col: "access_requests", id: "r2" },
      { status: "denied", respondedAt: "SERVER_TS" },
    );
  });
});

describe("pendingRequests", () => {
  it("keeps only pending rows", () => {
    expect(
      pendingRequests([
        { id: "a", status: "pending" },
        { id: "b", status: "approved" },
        { id: "c", status: "denied" },
      ]).map((r) => r.id),
    ).toEqual(["a"]);
    expect(pendingRequests(undefined)).toEqual([]);
  });
});
