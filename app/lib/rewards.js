// Badges a child claims in their app, shown to the parent as activity.
//
// SCHEMA — rewards/{childId}_{badge}, created by the iOS kid app
// (LearningHubPreviewSection.claimReward). Deterministic id, create-only, so a
// badge can be earned once:
//   { childId, parentId, type: 'badge', badge, title, reason, claimedAt }

import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export const REWARDS_COLLECTION = "rewards";

/** Every reward this parent's children have claimed, newest first. */
export function listenToRewards(parentId, callback) {
  if (!parentId) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    query(
      collection(db, REWARDS_COLLECTION),
      where("parentId", "==", parentId),
    ),
    (snap) =>
      callback(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (b.claimedAt?.toMillis?.() ?? 0) -
              (a.claimedAt?.toMillis?.() ?? 0),
          ),
      ),
    () => callback([]),
  );
}

/** One-line description for the activity feed. */
export function rewardLabel(reward) {
  const title = reward?.title || "a badge";
  return `Earned ${title}`;
}
