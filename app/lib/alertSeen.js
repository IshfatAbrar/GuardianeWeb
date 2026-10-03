// "Seen" for risk alerts — separate from "read".
//
//   read  (messages.isRead, Firestore)   — the parent acknowledged the alert
//          ("Mark all read" / the Crisis tab). Read alerts leave the bell list
//          and the Active alerts stat.
//   seen  (users/{parentUid}.alertsSeenAt) — the parent has looked at the
//          bell or the Crisis tab since the alert arrived. Seen alerts stop
//          raising red badges and the critical popup, but stay listed until
//          they're read.
//
// `alertsSeenAt` is a watermark: the newest alert timestamp that was on screen
// when the parent opened the bell/tab. A watermark (rather than "now") means a
// child device whose clock runs slightly behind can't slip a later alert under
// it. Stored on the parent's own doc so opening the bell on one device clears
// the badges on every device; the iOS/Android parent apps ignore the field.

import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export const ALERTS_SEEN_FIELD = "alertsSeenAt";

/** The watermark from a parent profile, in ms (0 when never set). */
export function seenAtMillis(profile) {
  const v = profile?.[ALERTS_SEEN_FIELD];
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (v instanceof Date) return v.getTime();
  return 0;
}

/** Alerts that arrived after the watermark — the ones that may still notify. */
export function unseenAlerts(alerts, seenAtMs) {
  return (Array.isArray(alerts) ? alerts : []).filter(
    (a) => (a?.timestampMs ?? 0) > (seenAtMs || 0),
  );
}

/**
 * The watermark after the parent looks at `alerts`: their newest timestamp,
 * never moving backwards. Returns null when nothing would change.
 */
export function nextSeenAt(alerts, currentSeenAtMs) {
  const newest = (Array.isArray(alerts) ? alerts : []).reduce(
    (max, a) => Math.max(max, a?.timestampMs ?? 0),
    0,
  );
  return newest > (currentSeenAtMs || 0) ? newest : null;
}

export async function saveAlertsSeenAt(parentUid, ms) {
  if (!parentUid || !ms) return;
  await updateDoc(doc(db, "users", parentUid), {
    [ALERTS_SEEN_FIELD]: Timestamp.fromMillis(ms),
  });
}
