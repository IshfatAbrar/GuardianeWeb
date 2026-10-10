// Who may use JoJo and the classifier is the whole point of moving the key to
// the server, so each caller kind is pinned down here with fake Admin services.
import { describe, it, expect } from "vitest";
import {
  bearerToken,
  CallerError,
  clientIp,
  dailyLimit,
  hashIp,
  identifyCaller,
  requireAuth,
} from "./aiCaller.js";

const USERS = {
  parent1: { role: "parent" },
  child1: { role: "child", parentId: "parent1" },
  anonUid: null,
};

const fakeAuth = {
  verifyIdToken: async (token) => {
    if (token === "parent-token") return { uid: "parent1" };
    if (token === "anon-token") return { uid: "anonUid" };
    throw new Error("bad token");
  },
};

const fakeDb = {
  collection: () => ({
    doc: (id) => ({
      get: async () => {
        const data = USERS[id];
        return { exists: Boolean(data), get: (k) => data?.[k] };
      },
    }),
  }),
};

const call = (overrides) =>
  identifyCaller({
    route: "jojo",
    authorization: "",
    ip: "1.2.3.4",
    strict: false,
    auth: fakeAuth,
    db: fakeDb,
    ...overrides,
  });

async function rejection(promise) {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error("expected a rejection");
}

describe("identifyCaller", () => {
  it("recognises a parent by their ID token", async () => {
    const caller = await call({ authorization: "Bearer parent-token" });
    expect(caller).toMatchObject({
      kind: "parent",
      quotaKey: "parent:parent1",
    });
  });

  it("recognises a kid device by token plus a real child id", async () => {
    const caller = await call({
      authorization: "Bearer anon-token",
      childId: "child1",
    });
    expect(caller).toMatchObject({ kind: "kid", quotaKey: "kid:child1" });
  });

  it("refuses a kid token naming a child that isn't one", async () => {
    const e = await rejection(
      call({ authorization: "Bearer anon-token", childId: "parent1" }),
    );
    expect(e).toBeInstanceOf(CallerError);
    expect(e.status).toBe(403);
  });

  it("refuses a valid token that is neither a parent nor a paired kid", async () => {
    const e = await rejection(call({ authorization: "Bearer anon-token" }));
    expect(e.status).toBe(403);
  });

  it("refuses a bad token outright, even before the cutover", async () => {
    const e = await rejection(call({ authorization: "Bearer forged" }));
    expect(e.status).toBe(401);
  });

  it("treats no token as legacy before the cutover and guest after it", async () => {
    const legacy = await call({});
    expect(legacy.kind).toBe("legacy");
    expect(legacy.quotaKey).toBe(`legacy:${hashIp("1.2.3.4")}`);
    expect((await call({ strict: true })).kind).toBe("guest");
  });

  it("gives the public /chatbot page guest limits even before the cutover", async () => {
    const caller = await call({ client: "web-guest" });
    expect(caller.kind).toBe("guest");
  });

  it("never lets a tokenless caller classify", async () => {
    const e = await rejection(call({ route: "classify" }));
    expect(e.status).toBe(401);
  });

  it("runs unmetered without Admin before the cutover, refuses after", async () => {
    const lenient = await call({ auth: null, db: null });
    expect(lenient.quotaKey).toBeNull();
    const e = await rejection(call({ auth: null, db: null, strict: true }));
    expect(e.status).toBe(503);
  });

  it("rejects a malformed childId", async () => {
    const e = await rejection(
      call({ authorization: "Bearer anon-token", childId: "../users/x" }),
    );
    expect(e.status).toBe(400);
  });
});

describe("helpers", () => {
  it("reads bearer tokens", () => {
    expect(bearerToken("Bearer abc ")).toBe("abc");
    expect(bearerToken("Basic abc")).toBe("");
    expect(bearerToken(null)).toBe("");
  });

  it("takes the first forwarded IP", () => {
    const headers = new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" });
    expect(clientIp(headers)).toBe("9.9.9.9");
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("hashes IPs so raw addresses are never stored", () => {
    expect(hashIp("1.2.3.4")).toMatch(/^[0-9a-f]{32}$/);
    expect(hashIp("1.2.3.4")).not.toContain("1.2.3.4");
  });

  it("only allows the kinds each route expects", () => {
    expect(dailyLimit("classify", "kid")).toBe(500);
    expect(dailyLimit("classify", "guest")).toBeNull();
    expect(dailyLimit("jojo", "guest")).toBe(30);
  });

  it("only turns strict mode on for the exact string", () => {
    expect(requireAuth({ AI_REQUIRE_AUTH: "true" })).toBe(true);
    expect(requireAuth({ AI_REQUIRE_AUTH: "1" })).toBe(false);
    expect(requireAuth({})).toBe(false);
  });
});
