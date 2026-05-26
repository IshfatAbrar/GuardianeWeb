"use client";

import { useRef, useState } from "react";

const BUILT_IN_MODULES = [
  {
    id: "cyberbullying",
    title: "Cyberbullying",
    description:
      "Learn how to identify, prevent, and respond to cyberbullying both online and at school.",
    category: "Safety",
    lessons: 3,
    done: 1,
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: "online-safety",
    title: "Online Safety",
    description:
      "Essential tips for staying safe while browsing the internet and using social apps.",
    category: "Safety",
    lessons: 2,
    done: 0,
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
      </svg>
    ),
  },
  {
    id: "privacy-protection",
    title: "Privacy Protection",
    description:
      "Understanding and managing your digital privacy across apps, accounts, and devices.",
    category: "Privacy",
    lessons: 4,
    done: 2,
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    ),
  },
  {
    id: "digital-wellness",
    title: "Digital Wellness",
    description:
      "Maintaining a healthy relationship with technology, screen time, and online habits.",
    category: "Wellness",
    lessons: 3,
    done: 0,
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="8" r="3" />
        <path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      </svg>
    ),
  },
  {
    id: "social-media",
    title: "Social Media Literacy",
    description:
      "Critically evaluate posts, ads, and influencer content across major platforms.",
    category: "Safety",
    lessons: 5,
    done: 0,
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "mindful-tech",
    title: "Mindful Tech Use",
    description:
      "Build awareness around device habits and create healthy boundaries for the whole family.",
    category: "Wellness",
    lessons: 4,
    done: 4,
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
];

const QUESTION_TYPES = [
  { id: "multiple-choice", label: "Multiple Choice" },
  { id: "true-false", label: "True / False" },
  { id: "short-answer", label: "Short Answer" },
  { id: "matching", label: "Matching" },
];

function CategoryPill({ category }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
      {category}
    </span>
  );
}

function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ModuleCard({ module }) {
  return (
    <button
      type="button"
      className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent)]">
          {module.icon}
        </div>
        <CategoryPill category={module.category} />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
          {module.title}
        </h3>
        <p className="line-clamp-3 text-[12.5px] leading-relaxed text-[var(--muted)]">
          {module.description}
        </p>
      </div>

      <div className="mt-auto space-y-2">
        <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
          <span>{module.lessons} lessons</span>
          <span>
            {module.done}/{module.lessons} done
          </span>
        </div>
        <ProgressBar done={module.done} total={module.lessons} />
      </div>
    </button>
  );
}

function HubView({ onCreate }) {
  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Learning Modules
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Interactive lessons
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Hub
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Create Module
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      {/* Built-in modules */}
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            Built-in Modules
          </h2>
          <span className="text-[11px] font-medium text-[var(--muted)]">
            {BUILT_IN_MODULES.length} available
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {BUILT_IN_MODULES.map((m) => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </div>
      </div>
    </div>
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

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-[var(--accent)]" : "bg-[var(--surface-muted)] border border-[var(--border)]"
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

function CreateModuleView({ onBack }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetSpecific, setTargetSpecific] = useState(false);
  const [questionType, setQuestionType] = useState("multiple-choice");
  const [questions, setQuestions] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchor = useRef(null);

  const canCreate = title.trim().length > 0;

  function handleAddQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: Date.now(), type: questionType, prompt: "", choices: ["", ""] },
    ]);
  }

  function handleRemoveQuestion(id) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[var(--accent)] transition-colors hover:bg-[var(--accent-bg-hover)]"
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
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
            {questions.length} {questions.length === 1 ? "question" : "questions"}
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

      {/* Question list (just placeholders) */}
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
        disabled={!canCreate}
        className="w-full rounded-2xl bg-[var(--accent)] px-4 py-4 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)] disabled:shadow-none"
      >
        Create Lesson
      </button>
    </div>
  );
}

export function LearningTab() {
  const [view, setView] = useState("hub");

  return view === "hub" ? (
    <HubView onCreate={() => setView("create")} />
  ) : (
    <CreateModuleView onBack={() => setView("hub")} />
  );
}
