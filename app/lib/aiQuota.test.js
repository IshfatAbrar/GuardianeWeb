// Daily AI caps: the counter must stop at the limit, and must fail open so a
// Firestore blip never silences a child's risk alerts.
import { describe, it, expect } from "vitest";
import { consumeQuota, usageDocId, utcDay } from "./aiQuota.js";

const NOW = Date.UTC(2026, 9, 9, 15, 0, 0);

function fakeDb() {
  const store = new Map();
  return {
    store,
    collection: () => ({ doc: (id) => ({ id }) }),
    runTransaction: async (fn) =>
      fn({
        get: async (ref) => ({
          exists: store.has(ref.id),
          get: (k) => store.get(ref.id)?.[k],
        }),
        set: (ref) => {
          // FieldValue.increment(1) — the fake just counts the write.
          const prev = store.get(ref.id)?.count ?? 0;
          store.set(ref.id, { count: prev + 1 });
        },
      }),
  };
}

describe("consumeQuota", () => {
  it("allows calls up to the limit, then refuses", async () => {
    const db = fakeDb();
    const q = { route: "jojo", quotaKey: "kid:c1", limit: 2, now: NOW };
    expect((await consumeQuota(db, q)).allowed).toBe(true);
    expect((await consumeQuota(db, q)).allowed).toBe(true);
    expect(await consumeQuota(db, q)).toEqual({ allowed: false, count: 2 });
  });

  it("counts each caller and route separately", async () => {
    const db = fakeDb();
    await consumeQuota(db, {
      route: "jojo",
      quotaKey: "kid:c1",
      limit: 1,
      now: NOW,
    });
    const other = await consumeQuota(db, {
      route: "classify",
      quotaKey: "kid:c1",
      limit: 1,
      now: NOW,
    });
    expect(other.allowed).toBe(true);
  });

  it("fails open when the counter can't be reached", async () => {
    const db = {
      collection: () => ({ doc: () => ({}) }),
      runTransaction: async () => {
        throw new Error("unavailable");
      },
    };
    const res = await consumeQuota(db, {
      route: "jojo",
      quotaKey: "kid:c1",
      limit: 1,
      now: NOW,
    });
    expect(res.allowed).toBe(true);
  });

  it("is a no-op without a store, key or limit", async () => {
    expect(
      (await consumeQuota(null, { quotaKey: "k", limit: 1 })).allowed,
    ).toBe(true);
    expect(
      (await consumeQuota(fakeDb(), { quotaKey: null, limit: 1 })).allowed,
    ).toBe(true);
  });
});

describe("usageDocId", () => {
  it("is one doc per route, caller and UTC day", () => {
    expect(utcDay(NOW)).toBe("20261009");
    expect(usageDocId("jojo", "parent:abc", NOW)).toBe(
      "jojo_parent:abc_20261009",
    );
    expect(usageDocId("jojo", "a/b", NOW)).toBe("jojo_a_b_20261009");
  });
});
