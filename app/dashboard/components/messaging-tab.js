"use client";

// Parent↔child chat. The child's half lives in Guardiane_Android's
// MessagingScreen, writing to the same `messages` collection this reads.
//
// The child picker here is local to this tab (its own `activeChildId`,
// seeded from the dashboard's globally-selected child but independent of
// it) so switching who you're texting doesn't also change which child the
// rest of the dashboard — Overview, mood, screen time — is showing.

import { useEffect, useMemo, useRef, useState } from "react";
import { ageFromBirthDate } from "../../lib/database";
import {
  listenToConversation,
  listenToConversationPreview,
  sendMessage,
  markChildMessagesAsRead,
  isAlertMessage,
  messageClassification,
} from "../../lib/messages";

function initialsFromName(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function childAgeLabel(child) {
  const age = ageFromBirthDate(child?.birthDate);
  return age === null ? null : `Age ${age}`;
}

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

// Short "25m ago" / "3d ago" style stamp for the conversation list, distinct
// from timeLabel's full in-thread timestamp.
function relativeTimeLabel(message) {
  const date = message?.timestamp?.toDate?.() ?? message?.createdAt?.toDate?.();
  if (!date) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

// Sent (single check) vs. seen (double, accent-colored) — real data: the
// child app's MessagingScreen marks a parent-sent message `isRead: true`
// once it opens that conversation, so this reflects an actual read receipt,
// not a fabricated one.
function ReadReceipt({ seen, light = false }) {
  const colorClass = light
    ? seen
      ? "text-white"
      : "text-white/60"
    : seen
      ? "text-[var(--accent)]"
      : "text-[var(--muted)]";
  return (
    <svg
      width={seen ? 15 : 10}
      height="10"
      viewBox="0 0 16 11"
      fill="none"
      className={`flex-shrink-0 ${colorClass}`}
      aria-label={seen ? "Seen" : "Sent"}
    >
      <path d="M1 5.7 4.3 9 10.6 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {seen && (
        <path d="M5 5.7 8.3 9 14.6 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function Avatar({ name, size = 40, active = false }) {
  const dim = `${size}px`;
  return (
    <div
      style={{ width: dim, height: dim }}
      className={`flex flex-shrink-0 items-center justify-center rounded-full border-1 border-[var(--border)] text-[13px] font-semibold ${
        active
          ? "bg-[var(--accent)] text-white"
          : "bg-[var(--surface-muted)] text-[var(--muted)]"
      }`}
    >
      {initialsFromName(name)}
    </div>
  );
}

function MessageBubble({ message, childName, isLast }) {
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
          className={`mt-1 flex items-center gap-1 text-[10.5px] ${
            fromParent ? "text-white/70" : "text-[var(--muted)]"
          }`}
        >
          {timeLabel(message)}
          {fromParent && (
            <>
              <ReadReceipt seen={message.isRead === true} light />
              {isLast && message.isRead === true && (
                <span className="text-white">Seen</span>
              )}
            </>
          )}
        </p>
      </div>
    </li>
  );
}

export function MessagingTab({ data }) {
  const user = data?.user || null;
  const children = useMemo(() => data?.children || [], [data?.children]);
  const parentId = user?.uid || null;

  // The user's own pick in this tab, if any and still valid — falls back to
  // the dashboard's globally-selected child, then the first child, so a
  // removed child (or no pick yet) never leaves the view stuck on nothing.
  // Derived on every render rather than synced via an effect: there's no
  // extra state to reconcile, so it can't ever drift from `children`.
  const [manualPick, setManualPick] = useState(null);
  const activeChildId =
    (manualPick && children.some((c) => c.id === manualPick) && manualPick) ||
    (data?.selectedChildId && children.some((c) => c.id === data.selectedChildId)
      ? data.selectedChildId
      : null) ||
    children[0]?.id ||
    null;

  const activeChild = children.find((c) => c.id === activeChildId) || null;

  if (children.length === 0) {
    return (
      <div className="space-y-7 p-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[14px] text-[var(--muted)]">
            Add a child to start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden ">
      <ConversationList
        parentId={parentId}
        childList={children}
        activeChildId={activeChildId}
        onSelect={setManualPick}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <ConversationHeader child={activeChild} />
        {/*
          Keyed by child so switching conversations remounts this subtree. That
          resets the message list and draft for free — without it, the previous
          child's chat would linger on screen until the new listener's first
          snapshot arrived, which is both wrong and briefly alarming.
        */}
        <Conversation
          key={activeChildId || "none"}
          parentId={parentId}
          childId={activeChildId}
          childName={activeChild?.name}
        />
      </div>
    </div>
  );
}

function ConversationList({ parentId, childList, activeChildId, onSelect }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [previews, setPreviews] = useState({}); // childId -> { lastMessage, unreadCount }

  useEffect(() => {
    const unsubs = childList.map((child) =>
      listenToConversationPreview({ parentId, childId: child.id }, (preview) => {
        setPreviews((prev) => ({ ...prev, [child.id]: preview }));
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [parentId, childList]);

  const totalUnread = Object.values(previews).reduce(
    (sum, p) => sum + (p?.unreadCount || 0),
    0,
  );

  const rows = childList
    .filter((c) => c.name?.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((c) => filter === "all" || (previews[c.id]?.unreadCount || 0) > 0)
    .sort((a, b) => {
      const am = previews[a.id]?.lastMessage;
      const bm = previews[b.id]?.lastMessage;
      const at = am?.timestamp?.toMillis?.() ?? am?.createdAt?.toMillis?.() ?? 0;
      const bt = bm?.timestamp?.toMillis?.() ?? bm?.createdAt?.toMillis?.() ?? 0;
      return bt - at;
    });

  return (
    <div className="flex min-h-0 w-[300px] flex-shrink-0 flex-col border-r border-[var(--border)]">
      <div className="p-4 pb-3">
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">Messages</h2>
        <p className="mt-0.5 text-[12px] text-[var(--muted)]">
          Check out your conversations
        </p>
        <div className="relative mt-3">
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search children…"
            aria-label="Search children"
            className="w-full rounded-full border border-[var(--border)] bg-[var(--surface-muted)] py-2 pl-8 pr-3 text-[12.5px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent-border)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[var(--border)] px-4 pb-2">
        {[
          { id: "all", label: `All (${childList.length})` },
          { id: "unread", label: `Unread (${totalUnread})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              filter === tab.id
                ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ul className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <li className="p-4 text-center text-[12.5px] text-[var(--muted)]">
            No conversations match.
          </li>
        ) : (
          rows.map((child) => {
            const preview = previews[child.id];
            const isActive = child.id === activeChildId;
            const unread = preview?.unreadCount || 0;
            return (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => onSelect(child.id)}
                  className={`flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-[var(--accent-bg)]" : "hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  <Avatar name={child.name} active={isActive} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
                        {child.name || "Child"}
                      </span>
                      {preview?.lastMessage && (
                        <span className="flex-shrink-0 text-[10.5px] text-[var(--muted)]">
                          {relativeTimeLabel(preview.lastMessage)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] text-[var(--muted)]">
                        {preview?.lastMessage?.message || "No messages yet"}
                      </span>
                      {unread > 0 ? (
                        <span className="flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      ) : (
                        preview?.lastMessage?.senderType === "parent" && (
                          <ReadReceipt seen={preview.lastMessage.isRead === true} />
                        )
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function ConversationHeader({ child }) {
  if (!child) {
    return (
      <div className="pb-3">
        <h2 className="text-[15px] font-semibold text-[var(--foreground)]">
          Select a child to start messaging
        </h2>
      </div>
    );
  }
  const age = childAgeLabel(child);
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] p-3">
      <Avatar name={child.name} size={36} />
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--foreground)]">
          {child.name || "Child"}
        </h2>
        <p className="text-[11.5px] text-[var(--muted)]">{age || "Your child"}</p>
      </div>
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
    <div className=" flex min-h-0 flex-1 max-h-[82%] flex-col overflow-hidden bg-[var(--background)]">
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
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                childName={childName}
                isLast={i === messages.length - 1}
              />
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
          disabled={!childId}
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[13.5px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent-border)] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending || !childId}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
