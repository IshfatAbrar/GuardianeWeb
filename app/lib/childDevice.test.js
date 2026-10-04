// Which screen-time controls a child gets depends on the platform their device
// reports. Getting it wrong offers a parent a control that silently does
// nothing on the child's phone.
import { describe, it, expect } from "vitest";
import {
  childPlatform,
  supportsAppLimits,
  supportsDailyLimit,
  iosScreenTimeStatus,
  daysSinceSeen,
  isDeviceStale,
} from "./childDevice.js";

describe("childPlatform", () => {
  it("trusts devicePlatform", () => {
    expect(childPlatform({ devicePlatform: "ios" })).toBe("ios");
    expect(childPlatform({ devicePlatform: "android" })).toBe("android");
  });

  it("infers Android from currentForegroundApp, which only Android writes", () => {
    expect(childPlatform({ currentForegroundApp: { appName: "X" } })).toBe(
      "android",
    );
  });

  it("is unknown for a device that hasn't reported", () => {
    expect(childPlatform({})).toBeNull();
    expect(childPlatform(null)).toBeNull();
    expect(childPlatform({ devicePlatform: "windows" })).toBeNull();
  });
});

describe("control support", () => {
  it("iOS gets only the daily limit", () => {
    const ios = { devicePlatform: "ios" };
    expect(supportsDailyLimit(ios)).toBe(true);
    expect(supportsAppLimits(ios)).toBe(false);
  });

  it("Android gets only per-app limits", () => {
    const android = { currentForegroundApp: {} };
    expect(supportsDailyLimit(android)).toBe(false);
    expect(supportsAppLimits(android)).toBe(true);
  });

  it("an unknown device gets both", () => {
    expect(supportsDailyLimit({})).toBe(true);
    expect(supportsAppLimits({})).toBe(true);
  });
});

describe("iosScreenTimeStatus", () => {
  it("is null until the device reports", () => {
    expect(iosScreenTimeStatus({})).toBeNull();
    expect(iosScreenTimeStatus({ screenTimeStatus: "nope" })).toBeNull();
  });

  it("normalizes what the device wrote", () => {
    const s = iosScreenTimeStatus({
      screenTimeStatus: {
        authorized: true,
        isMonitoring: true,
        limitMinutes: 135,
        bonusMinutesToday: 15,
        selectedItemCount: 3,
      },
    });
    expect(s).toMatchObject({
      authorized: true,
      isMonitoring: true,
      limitMinutes: 135,
      baseLimitMinutes: 0,
      bonusMinutesToday: 15,
      selectedItemCount: 3,
    });
  });

  it("never reports a negative or non-numeric limit", () => {
    const s = iosScreenTimeStatus({
      screenTimeStatus: { limitMinutes: -5, bonusMinutesToday: "lots" },
    });
    expect(s.limitMinutes).toBe(0);
    expect(s.bonusMinutesToday).toBe(0);
    expect(s.authorized).toBe(false);
  });
});

describe("authorization mode and last seen", () => {
  const ts = (ms) => ({ toMillis: () => ms });
  const NOW = 1_700_000_000_000;

  it("keeps only the two real authorization modes", () => {
    const mode = (m) =>
      iosScreenTimeStatus({ screenTimeStatus: { authorizationMode: m } })
        .authorizationMode;
    expect(mode("child")).toBe("child");
    expect(mode("individual")).toBe("individual");
    expect(mode("hacked")).toBeNull();
  });

  it("counts whole days since the last check-in", () => {
    expect(daysSinceSeen({ updatedAt: ts(NOW - 3600_000) }, NOW)).toBe(0);
    expect(daysSinceSeen({ updatedAt: ts(NOW - 3 * 86_400_000) }, NOW)).toBe(3);
    expect(daysSinceSeen(null, NOW)).toBeNull();
  });

  it("flags a device quiet for more than two days", () => {
    expect(isDeviceStale({ updatedAt: ts(NOW - 86_400_000) }, NOW)).toBe(false);
    expect(isDeviceStale({ updatedAt: ts(NOW - 3 * 86_400_000) }, NOW)).toBe(
      true,
    );
    expect(isDeviceStale(null, NOW)).toBe(false);
  });
});
