// Tests for the pure emergency-contact helper.
//
// telHref feeds a `tel:` link. Real contacts are stored as free text
// ("+1 (555) 123-4567"), which a dialler won't accept verbatim — and this is
// the crisis path, so a link that silently does nothing is the worst outcome.
import { describe, it, expect, vi } from "vitest";

vi.mock("./firebase", () => ({ db: {} }));

const { telHref } = await import("./emergencyContacts.js");

describe("telHref", () => {
  it("strips formatting a dialler can't parse", () => {
    expect(telHref("+1 (555) 123-4567")).toBe("tel:+15551234567");
    expect(telHref("555.123.4567")).toBe("tel:5551234567");
  });

  it("keeps a leading + for international numbers", () => {
    expect(telHref("+44 20 7946 0958")).toBe("tel:+442079460958");
  });

  it("returns null when there is nothing dialable, so no dead link renders", () => {
    expect(telHref("")).toBeNull();
    expect(telHref(null)).toBeNull();
    expect(telHref(undefined)).toBeNull();
    expect(telHref("not a phone number")).toBeNull();
  });
});
