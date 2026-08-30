// Per-user JoJo chat history, persisted in Firestore.
//
// Schema (matches firestore.rules):
//   chatSessions/{sessionId}                     → { userId, title, createdAt, updatedAt }
//   chatSessions/{sessionId}/messages/{msgId}    → { role, content, timestamp }
//
// Sessions are scoped to the signed-in user via `userId`, which the security
// rules enforce on every read/write. A session is only created once the user
// sends their first message, so blank "new chat" tabs never hit the database.

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const SESSIONS = "chatSessions";

/** Firestore Timestamp → millis, tolerant of pending server timestamps (null). */
export function tsMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}

/**
 * Live-subscribe to a user's chat sessions. We filter by userId only (a single
 * equality filter needs no composite index) and sort newest-first client-side.
 * Returns an unsubscribe function.
 */
export function listenToChatSessions(uid, onUpdate, onError) {
  const q = query(collection(db, SESSIONS), where("userId", "==", uid));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => !s.deleted);
      rows.sort((a, b) => tsMillis(b.updatedAt) - tsMillis(a.updatedAt));
      onUpdate(rows);
    },
    onError,
  );
}

/** Create a new session for the user. Returns the new session id. */
export async function createChatSession(uid, title) {
  const ref = await addDoc(collection(db, SESSIONS), {
    userId: uid,
    title: title || "New chat",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Patch a session (e.g. bump updatedAt, rename). userId/createdAt stay put. */
export async function touchChatSession(sessionId, patch = {}) {
  await updateDoc(doc(db, SESSIONS, sessionId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft-delete a session: flag it `deleted` so it drops out of the live list
 * but the document (and its immutable messages subcollection) stays intact and
 * recoverable. Hard deletes aren't used because the rules make messages
 * undeletable, which would otherwise orphan them.
 */
export async function deleteChatSession(sessionId) {
  await updateDoc(doc(db, SESSIONS, sessionId), {
    deleted: true,
    updatedAt: serverTimestamp(),
  });
}

/** Append one message to a session. Server timestamp keeps ordering correct. */
export async function addChatMessage(sessionId, { role, content }) {
  await addDoc(collection(db, SESSIONS, sessionId, "messages"), {
    role,
    content,
    timestamp: serverTimestamp(),
  });
}

/** Load all messages for a session, oldest-first. */
export async function getChatMessages(sessionId) {
  const snap = await getDocs(
    query(
      collection(db, SESSIONS, sessionId, "messages"),
      orderBy("timestamp", "asc"),
    ),
  );
  return snap.docs.map((d) => ({
    id: d.id,
    role: d.data().role,
    content: d.data().content,
  }));
}
