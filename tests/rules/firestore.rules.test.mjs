// Firestore security rules, checked against the local emulator.
// Run with `npm run test:rules` (needs Java and the Firebase CLI).
//
// firestore.rules is shared by every client: the web app, both parent apps and
// both kid apps, and the kid apps are unauthenticated. These tests pin the
// guarantees each of them relies on, so a rules edit that breaks one fails
// here instead of in production.

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-guardiane",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // Seed with rules disabled (like the Admin SDK / seed scripts).
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users/parentA"), { role: "parent" });
    await setDoc(doc(db, "users/parentB"), { role: "parent" });
    await setDoc(doc(db, "users/child1"), {
      role: "child",
      parentId: "parentA",
      screenTimeLimitMinutes: 60,
    });
    await setDoc(doc(db, "modules/ownedByA"), {
      title: "A's module",
      createdBy: "parentA",
      lessonCount: 1,
    });
    await setDoc(doc(db, "modules/ownedByA/lessons/l1"), {
      title: "Lesson",
      createdBy: "parentA",
    });
    await setDoc(doc(db, "modules/builtin1"), { moduleId: "builtin1" });
    await setDoc(doc(db, "chatSessions/s1"), {
      userId: "parentA",
      createdAt: Timestamp.now(),
    });
  });
});

const asParent = (uid) => env.authenticatedContext(uid).firestore();
const asChildDevice = () => env.unauthenticatedContext().firestore();

