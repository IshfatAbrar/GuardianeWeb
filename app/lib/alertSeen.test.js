// Seen vs read: opening the bell or Crisis tab silences red badges and the
// critical popup for what was on screen, without hiding those alerts or
// muting anything newer.
import { describe, it, expect, vi } from "vitest";

vi.mock("./firebase", () => ({ db: {} }));
const { seenAtMillis, unseenAlerts, nextSeenAt } =
  await import("./alertSeen.js");

const alert = (id, timestampMs) => ({ id, timestampMs });

describe("seenAtMillis", () => {
  it("reads a Firestore Timestamp off the profile", () => {
    expect(seenAtMillis({ alertsSeenAt: { toMillis: () => 1234 } })).toBe(1234);
  });
  it("is 0 when the parent never opened the bell", () => {
    expect(seenAtMillis({})).toBe(0);
    expect(seenAtMillis(null)).toBe(0);
  });
});

describe("unseenAlerts", () => {
  const alerts = [alert("old", 100), alert("edge", 200), alert("new", 300)];

  it("everything is unseen before the first look", () => {
    expect(unseenAlerts(alerts, 0)).toHaveLength(3);
  });

  it("only alerts newer than the watermark still notify", () => {
    expect(unseenAlerts(alerts, 200).map((a) => a.id)).toEqual(["new"]);
  });

  it("handles missing input", () => {
    expect(unseenAlerts(undefined, 0)).toEqual([]);
  });
});

describe("nextSeenAt", () => {
  it("moves to the newest alert on screen", () => {
    expect(nextSeenAt([alert("a", 100), alert("b", 300)], 0)).toBe(300);
  });

  it("never moves backwards or writes a no-op", () => {
    expect(nextSeenAt([alert("a", 100)], 300)).toBeNull();
    expect(nextSeenAt([alert("a", 300)], 300)).toBeNull();
    expect(nextSeenAt([], 0)).toBeNull();
  });

  it("after a look, a newer alert notifies again", () => {
    const seen = nextSeenAt([alert("a", 100), alert("b", 200)], 0);
    const later = [alert("a", 100), alert("b", 200), alert("c", 250)];
    expect(unseenAlerts(later, seen).map((a) => a.id)).toEqual(["c"]);
  });
});
