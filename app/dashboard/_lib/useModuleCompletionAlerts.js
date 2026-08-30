"use client";

// Notifies the parent when a child's device reports a learning module
// assignment complete (learning_progress written by the CHILD app — see
// app/lib/learningModules.js). Two separate mechanisms, like
// CriticalAlertPopup's split between "shown as a popup" and `isRead`:
//   - a live toast the moment a NEW completion is observed while the
//     dashboard is open (never replayed for completions that already
//     existed when the listener first attached, so reopening the tab
//     doesn't replay a backlog as a burst of toasts)
//   - a persistent "unseen" count, localStorage per parent (same pattern as
//     CriticalAlertPopup's seen-set), for the Module Assignments sidebar
//     badge — cleared by calling markAllSeen() when the parent opens that tab

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../lib/useToast";
import {
  isAssignmentCompleted,
  assignmentKey,
} from "../../lib/learningModules";

const SEEN_KEY_PREFIX = "guardiane.moduleCompletions.seen:";
const MAX_SEEN = 300;

function readSeen(key) {
  if (typeof window === "undefined" || !key) return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeen(key, set) {
  if (typeof window === "undefined" || !key) return;
  window.localStorage.setItem(
    key,
    JSON.stringify(Array.from(set).slice(-MAX_SEEN)),
  );
}

export function useModuleCompletionAlerts({
  parentId,
  assignments,
  progressById,
  childById,
  moduleById,
  ready,
}) {
  const { showToast } = useToast();
  const seenKey = parentId ? `${SEEN_KEY_PREFIX}${parentId}` : null;

  const [seen, setSeen] = useState(() => readSeen(seenKey));

  // Reload the seen set whenever the signed-in account changes, so one
  // parent's cleared badge never suppresses another's on a shared device.
  // Adjusted during render — the same documented pattern useNotifications.js
  // and CriticalAlertPopup use for the same reason.
  const [lastSeenKey, setLastSeenKey] = useState(seenKey);
  if (seenKey !== lastSeenKey) {
    setLastSeenKey(seenKey);
    setSeen(readSeen(seenKey));
  }

  const completedKeys = useMemo(() => {
    const keys = new Set();
    for (const a of assignments) {
      if (isAssignmentCompleted(a, progressById)) {
        keys.add(assignmentKey(a.childId, a.moduleId));
      }
    }
    return keys;
  }, [assignments, progressById]);

  // Toast exactly once per newly-observed completion. `known` starts as
  // whatever was already complete on first render (no toast for those — the
  // parent wasn't watching when they happened), then toasts only for keys
  // that appear afterward. Gated on `ready`: assignments/progressById start
  // empty and hydrate asynchronously from their own Firestore listeners, so
  // priming the baseline before either has delivered a real snapshot would
  // capture an empty set — making every pre-existing completion look new the
  // moment real data arrives, and toasting the whole backlog at once.
  const knownRef = useRef(null);
  useEffect(() => {
    if (!ready) return;
    if (knownRef.current === null) {
      knownRef.current = completedKeys;
      return;
    }
    const prev = knownRef.current;
    for (const key of completedKeys) {
      if (prev.has(key)) continue;
      const assignment = assignments.find(
        (a) => assignmentKey(a.childId, a.moduleId) === key,
      );
      const childName = childById
        ?.get(assignment?.childId)
        ?.name?.split(" ")[0];
      const moduleTitle = moduleById?.get(assignment?.moduleId)?.title;
      if (childName && moduleTitle) {
        showToast(`${childName} completed "${moduleTitle}"! \u{1F389}`);
      }
    }
    knownRef.current = completedKeys;
  }, [ready, completedKeys, assignments, childById, moduleById, showToast]);

  const unseenCount = useMemo(() => {
    let count = 0;
    for (const key of completedKeys) if (!seen.has(key)) count += 1;
    return count;
  }, [completedKeys, seen]);

  const markAllSeen = () => {
    if (!seenKey || completedKeys.size === 0) return;
    setSeen((prev) => {
      const next = new Set(prev);
      for (const key of completedKeys) next.add(key);
      writeSeen(seenKey, next);
      return next;
    });
  };

  return { unseenCount, markAllSeen };
}
