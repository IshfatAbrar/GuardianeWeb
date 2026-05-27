"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const QUESTION_TYPES = [
  { id: "multiple-choice", label: "Multiple Choice" },
  { id: "true-false", label: "True / False" },
  { id: "short-answer", label: "Short Answer" },
  { id: "matching", label: "Matching" },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked
          ? "bg-[var(--accent)]"
          : "border border-[var(--border)] bg-[var(--surface-muted)]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function OptionsMenu({ open, onClose }) {
  if (!open) return null;
  const items = ["Preview", "Save Draft", "Load Draft", "Templates"];
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden />
      <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]">
        {items.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={onClose}
            className={`block w-full px-4 py-3 text-left text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] ${
              i < items.length - 1 ? "border-b border-[var(--border)]" : ""
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

export function CreateModuleModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetSpecific, setTargetSpecific] = useState(false);
  const [questionType, setQuestionType] = useState("multiple-choice");
  const [questions, setQuestions] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchor = useRef(null);

  const canCreate = title.trim().length > 0;

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setTargetSpecific(false);
      setQuestionType("multiple-choice");
      setQuestions([]);
      setMenuOpen(false);
    }
  }, [open]);

  function handleAddQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: Date.now(), type: questionType, prompt: "", choices: ["", ""] },
    ]);
  }

  function handleRemoveQuestion(id) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function handleCreate() {
    if (!canCreate) return;
    onCreate?.({
      title: title.trim(),
      description: description.trim(),
      targetSpecific,
      questions,
    });
    onClose();
  }

  if (!open || typeof document === "undefined") return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-module-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="space-y-7 p-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h1
                id="create-module-title"
                className="text-xl font-semibold tracking-tight text-[var(--foreground)]"
              >
                Create Module
              </h1>
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                Add questions to your lesson
              </p>
            </div>
            <div ref={menuAnchor} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More options"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent-border)] bg-transparent text-[var(--accent)] transition-colors hover:bg-[var(--accent-bg)]"
              >
                <svg
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="6" cy="12" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="18" cy="12" r="1.6" />
                </svg>
              </button>
              <OptionsMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="h-px w-full bg-[var(--border)]" />

          {/* Lesson title */}
          <div className="space-y-2">
            <label className="block text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
              Lesson Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent-border)] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a short description"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent-border)] focus:outline-none"
            />
          </div>

          {/* Target Children */}
          <div className="space-y-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
              Target Children
            </h2>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[14px] font-medium text-[var(--foreground)]">
                  Create for specific children
                </span>
                <Toggle checked={targetSpecific} onChange={setTargetSpecific} />
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
                {targetSpecific
                  ? "Choose which children will receive this lesson."
                  : "This lesson will be available to all children."}
              </p>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                Questions
              </h2>
              <span className="inline-flex items-center rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-1 text-[11px] font-semibold text-[var(--accent)]">
                {questions.length}{" "}
                {questions.length === 1 ? "question" : "questions"}
              </span>
            </div>
          </div>

          {/* Question type */}
          <div className="space-y-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
              Question Type
            </h2>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((t) => {
                const active = questionType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setQuestionType(t.id)}
                    className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question list */}
          {questions.length > 0 && (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Question {idx + 1} ·{" "}
                      {QUESTION_TYPES.find((t) => t.id === q.type)?.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.id)}
                      aria-label="Remove question"
                      className="text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
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
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Type your question…"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[13.5px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent-border)] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add Question */}
          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-[14px] font-semibold text-[var(--muted)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Add Question
          </button>

          {/* Create Lesson */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className="w-full rounded-2xl bg-[var(--accent)] px-4 py-4 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)] disabled:shadow-none"
          >
            Create Lesson
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
