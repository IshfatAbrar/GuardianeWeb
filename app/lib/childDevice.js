// Which kind of device a child's Guardiane app runs on, and what it reports.
//
// The two child apps support different screen-time controls:
//   • iOS (Guardiane_Kid_Facing) — one whole-device daily limit
//     (`screenTimeLimitMinutes`, see screenTimeLimit.js). Apple's
//     FamilyControls never exposes per-app usage, so iOS writes no
//     `screen_time_entries`; instead it reports `screenTimeStatus` on the
//     child's own doc and stamps `devicePlatform: "ios"`.
//   • Android (Guardiane_Android) — per-app limits (`parentAppLimits`, see
//     appLimits.js) and full usage rows in `screen_time_entries`. It writes no
//     platform field, but it is the only client that sets
//     `currentForegroundApp` on the child doc.
//
// A child whose device hasn't reported either yet (not paired, or an older
// iOS build) is "unknown" — callers should offer both sets of controls then.

export const CHILD_PLATFORM = {
  IOS: "ios",
  ANDROID: "android",
};

/** "ios" | "android" | null when the child's device hasn't said. */
export function childPlatform(child) {
  if (child?.devicePlatform === CHILD_PLATFORM.IOS) return CHILD_PLATFORM.IOS;
  if (child?.devicePlatform === CHILD_PLATFORM.ANDROID)
    return CHILD_PLATFORM.ANDROID;
  if (child?.currentForegroundApp) return CHILD_PLATFORM.ANDROID;
  return null;
}

/** Whether to offer the Android per-app limits for this child. */
export function supportsAppLimits(child) {
  return childPlatform(child) !== CHILD_PLATFORM.IOS;
}

/** Whether to offer the iOS whole-device daily limit for this child. */
export function supportsDailyLimit(child) {
  return childPlatform(child) !== CHILD_PLATFORM.ANDROID;
}

function toInt(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
}

/**
 * The iOS device's self-reported Screen Time state, or null when it has never
 * reported. Written by ScreenTimeManager.syncStatusToFirestore on the child's
 * device — these are honest status values, not usage numbers.
 */
export function iosScreenTimeStatus(child) {
  const s = child?.screenTimeStatus;
  if (!s || typeof s !== "object") return null;
  return {
    authorized: s.authorized === true,
    isMonitoring: s.isMonitoring === true,
    limitMinutes: toInt(s.limitMinutes),
    baseLimitMinutes: toInt(s.baseLimitMinutes),
    bonusMinutesToday: toInt(s.bonusMinutesToday),
    selectedItemCount: toInt(s.selectedItemCount),
    updatedAt: s.updatedAt ?? null,
  };
}
