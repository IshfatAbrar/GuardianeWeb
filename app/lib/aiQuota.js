// Daily usage counters for the AI routes, in the Admin-only `ai_usage`
// collection (no client rule matches it, so default-deny keeps it private).
//
// One doc per caller per route per UTC day: `ai_usage/{route}_{quotaKey}_{day}`
// holding { count, expiresAt }. `expiresAt` is there for a Firestore TTL policy
// to sweep old days; without one the docs are just small and stale.

import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const USAGE_COLLECTION = "ai_usage";

/** "YYYYMMDD" in UTC. */
export function utcDay(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
}

/** Doc ids can't contain "/"; quota keys are "kind:value" with safe values. */
export function usageDocId(route, quotaKey, now = Date.now()) {
  return `${route}_${quotaKey.replace(/[^A-Za-z0-9:_-]/g, "_")}_${utcDay(now)}`;
}

/**
 * Count one call against today's cap.
 *
 * @returns {Promise<{allowed: boolean, count: number}>}
 *
 * Fails open: if the counter can't be read or written, the call goes through
 * (logged). A Firestore blip shouldn't silence a child's risk alerts; the
 * Vercel WAF rate limit is the backstop for that window.
 */
export async function consumeQuota(
  db,
  { route, quotaKey, limit, now = Date.now() },
) {
  if (!db || !quotaKey || limit == null) return { allowed: true, count: 0 };
  const ref = db
    .collection(USAGE_COLLECTION)
    .doc(usageDocId(route, quotaKey, now));
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const count = snap.exists ? Number(snap.get("count")) || 0 : 0;
      if (count >= limit) return { allowed: false, count };
      tx.set(
        ref,
        {
          count: FieldValue.increment(1),
          expiresAt: Timestamp.fromMillis(now + 2 * 86_400_000),
        },
        { merge: true },
      );
      return { allowed: true, count: count + 1 };
    });
  } catch (e) {
    console.error("[ai] quota check failed, allowing:", e?.code, e?.message);
    return { allowed: true, count: 0 };
  }
}
