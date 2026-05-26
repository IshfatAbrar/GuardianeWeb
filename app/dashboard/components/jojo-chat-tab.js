"use client";

import { useEffect, useRef, useState } from "react";

const SUGGESTED_PROMPTS = [
  "How do I talk to my teen about screen time?",
  "What are signs my child is struggling with anxiety?",
  "Help me set healthy device boundaries for my family.",
  "How can I support my child after a tough day at school?",
];

const INTRO_MESSAGE = {
  role: "assistant",
  content:
    "Hi, I'm JoJo — your family's AI assistant. I can help with teen safety, mental health, and digital well-being questions. What's on your mind today?",
};

function JojoAvatar({ size = 32 }) {
  const dim = `${size}px`;
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] shadow-sm shadow-[var(--accent)]/30"
      style={{ width: dim, height: dim }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        fill="white"
        viewBox="0 0 24 24"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  );
}

function UserAvatar({ initial }) {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[11px] font-semibold text-[var(--foreground)]">
      {initial || "Y"}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]" />
    </div>
  );
}

function Message({ message, userInitial }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex w-full items-start gap-3 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {isUser ? <UserAvatar initial={userInitial} /> : <JojoAvatar />}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
          isUser
            ? "bg-[var(--accent)] text-white"
            : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

export function JojoChatTab({ userInitial = "Y" }) {
  const [messages, setMessages] = useState([INTRO_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage = { role: "user", content: trimmed };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/jojo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      const reply =
        data?.reply ||
        "I'm having trouble responding right now. Please try again in a moment.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I couldn't reach the server. Check your connection and try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleReset() {
    setMessages([INTRO_MESSAGE]);
  }

  const showSuggestions = messages.length <= 1 && !isSending;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
        <div className="flex items-center gap-3">
          <JojoAvatar size={36} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                JoJo
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                Online
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-[var(--muted)]">
              Private 24/7 support for teen safety, mental health, and digital
              well-being
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
        >
          <svg
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
          New chat
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-6 px-4"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {messages.map((m, i) => (
            <Message key={i} message={m} userInitial={userInitial} />
          ))}

          {isSending && (
            <div className="flex w-full items-start gap-3">
              <JojoAvatar />
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3">
                <TypingDots />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[var(--border)] pt-4 px-4"
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 transition-colors focus-within:border-[var(--accent-border)]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask JoJo anything…"
              rows={1}
              disabled={isSending}
              className="flex-1 resize-none bg-transparent px-2 py-2 text-[13.5px] leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Send message"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-[var(--muted)]">
            JoJo offers general guidance, not medical or legal advice. In an
            emergency, call your local services.
          </p>
        </div>
      </form>
    </div>
  );
}
