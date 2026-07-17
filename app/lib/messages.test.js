// Tests for the pure message/alert helpers.
//
// isAlertMessage encodes a contract shared with two Android apps: GuardParent's
// `isAlert` and the child app's AlertService.sendRiskAlert. If it drifts, risk
// alerts either stop reaching the parent or ordinary chat starts rendering as
// an emergency — both bad, and neither would fail loudly.
import { describe, it, expect, vi } from "vitest";

vi.mock("./firebase", () => ({ db: {} }));

const { isAlertMessage, messageClassification, alertSeverity } = await import(
  "./messages.js"
);

// The shape AlertService actually writes.
const childAlert = (overrides = {}) => ({
  senderType: "child",
  message: "Risk detected: Emotional Distress (0.92): SMS: i feel awful",
  metadata: { source: "SMS", classification: "Emotional Distress", confidence: 0.92 },
  isRiskAlert: true,
  messageType: "risk_alert",
  ...overrides,
});

describe("messageClassification", () => {
  it("reads metadata.classification", () => {
    expect(messageClassification(childAlert())).toBe("Emotional Distress");
  });

  it("falls back to a top-level classification", () => {
    expect(
      messageClassification({ classification: "Attacking Behavior", metadata: {} }),
    ).toBe("Attacking Behavior");
  });

  it("prefers metadata over the top-level field", () => {
    const m = childAlert({ classification: "Suicidal Reference" });
    expect(messageClassification(m)).toBe("Emotional Distress");
  });

  it("is null for ordinary chat", () => {
    expect(messageClassification({ senderType: "child", message: "hi" })).toBeNull();
    expect(messageClassification(null)).toBeNull();
  });
});

describe("isAlertMessage", () => {
  it("accepts a child message carrying a classification", () => {
    expect(isAlertMessage(childAlert())).toBe(true);
  });

  it("accepts a legacy child alert with only the Risk detected: prefix", () => {
    expect(
      isAlertMessage({
        senderType: "child",
        message: "Risk detected: Suicidal Reference (0.88): SMS: ...",
      }),
    ).toBe(true);
  });

  it("does not alert on a message the classifier judged Safe/Neutral", () => {
    // Live data really does contain child rows classified "Safe/Neutral",
    // despite the child app supposedly only sending risk labels. GuardParent's
    // Boolean(classification) test raises a red alarm for these.
    expect(isAlertMessage(childAlert({ metadata: { classification: "Safe/Neutral" } }))).toBe(
      false,
    );
  });

  it("still alerts on an unrecognised label — missing a real risk is worse", () => {
    expect(isAlertMessage(childAlert({ metadata: { classification: "Some New Label" } }))).toBe(
      true,
    );
  });

  it("rejects ordinary child chat", () => {
    expect(isAlertMessage({ senderType: "child", message: "can I stay out later" })).toBe(
      false,
    );
  });

  it("will not let a parent forge an alert", () => {
    // Without the senderType check, a parent typing this text into the chat box
    // would render as a red risk alert and inflate the unread alert count.
    expect(
      isAlertMessage({
        senderType: "parent",
        message: "Risk detected: Suicidal Reference (0.99): spoofed",
      }),
    ).toBe(false);
    expect(isAlertMessage(childAlert({ senderType: "parent" }))).toBe(false);
  });

  it("rejects junk without throwing", () => {
    expect(isAlertMessage(null)).toBe(false);
    expect(isAlertMessage({})).toBe(false);
    expect(isAlertMessage({ senderType: "child" })).toBe(false);
    expect(isAlertMessage({ senderType: "child", message: 42 })).toBe(false);
  });

  it("only matches the risk prefix at the start", () => {
    expect(
      isAlertMessage({
        senderType: "child",
        message: "we talked about how Risk detected: means something",
      }),
    ).toBe(false);
  });
});

describe("alertSeverity", () => {
  it("maps each classifier label the child app can send", () => {
    expect(alertSeverity(childAlert({ metadata: { classification: "Suicidal Reference" } }))).toBe("critical");
    expect(alertSeverity(childAlert({ metadata: { classification: "Attacking Behavior" } }))).toBe("warning");
    expect(alertSeverity(childAlert({ metadata: { classification: "Emotional Distress" } }))).toBe("warning");
  });

  it("degrades an unrecognised label to info rather than dropping it", () => {
    expect(alertSeverity(childAlert({ metadata: { classification: "Something New" } }))).toBe("info");
    expect(alertSeverity({ senderType: "child", message: "Risk detected: ..." })).toBe("info");
  });
});
