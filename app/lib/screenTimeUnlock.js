// One-time codes that unlock the Screen Time settings on a child's iPhone.
//
// The kid app's Screen Time screen is read-only for the child: changing the
// limited apps, the Apple permission, "Stop Limiting" or unlinking the device
// needs a code the parent generates (web dashboard or parent app) and types on
// the child's phone. Server-only — the code is checked here, never on the
// device, because anything the device could check, a child could brute-force
// offline (a 6-digit code is only a million guesses).
//
//   screen_time_unlocks/{childId}   (Admin SDK only — no client rule allows it)
//     codeHash   sha256(salt + code), hex
//     salt       random hex
//     expiresAt  Timestamp — CODE_TTL_MS after creation
//     attempts   wrong guesses so far; the code dies at MAX_ATTEMPTS
//     createdBy  parent uid
//
// A new code replaces the previous one, and a correct code is deleted on use.

import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
/** How long the child's device keeps the settings open after a correct code. */
export const UNLOCK_MINUTES = 10;
export const UNLOCKS_COLLECTION = "screen_time_unlocks";

export function generateCode() {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

export function hashCode(code, salt) {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

/** The doc to store for a fresh code (expiresAt as ms; the route converts). */
export function newUnlock({ code, parentUid, now = Date.now() }) {
  const salt = randomBytes(16).toString("hex");
  return {
    codeHash: hashCode(code, salt),
    salt,
    expiresAtMs: now + CODE_TTL_MS,
    attempts: 0,
    createdBy: parentUid,
  };
}

/** A Firestore doc id we'll look up (child ids are 20-char auto-ids). */
export function isValidChildId(id) {
  return (
    typeof id === "string" &&
    /^[A-Za-z0-9_-]{1,128}$/.test(id) &&
    !/^__.*__$/.test(id)
  );
}

/** Normalize what a person typed: digits only, so "123 456" works. */
export function cleanCode(input) {
  return String(input ?? "").replace(/\D/g, "");
}

/**
 * Decide what a guess does to a stored unlock.
 * @returns {{ result: "ok"|"wrong"|"expired"|"locked", attemptsLeft: number,
 *             action: "delete"|"increment"|"none" }}
 */
export function checkGuess(unlock, guess, now = Date.now()) {
  if (!unlock) return { result: "expired", attemptsLeft: 0, action: "none" };
  if (!(now < unlock.expiresAtMs))
    return { result: "expired", attemptsLeft: 0, action: "delete" };
  if ((unlock.attempts ?? 0) >= MAX_ATTEMPTS)
    return { result: "locked", attemptsLeft: 0, action: "delete" };

  const code = cleanCode(guess);
  const given = Buffer.from(hashCode(code, unlock.salt), "hex");
  const stored = Buffer.from(String(unlock.codeHash ?? ""), "hex");
  const match =
    code.length === CODE_LENGTH &&
    given.length === stored.length &&
    timingSafeEqual(given, stored);
  if (match) return { result: "ok", attemptsLeft: 0, action: "delete" };

  const attemptsLeft = MAX_ATTEMPTS - (unlock.attempts ?? 0) - 1;
  return attemptsLeft > 0
    ? { result: "wrong", attemptsLeft, action: "increment" }
    : { result: "locked", attemptsLeft: 0, action: "delete" };
}
