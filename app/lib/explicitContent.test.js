// The reply check must catch explicit text without tripping on everyday words a
// homework-helper chatbot uses all the time ("that's hard", "photos").
import { describe, it, expect } from "vitest";
import { detectVulgarContent } from "./explicitContent.js";

const flagged = (t) => detectVulgarContent(t) !== null;

describe("detectVulgarContent", () => {
  it.each([
    "send me nudes",
    "send naked pics",
    "s3x tips",
    "watch free porn now",
    "doggy style",
    "one night stand",
    "he has a boner",
    'f""ck',
    "onlyfans link",
  ])("flags %s", (t) => expect(flagged(t)).toBe(true));

  it.each([
    "Math can be hard, but you've got this!",
    "Look at my photos from the trip",
    "pics please",
    "I'm on top of the leaderboard",
    "Let's eat out tonight",
    "Put it on your night stand",
    "Can you send pics of the cake?",
    "We played dog balls at the park",
    "That joke was sexist",
    "The story's climax was exciting",
    "The lights turned on",
    "Guitar fingering charts",
    "Doggy daycare photos",
    "My uncle is a missionary",
    "I could kill for a pizza",
    "hello world",
  ])("does not flag %s", (t) => expect(flagged(t)).toBe(false));

  it("ignores one-time-code style messages", () => {
    expect(flagged("Your OTP is 123456 for sex")).toBe(false);
  });

  it("needs two mild swears, and scores them below certainty", () => {
    expect(flagged("this is crap")).toBe(false);
    expect(detectVulgarContent("wtf stfu")?.confidence).toBeCloseTo(0.85);
  });
});
