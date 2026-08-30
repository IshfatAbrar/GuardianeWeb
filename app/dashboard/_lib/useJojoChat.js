"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { sendJojoMessage, JojoChatError } from "../../lib/jojoChat";
import {
  listenToChatSessions,
  createChatSession,
  touchChatSession,
  deleteChatSession,
  addChatMessage,
  getChatMessages,
} from "../../lib/jojoHistory";

function titleFromText(text) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 34 ? `${t.slice(0, 34)}…` : t || "New chat";
}

/**
 * Owns JoJo chat state backed by Firestore, scoped to the signed-in user.
 *
 *   • sessions      — live list for the history sidebar (newest first)
 *   • activeId      — null means an unsaved "new chat" (no Firestore doc yet)
 *   • messages      — the active conversation, kept locally for snappy UI and
 *                     loaded from Firestore when an existing session is opened
 *
 * A session row is created lazily on the first message, so empty new-chat tabs
 * never persist. Message writes are best-effort: a failed persist still shows
 * the message locally and is logged, so the chat never breaks on a write error.
 */
export function useJojoChat() {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Live list of the user's sessions for the sidebar.
  useEffect(() => {
    if (!uid) return;
    const unsub = listenToChatSessions(uid, setSessions, (err) =>
      console.error("[jojo] sessions listener:", err),
    );
    return () => unsub();
  }, [uid]);

  const newChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  const selectSession = useCallback(async (id) => {
    setActiveId(id);
    setLoadingMessages(true);
    try {
      const msgs = await getChatMessages(id);
      setMessages(msgs.map((m) => ({ role: m.role, content: m.content })));
    } catch (err) {
      console.error("[jojo] load messages:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const deleteSession = useCallback(
    async (id) => {
      try {
        await deleteChatSession(id);
      } catch (err) {
        console.error("[jojo] delete session:", err);
      }
      if (id === activeId) {
        setActiveId(null);
        setMessages([]);
      }
    },
    [activeId],
  );

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed || isSending || !uid) return;

      const userMsg = { role: "user", content: trimmed };
      const history = [...messages, userMsg];
      setMessages(history);
      setIsSending(true);

      let sessionId = activeId;
      try {
        // Lazily create the session on the first message.
        if (!sessionId) {
          sessionId = await createChatSession(uid, titleFromText(trimmed));
          setActiveId(sessionId);
        }
        addChatMessage(sessionId, userMsg).catch((err) =>
          console.error("[jojo] persist user message:", err),
        );

        const reply = await sendJojoMessage({ messages: history });
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        addChatMessage(sessionId, { role: "assistant", content: reply }).catch(
          (err) => console.error("[jojo] persist assistant message:", err),
        );
        touchChatSession(sessionId).catch((err) =>
          console.error("[jojo] touch session:", err),
        );
      } catch (err) {
        const fallback =
          err instanceof JojoChatError
            ? err.message
            : "I couldn't reach the server. Check your connection and try again.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fallback },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [activeId, isSending, messages, uid],
  );

  return {
    sessions,
    activeId,
    messages,
    isSending,
    loadingMessages,
    newChat,
    selectSession,
    deleteSession,
    sendMessage,
  };
}
