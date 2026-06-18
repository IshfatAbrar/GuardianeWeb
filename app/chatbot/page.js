"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sendJojoMessage, JojoChatError } from "../lib/jojoChat";
import { ThemeToggle } from "../../components/theme-toggle";

// ── Guest chat state (sessionStorage-backed, no auth, no Firestore) ───────────
//
// This page is a public, login-free version of the dashboard's JoJo tab. The
// chat backend (/api/jojo) needs no auth, so the only thing we replace is the
// Firestore-backed history: conversations live in sessionStorage and disappear
// when the tab is closed. The hook mirrors the shape of the dashboard's
// useJojoChat so the UI below is identical.

const STORAGE_KEY = "jojo_guest_v1";

// Guests get one free turn with JoJo. After that, sending another message opens
// the sign-up gate instead. The counter lives in localStorage (not the
// sessionStorage chat store) so it survives a refresh / tab-close and can't be
// reset by simply reopening the tab.
const TRIAL_KEY = "jojo_guest_tries_v1";
const TRIAL_LIMIT = 1;

function readTries() {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(TRIAL_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function writeTries(n) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRIAL_KEY, String(n));
  } catch {
    // Storage unavailable (e.g. private mode) — gate still works in-memory.
  }
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `s_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function loadStore() {
  if (typeof window === "undefined") return { sessions: [], messages: {} };
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "");
    return { sessions: parsed.sessions || [], messages: parsed.messages || {} };
  } catch {
    return { sessions: [], messages: {} };
  }
}

function saveStore(store) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full / unavailable (e.g. private mode) — chat still works in-memory.
  }
}

function sortSessions(sessions) {
  return [...sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function titleFromText(text) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 34 ? `${t.slice(0, 34)}…` : t || "New chat";
}

// Tracks whether the viewport is phone-sized (< 768px). Drives the sidebar's
// drawer-vs-inline behaviour below.
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
}

function useGuestJojoChat() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const storeRef = useRef({ sessions: [], messages: {} });

  // Hydrate from sessionStorage after mount. Reading storage during render
  // would mismatch the (storage-less) server render, so this one-time sync from
  // an external system is exactly what an effect is for.
  useEffect(() => {
    const store = loadStore();
    storeRef.current = store;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from sessionStorage
    setSessions(sortSessions(store.sessions));
  }, []);

  const commit = useCallback(() => {
    saveStore(storeRef.current);
    setSessions(sortSessions(storeRef.current.sessions));
  }, []);

  const newChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  const selectSession = useCallback((id) => {
    setActiveId(id);
    setMessages(storeRef.current.messages[id] || []);
  }, []);

  const deleteSession = useCallback(
    (id) => {
      const store = storeRef.current;
      store.sessions = store.sessions.filter((s) => s.id !== id);
      delete store.messages[id];
      commit();
      setActiveId((cur) => {
        if (cur === id) {
          setMessages([]);
          return null;
        }
        return cur;
      });
    },
    [commit]
  );

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed || isSending) return;

      const userMsg = { role: "user", content: trimmed };
      const history = [...messages, userMsg];
      setMessages(history);
      setIsSending(true);

      const store = storeRef.current;
      let sessionId = activeId;
      // Lazily create the session on the first message.
      if (!sessionId) {
        sessionId = newId();
        store.sessions.push({ id: sessionId, title: titleFromText(trimmed), updatedAt: Date.now() });
        setActiveId(sessionId);
      } else {
        const s = store.sessions.find((x) => x.id === sessionId);
        if (s) s.updatedAt = Date.now();
      }
      store.messages[sessionId] = history;
      commit();

      try {
        const reply = await sendJojoMessage({ messages: history });
        const next = [...history, { role: "assistant", content: reply }];
        setMessages(next);
        store.messages[sessionId] = next;
        const s = store.sessions.find((x) => x.id === sessionId);
        if (s) s.updatedAt = Date.now();
        commit();
      } catch (err) {
        const fallback =
          err instanceof JojoChatError
            ? err.message
            : "I couldn't reach the server. Check your connection and try again.";
        const next = [...history, { role: "assistant", content: fallback }];
        setMessages(next);
        store.messages[sessionId] = next;
        commit();
      } finally {
        setIsSending(false);
      }
    },
    [activeId, isSending, messages, commit]
  );

  return {
    sessions,
    activeId,
    messages,
    isSending,
    newChat,
    selectSession,
    deleteSession,
    sendMessage,
  };
}

// ── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  {
    label: "Spot cyberbullying signs",
    prompt: "What are the warning signs my teen is being cyberbullied?",
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
  {
    label: "Start a hard conversation",
    prompt: "How do I start a hard conversation with my teen about their mental health?",
    icon: (
      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

// ── Icons ────────────────────────────────────────────────────────────────────

const ComposeIcon = (p) => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const SearchIcon = (p) => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const PanelIcon = (p) => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </svg>
);
const TrashIcon = (p) => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);
const MenuIcon = (p) => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...p}>
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);

// ── Chat pieces ──────────────────────────────────────────────────────────────

function JojoAvatar({ size = 30 }) {
  const dim = `${size}px`;
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]"
      style={{ width: dim, height: dim }}
    >
      <svg width={size * 0.55} height={size * 0.55} fill="white" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]" />
    </div>
  );
}

function Message({ message }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-3xl bg-[var(--accent)] px-4 py-2.5 text-[15px] leading-relaxed text-white">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]">
      {message.content}
    </div>
  );
}

// ── Composer (the rounded pill) ──────────────────────────────────────────────

function Composer({ value, onChange, onSubmit, disabled, autoFocus }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-end gap-2 rounded-[26px] border border-[var(--accent-border)] bg-[var(--surface)] px-2.5 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-colors focus-within:border-[var(--accent-border)]">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[var(--muted)]">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <textarea
          ref={textareaRef}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-all hover:bg-[var(--accent-hover)]"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

function ChatSidebar({ collapsed, onToggle, sessions, activeId, onSelect, onNewChat, onDelete, mobile = false }) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((c) => (c.title || "").toLowerCase().includes(q));
  }, [sessions, query]);

  if (collapsed) {
    return (
      <div className="flex w-[56px] flex-shrink-0 flex-col items-center gap-1 border-r border-[var(--border)] bg-[var(--surface-muted)] py-3">
        <button onClick={onToggle} aria-label="Expand sidebar" className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
          <PanelIcon />
        </button>
        <button onClick={onNewChat} aria-label="New chat" className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
          <ComposeIcon />
        </button>
        <button onClick={() => { onToggle(); setSearching(true); }} aria-label="Search chats" className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
          <SearchIcon />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex ${mobile ? "h-full w-full" : "w-[260px]"} flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-muted)] pt-3 pb-3`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <JojoAvatar size={26} />
          <span className="text-[14px] font-semibold text-[var(--foreground)]">JoJo</span>
        </div>
        <button onClick={onToggle} aria-label="Collapse sidebar" title="Collapse sidebar" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
          <PanelIcon size={17} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col px-2 pt-1">
        <button onClick={onNewChat} className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
          <ComposeIcon />
          New chat
        </button>
        <button
          onClick={() => setSearching((s) => !s)}
          className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] transition-colors hover:bg-[var(--surface)] ${searching ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}
        >
          <SearchIcon />
          Search chats
        </button>
      </div>

      {searching && (
        <div className="px-3 pt-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent-border)] focus:outline-none"
          />
        </div>
      )}

      {/* Chats list */}
      <div className="mt-3 flex-1 overflow-y-auto px-2 pb-3">
        <p className="px-2.5 pb-1 text-[12px] font-medium text-[var(--muted)]">Chats</p>
        {list.length === 0 ? (
          <p className="px-2.5 py-2 text-[12.5px] italic text-[var(--muted)]">
            {query ? "No matching chats." : "No chats yet."}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {list.map((c) => {
              const isActive = c.id === activeId;
              return (
                <div key={c.id} className={`group flex items-center rounded-lg pr-1 ${isActive ? "bg-[var(--surface)]" : "hover:bg-[var(--surface)]"}`}>
                  <button onClick={() => onSelect(c.id)} className="flex-1 truncate px-2.5 py-2 text-left text-[13.5px] text-[var(--foreground)]">
                    {c.title || "New chat"}
                  </button>
                  <button onClick={() => onDelete(c.id)} aria-label="Delete chat" className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--muted)] opacity-0 transition-all hover:bg-[var(--surface-muted)] hover:text-red-500 group-hover:opacity-100">
                    <TrashIcon />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guest CTA — pinned to the bottom of the sidebar */}
      <div className="border-t border-[var(--border)] p-3">
        <Link
          href="/signup"
          className="flex flex-col gap-1 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-2.5 transition-colors hover:bg-[var(--accent-bg-hover)]"
        >
          <span className="text-[13px] font-semibold text-[var(--foreground)]">
            Get the full Guardiané →
          </span>
          <span className="text-[11.5px] leading-snug text-[var(--muted)]">
            Mood boards, screen-time insights, alerts &amp; saved chat history.
          </span>
        </Link>
      </div>
    </div>
  );
}

// ── Sign-up gate (shown after the free trial turn is used) ───────────────────

function SignupGate({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm  "
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="jojo-signup-gate-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-2xl"
      >
        <div className="mx-auto mb-4 flex justify-center">
          <JojoAvatar size={48} />
        </div>
        <h2
          id="jojo-signup-gate-title"
          className="mb-2 text-[19px] font-semibold tracking-tight text-[var(--foreground)]"
        >
          Sign up to keep chatting with JoJo
        </h2>
        <p className="mb-6 text-[14px] leading-relaxed text-[var(--muted)]">
          You&apos;ve used your free trial message. Create a free account to
          continue the conversation and unlock saved chat history, mood boards,
          screen-time insights and alerts.
        </p>
        <div className="flex flex-col gap-2.5">
          <Link
            href="/signup"
            className="w-full rounded-full bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Sign up free
          </Link>
          <Link
            href="/login"
            className="w-full rounded-full px-5 py-2.5 text-[14px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChatbotPage() {
  const {
    sessions,
    activeId,
    messages,
    isSending,
    newChat,
    selectSession,
    deleteSession,
    sendMessage,
  } = useGuestJojoChat();

  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [triesUsed, setTriesUsed] = useState(0);
  const [showSignupGate, setShowSignupGate] = useState(false);
  const isMobile = useIsMobile();
  const scrollRef = useRef(null);

  // Hydrate the trial counter from localStorage after mount (reading storage
  // during render would mismatch the storage-less server render).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setTriesUsed(readTries());
  }, []);

  // Auto-collapse the sidebar when the viewport drops to phone size, and reopen
  // it inline when there's room again. Syncing during render (with an equality
  // guard so it can't loop) is the documented pattern for reacting to a
  // changing prop — see https://react.dev/learn/you-might-not-need-an-effect
  const [wasMobile, setWasMobile] = useState(isMobile);
  if (isMobile !== wasMobile) {
    setWasMobile(isMobile);
    setCollapsed(isMobile);
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isSending]);

  function handleSend(text) {
    const trimmed = (text || "").trim();
    if (!trimmed || isSending) return;
    // Free trial is one turn — any further send opens the sign-up gate.
    if (triesUsed >= TRIAL_LIMIT) {
      setShowSignupGate(true);
      return;
    }
    sendMessage(trimmed);
    setInput("");
    const next = triesUsed + 1;
    setTriesUsed(next);
    writeTries(next);
  }

  function handleNewChat() {
    newChat();
    setInput("");
  }

  const isEmpty = messages.length === 0 && !isSending;

  // On mobile the drawer is closed whenever the sidebar is collapsed; opening it
  // overlays the chat instead of squeezing it. Selecting a chat / starting a new
  // one closes the drawer so the conversation is visible right away.
  const drawerOpen = isMobile && !collapsed;
  const closeDrawer = () => setCollapsed(true);

  return (
    <div className="relative flex h-dvh overflow-hidden bg-[var(--background)] font-sans text-[var(--foreground)]">
      <SignupGate open={showSignupGate} onClose={() => setShowSignupGate(false)} />

      {/* Desktop: inline sidebar (full panel or 56px rail) */}
      {!isMobile && (
        <ChatSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          sessions={sessions}
          activeId={activeId}
          onSelect={selectSession}
          onNewChat={handleNewChat}
          onDelete={deleteSession}
        />
      )}

      {/* Mobile: slide-over drawer at 80% width with a tap-to-dismiss backdrop */}
      {drawerOpen && (
        <>
          <div
            className="absolute inset-0 z-30 bg-black/40"
            onClick={closeDrawer}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 z-40 w-5/6 max-w-[320px] shadow-2xl">
            <ChatSidebar
              mobile
              collapsed={false}
              onToggle={closeDrawer}
              sessions={sessions}
              activeId={activeId}
              onSelect={(id) => { selectSession(id); closeDrawer(); }}
              onNewChat={() => { handleNewChat(); closeDrawer(); }}
              onDelete={deleteSession}
            />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-5">
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={() => setCollapsed(false)}
                aria-label="Open chats menu"
                className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              >
                <MenuIcon />
              </button>
            )}
            <span className="text-[15px] font-semibold text-[var(--foreground)]">JoJo Chatbot</span>
            <span className="hidden rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)] sm:inline-block">
              Guest
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <ThemeToggle />
            <Link
              href="/login"
              className="focus-visible-ring rounded-full px-3 py-1.5 text-[0.78rem] font-medium text-[var(--muted)] transition-all duration-200 hover:bg-white/5 hover:text-[var(--foreground)] sm:px-4 sm:py-2"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="focus-visible-ring rounded-full bg-[var(--background)] px-3.5 py-1.5 text-[0.78rem] font-semibold text-[var(--background)] shadow-sm shadow-black/10 transition-all duration-200 hover:scale-[1.02] sm:px-5 sm:py-2"
            >
              Sign up
            </Link>
          </div>
        </div>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24 sm:px-6">
            <h1 className="mb-7 text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[28px]">
              Where should we begin?
            </h1>
            <div className="w-full max-w-2xl">
              <Composer
                value={input}
                onChange={setInput}
                onSubmit={() => handleSend(input)}
                disabled={isSending}
                autoFocus
              />
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleSend(s.prompt)}
                    className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[13.5px] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
                  >
                    <span className="text-[var(--muted)]">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7">
              <div className="mx-auto flex max-w-3xl flex-col gap-6">
                {messages.map((m, i) => (
                  <Message key={i} message={m} />
                ))}
                {isSending && <TypingDots />}
              </div>
            </div>
            <div className="px-4 pb-4 sm:px-6">
              <div className="mx-auto max-w-3xl">
                <Composer
                  value={input}
                  onChange={setInput}
                  onSubmit={() => handleSend(input)}
                  disabled={isSending}
                />
                <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
                  JoJo offers general guidance, not medical or legal advice. In an emergency, call your local services.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
