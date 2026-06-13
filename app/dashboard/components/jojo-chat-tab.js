"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useJojoChat } from "../_lib/useJojoChat";

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

// User messages sit in a bubble (right-aligned); JoJo replies render as plain
// text spanning the column, the way ChatGPT / Claude present assistant output.
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

function ChatSidebar({ collapsed, onToggle, sessions, activeId, onSelect, onNewChat, onDelete }) {
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
    <div className="flex w-[260px] flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-muted)]">
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
    </div>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────

export function JojoChatTab() {
  const {
    sessions,
    activeId,
    messages,
    isSending,
    loadingMessages,
    newChat,
    selectSession,
    deleteSession,
    sendMessage,
  } = useJojoChat();

  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isSending]);

  function handleSend(text) {
    sendMessage(text);
    setInput("");
  }

  function handleNewChat() {
    newChat();
    setInput("");
  }

  const isEmpty = messages.length === 0 && !isSending && !loadingMessages;

  return (
    <div className="flex h-[90vh] overflow-hidden">
      <ChatSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        sessions={sessions}
        activeId={activeId}
        onSelect={selectSession}
        onNewChat={handleNewChat}
        onDelete={deleteSession}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="text-[15px] font-semibold text-[var(--foreground)]">JoJo</span>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="text-[var(--muted)]">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
            <h1 className="mb-7 text-[28px] font-semibold tracking-tight text-[var(--foreground)]">
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              <div className="mx-auto flex max-w-3xl flex-col gap-6">
                {loadingMessages && messages.length === 0 ? (
                  <p className="text-[13px] text-[var(--muted)]">Loading…</p>
                ) : (
                  messages.map((m, i) => <Message key={i} message={m} />)
                )}
                {isSending && <TypingDots />}
              </div>
            </div>
            <div className="px-4 pb-4">
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
