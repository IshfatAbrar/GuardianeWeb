// "Ask my parent for app access" requests from the child's device.
//
// SCHEMA — access_requests/{id}, created by the iOS kid app
// (ModuleAccessRequestCenter.swift) when a child asks for time on their
// blocked apps to finish a learning module:
//   { childId, parentId, moduleId, moduleTitle, requestType: 'app_access',
//     status: 'pending', requestedAt }
// The parent answers here with { status: 'approved'|'denied', respondedAt,
// grantedMinutes }. On approval the child's device adds grantedMinutes to
// today's Screen Time allowance and stamps `appliedAt` (once).
//
// firestore.rules pins exactly these shapes: the child may only create a
// pending request and later set appliedAt; only the owning parent may answer.

import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const ACCESS_REQUESTS_COLLECTION = "access_requests";

export const ACCESS_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  DENIED: "denied",
};

// The choices the dashboard offers; the rules accept any whole number 1–240.
export const GRANT_MINUTE_OPTIONS = [15, 30, 60];
export const MAX_GRANT_MINUTES = 240;

function requestMillis(row) {
  return row?.requestedAt?.toMillis?.() ?? 0;
}

/**
 * Every request addressed to this parent, newest first. Single equality on
 * parentId — no composite index needed.
 */
export function listenToAccessRequests(parentId, callback) {
  if (!parentId) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    query(
      collection(db, ACCESS_REQUESTS_COLLECTION),
      where("parentId", "==", parentId),
    ),
    (snap) =>
      callback(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => requestMillis(b) - requestMillis(a)),
      ),
    () => callback([]),
  );
}

export function pendingRequests(rows) {
  return (Array.isArray(rows) ? rows : []).filter(
    (r) => r.status === ACCESS_REQUEST_STATUS.PENDING,
  );
}

/** Approve, granting `minutes` of extra Screen Time today. */
export async function approveAccessRequest(requestId, minutes) {
  const granted = Math.round(Number(minutes));
  if (!requestId) throw new Error("Missing requestId");
  if (!Number.isFinite(granted) || granted < 1 || granted > MAX_GRANT_MINUTES)
    throw new Error(`Minutes must be between 1 and ${MAX_GRANT_MINUTES}`);
  await updateDoc(doc(db, ACCESS_REQUESTS_COLLECTION, requestId), {
    status: ACCESS_REQUEST_STATUS.APPROVED,
    grantedMinutes: granted,
    respondedAt: serverTimestamp(),
  });
}

export async function denyAccessRequest(requestId) {
  if (!requestId) throw new Error("Missing requestId");
  await updateDoc(doc(db, ACCESS_REQUESTS_COLLECTION, requestId), {
    status: ACCESS_REQUEST_STATUS.DENIED,
    respondedAt: serverTimestamp(),
  });
}