describe("modules: only the creator edits", () => {
  it("lets a parent create a module they own", async () => {
    await assertSucceeds(
      setDoc(doc(asParent("parentA"), "modules/new1"), {
        title: "New",
        createdBy: "parentA",
      }),
    );
  });

  it("refuses a module claiming another parent as creator", async () => {
    await assertFails(
      setDoc(doc(asParent("parentA"), "modules/new2"), {
        title: "Forged",
        createdBy: "parentB",
      }),
    );
  });

  it("allows Android's creator-less placeholder, and nothing else creator-less", async () => {
    await assertSucceeds(
      setDoc(doc(asParent("parentB"), "modules/placeholder"), {
        moduleId: "placeholder",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(asParent("parentB"), "modules/spam"), {
        title: "Looks built-in",
      }),
    );
  });

  it("lets the creator edit and delete, nobody else", async () => {
    await assertFails(
      updateDoc(doc(asParent("parentB"), "modules/ownedByA"), {
        title: "Hijacked",
      }),
    );
    await assertFails(deleteDoc(doc(asParent("parentB"), "modules/ownedByA")));
    await assertSucceeds(
      updateDoc(doc(asParent("parentA"), "modules/ownedByA"), {
        title: "Renamed",
      }),
    );
    await assertSucceeds(
      deleteDoc(doc(asParent("parentA"), "modules/ownedByA")),
    );
  });

  it("doesn't let the creator hand the module to someone else", async () => {
    await assertFails(
      updateDoc(doc(asParent("parentA"), "modules/ownedByA"), {
        createdBy: "parentB",
      }),
    );
  });

  it("lets any parent bump a built-in module's lessonCount, nothing more", async () => {
    await assertSucceeds(
      updateDoc(doc(asParent("parentB"), "modules/builtin1"), {
        lessonCount: 2,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(asParent("parentB"), "modules/builtin1"), {
        title: "Changed",
      }),
    );
    await assertFails(deleteDoc(doc(asParent("parentB"), "modules/builtin1")));
  });

  it("creates a module and its first lesson in one batch (web + iOS)", async () => {
    const db = asParent("parentA");
    const batch = writeBatch(db);
    const moduleRef = doc(collection(db, "modules"));
    batch.set(moduleRef, { title: "Batch", createdBy: "parentA" });
    batch.set(doc(collection(db, `modules/${moduleRef.id}/lessons`)), {
      title: "First",
      createdBy: "parentA",
    });
    await assertSucceeds(batch.commit());
  });

  it("only the creator adds or edits lessons on an owned module", async () => {
    await assertFails(
      addDoc(collection(asParent("parentB"), "modules/ownedByA/lessons"), {
        title: "Intruder",
        createdBy: "parentB",
      }),
    );
    await assertFails(
      updateDoc(doc(asParent("parentB"), "modules/ownedByA/lessons/l1"), {
        title: "Edited",
      }),
    );
    await assertSucceeds(
      addDoc(collection(asParent("parentA"), "modules/ownedByA/lessons"), {
        title: "Mine",
        createdBy: "parentA",
      }),
    );
  });

  it("any parent may add lessons to a built-in module", async () => {
    await assertSucceeds(
      addDoc(collection(asParent("parentB"), "modules/builtin1/lessons"), {
        title: "Extra",
        createdBy: "parentB",
      }),
    );
  });

  it("the child app can still read modules without signing in", async () => {
    await assertSucceeds(getDoc(doc(asChildDevice(), "modules/ownedByA")));
    await assertSucceeds(
      getDoc(doc(asChildDevice(), "modules/ownedByA/lessons/l1")),
    );
    await assertFails(
      setDoc(doc(asChildDevice(), "modules/x"), { createdBy: null }),
    );
  });
});

describe("users", () => {
  it("lets the child device report only its Screen Time status", async () => {
    await assertSucceeds(
      updateDoc(doc(asChildDevice(), "users/child1"), {
        screenTimeStatus: { authorized: true, isMonitoring: true },
        devicePlatform: "ios",
      }),
    );
    await assertFails(
      updateDoc(doc(asChildDevice(), "users/child1"), {
        screenTimeLimitMinutes: 9999,
      }),
    );
    await assertFails(
      updateDoc(doc(asChildDevice(), "users/child1"), { parentId: "attacker" }),
    );
  });

  it("only the child's own parent edits the child doc", async () => {
    await assertSucceeds(
      updateDoc(doc(asParent("parentA"), "users/child1"), {
        screenTimeLimitMinutes: 30,
      }),
    );
    // A different value: a write that changes nothing is a no-op the rules
    // allow, which would make this pass without proving anything.
    await assertFails(
      updateDoc(doc(asParent("parentB"), "users/child1"), {
        screenTimeLimitMinutes: 45,
      }),
    );
  });
});

describe("messages (child app is unauthenticated)", () => {
  it("lets the child app write a risk alert without signing in", async () => {
    await assertSucceeds(
      addDoc(collection(asChildDevice(), "messages"), {
        childId: "child1",
        parentId: "parentA",
        senderType: "child",
        message: "Risk detected: Suicidal Reference (1.00): …",
      }),
    );
  });

  it("only a signed-in parent deletes", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "messages/m1"), {
        childId: "child1",
        senderType: "child",
      });
    });
    await assertFails(deleteDoc(doc(asChildDevice(), "messages/m1")));
    await assertSucceeds(deleteDoc(doc(asParent("parentA"), "messages/m1")));
  });
});

describe("private collections", () => {
  it("keeps JoJo chat sessions to their owner", async () => {
    await assertSucceeds(getDoc(doc(asParent("parentA"), "chatSessions/s1")));
    await assertFails(getDoc(doc(asParent("parentB"), "chatSessions/s1")));
  });

  it("never exposes server-only collections to clients", async () => {
    for (const path of [
      "ai_usage/jojo_kid:child1_20261009",
      "screen_time_unlocks/child1",
    ]) {
      await assertFails(getDoc(doc(asParent("parentA"), path)));
      await assertFails(setDoc(doc(asParent("parentA"), path), { count: 0 }));
      await assertFails(getDoc(doc(asChildDevice(), path)));
    }
  });

  it("accepts a well-formed guest lead and never lets it be read", async () => {
    const lead = {
      email: "a@b.co",
      phone: "",
      name: "Sam",
      childInfo: "",
      zip: "",
      source: "jojo-guest",
      createdAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(doc(asChildDevice(), "jojoLeads/l1"), lead));
    await assertFails(
      setDoc(doc(asChildDevice(), "jojoLeads/l2"), { ...lead, extra: "x" }),
    );
    await assertFails(getDoc(doc(asChildDevice(), "jojoLeads/l1")));
  });
});
