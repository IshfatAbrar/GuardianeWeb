import { getAdminFirestore } from "../../../lib/firebaseAdmin";
import {
  checkGuess,
  UNLOCKS_COLLECTION,
  isValidChildId,
  UNLOCK_MINUTES,
} from "../../../lib/screenTimeUnlock";

// POST /api/screen-time/verify-unlock
//   body: { childId, code }
//   → { ok: true, unlockMinutes }
//   → { ok: false, reason: "wrong", attemptsLeft } | { ok: false, reason: "expired" | "locked" }
//
// Called by the (unauthenticated) iOS kid app when someone types the parent's
// code into its Screen Time screen. Checked here rather than on the device so
// the code can't be brute-forced offline; MAX_ATTEMPTS wrong guesses kill it.

export async function POST(request) {
  const db = getAdminFirestore();
  if (!db) {
    return Response.json(
      { error: "Screen Time unlock isn't configured on this server." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const childId = typeof body?.childId === "string" ? body.childId.trim() : "";
  if (!isValidChildId(childId)) {
    return Response.json(
      { error: "Missing or invalid childId." },
      { status: 400 },
    );
  }

  const ref = db.collection(UNLOCKS_COLLECTION).doc(childId);
  // A transaction so two guesses at once can't both be counted as the first.
  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : null;
    const unlock = data
      ? { ...data, expiresAtMs: data.expiresAt?.toMillis?.() ?? 0 }
      : null;
    const check = checkGuess(unlock, body?.code);
    if (check.action === "delete") tx.delete(ref);
    if (check.action === "increment")
      tx.update(ref, { attempts: (data.attempts ?? 0) + 1 });
    return check;
  });

  if (outcome.result === "ok") {
    return Response.json({ ok: true, unlockMinutes: UNLOCK_MINUTES });
  }
  return Response.json({
    ok: false,
    reason: outcome.result,
    ...(outcome.result === "wrong"
      ? { attemptsLeft: outcome.attemptsLeft }
      : {}),
  });
}
