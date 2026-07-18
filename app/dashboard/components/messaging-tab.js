"use client";

// Parent↔child chat. The child's half lives in Guardiane_Android's
// MessagingScreen, writing to the same `messages` collection this reads.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  listenToConversation,
  sendMessage,
  markChildMessagesAsRead,
  isAlertMessage,
  messageClassification,
} from "../../lib/messages";

function timeLabel(message) {
  const date = message?.timestamp?.toDate?.() ?? message?.createdAt?.toDate?.();
  // No timestamp yet means the write is still in flight — serverTimestamp only
  // resolves once the server acks, and onSnapshot shows the local echo first.
  if (!date) return "Sending…";
  const today = new Date().toDateString() === date.toDateString();
  return today
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" }) +
        " · " +
        date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function MessageBubble({ message, childName }) {
  const fromParent = message.senderType === "parent";
  const isAlert = isAlertMessage(message);
  const classification = messageClassification(message);

  if (isAlert) {
    return (
      <li className="flex justify-start">
        <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <svg width="13" height="13" fill="none" stroke="var(--danger)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--danger)]">
              {classification || "Risk alert"}
            </span>
          </div>
          <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-[var(--foreground)]">
            {message.message}
          </p>
          <p className="mt-1 text-[10.5px] text-[var(--muted)]">{timeLabel(message)}</p>
        </div>
      </li>
    );
  }

  return (
    <li className={`flex ${fromParent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] px-4 py-2.5 ${
          fromParent
            ? "rounded-2xl rounded-br-md bg-[var(--accent)] text-white"
            : "rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
        }`}
      >
        {!fromParent && childName && (
          <p className="mb-0.5 text-[10.5px] font-semibold text-[var(--muted)]">
            {childName}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">
          {message.message}
        </p>
        <p
          className={`mt-1 text-[10.5px] ${
            fromParent ? "text-white/70" : "text-[var(--muted)]"
          }`}
        >
          {timeLabel(message)}
        </p>
      </div>
    </li>
  );
}

export function MessagingTab({ data }) {
  const user = data?.user || null;
  const children = useMemo(() => data?.children || [], [data?.children]);
  const selectedChildId = data?.selectedChildId || null;
  const parentId = user?.uid || null;
  const selectedChild = children.find((c) => c.id === selectedChildId) || null;

  if (children.length === 0) {
    return (
      <div className="space-y-7 p-6">
        <Header childName={null} />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[14px] text-[var(--muted)]">
            Add a child to start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
      <Header childName={selectedChild?.name} />
      {/*
        Keyed by child so switching conversations remounts this subtree. That
        resets the message list and draft for free — without it, the previous
        child's chat would linger on screen until the new listener's first
        snapshot arrived, which is both wrong and briefly alarming.
      */}
      <Conversation
        key={selectedChildId || "none"}
        parentId={parentId}
        childId={selectedChildId}
        childName={selectedChild?.name}
      />
    </div>
  );
}

function Conversation({ parentId, childId, childName }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(!!parentId && !!childId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!parentId || !childId) return undefined;
    return listenToConversation({ parentId, childId }, (rows) => {
      setMessages(rows);
      setLoading(false);
    });
  }, [parentId, childId]);

  // Clear the child's unread chat once the parent is actually looking at it.
  // Alerts stay unread on purpose — opening a chat isn't acknowledging a risk.
  useEffect(() => {
    if (!parentId || !childId || messages.length === 0) return;
    markChildMessagesAsRead({ parentId, childId }).catch(() => {});
  }, [parentId, childId, messages.length]);

  // Pin to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleSend(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending || !parentId || !childId) return;
    setSending(true);
    setErrorMessage(null);
    // Clear optimistically — the listener echoes the message straight back.
    setDraft("");
    try {
      await sendMessage({ parentId, childId, message: text });
    } catch (err) {
      setDraft(text);
      setErrorMessage(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="py-8 text-center text-[13px] text-[var(--muted)]">
              Loading messages…
            </p>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--muted)]">
              No messages yet. Say hello to {childName || "your child"}.
            </p>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} childName={childName} />
              ))}
            </ul>
          )}
        </div>

        {errorMessage && (
          <p className="border-t border-[var(--border)] bg-[var(--danger)]/10 px-4 py-2 text-[12px] text-[var(--danger)]">
            {errorMessage}
          </p>
        )}

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--surface)] p-3"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${childName || "your child"}…`}
            aria-label="Message text"
            className="flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[13.5px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent-border)]"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}

function Header({ childName }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-bg)]">
        <svg width="18" height="18" fill="none" style={{ stroke: "var(--accent)" }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </div>
      <div>
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">Messages</h2>
        {childName && (
          <p className="text-[12px] text-[var(--muted)]">
            Conversation with {childName}
          </p>
        )}
      </div>
    </div>
  );
}
