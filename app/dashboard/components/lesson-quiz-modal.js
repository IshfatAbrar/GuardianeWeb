"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { QUESTION_TYPES } from "../../lib/learningModules";

function isCorrect(question, userAnswer) {
  if (!userAnswer) return false;
  if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
    return userAnswer === question.correctAnswer;
  }
  if (question.type === QUESTION_TYPES.TRUE_FALSE) {
    return (
      String(userAnswer).toLowerCase() === String(question.correctAnswer).toLowerCase()
    );
  }
  if (question.type === QUESTION_TYPES.FILL_BLANK) {
    const guess = String(userAnswer).trim().toLowerCase();
    if (Array.isArray(question.acceptedAnswers)) {
      return question.acceptedAnswers.some((a) => String(a).trim().toLowerCase() === guess);
    }
    return guess === String(question.correctAnswer || "").trim().toLowerCase();
  }
  return false;
}

function QuestionPlayer({ question, value, onChange }) {
  if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
    return (
      <div className="space-y-2">
        {(question.options || []).map((opt, i) => {
          const active = value === opt;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-[13.5px] transition-colors ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              <span>{opt}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)]"
                }`}
              >
                {active ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === QUESTION_TYPES.TRUE_FALSE) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: "true", label: "True" },
          { id: "false", label: "False" },
        ].map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={`rounded-xl border px-4 py-3 text-[13.5px] font-semibold transition-colors ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer…"
      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[13.5px] text-[var(--foreground)] focus:border-[var(--accent-border)] focus:outline-none"
    />
  );
}

function Results({ questions, answers, onClose, onRetry }) {
  const correct = useMemo(
    () => questions.reduce((sum, q) => sum + (isCorrect(q, answers[q.id]) ? 1 : 0), 0),
    [questions, answers],
  );
  const score = questions.length === 0 ? 0 : correct / questions.length;
  const passed = score >= 0.7;
  const pct = Math.round(score * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold ${
            passed ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
          }`}
        >
          {pct}%
        </div>
        <p className="text-base font-semibold tracking-tight text-[var(--foreground)]">
          {passed ? "Great job!" : "Keep learning!"}
        </p>
        <p className="text-[12.5px] text-[var(--muted)]">
          You got {correct} of {questions.length} correct.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-[14px] font-semibold tracking-tight text-[var(--foreground)]">
          Review
        </h3>
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id] || "";
          const correctVal = q.correctAnswer || (q.acceptedAnswers?.[0] ?? "");
          const ok = isCorrect(q, userAnswer);
          return (
            <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold text-[var(--foreground)]">
                  {idx + 1}. {q.question}
                </p>
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    ok
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {ok ? "Correct" : "Wrong"}
                </span>
              </div>
              <div className="mt-2 grid gap-1 text-[12.5px]">
                <p className="text-[var(--muted)]">
                  Your answer:{" "}
                  <span className={ok ? "text-emerald-500" : "text-rose-500"}>
                    {userAnswer || "—"}
                  </span>
                </p>
                <p className="text-[var(--muted)]">
                  Correct: <span className="text-emerald-500">{correctVal || "—"}</span>
                </p>
                {q.explanation && (
                  <p className="mt-1 rounded-lg bg-[var(--accent-bg)] p-2 text-[var(--foreground)]">
                    {q.explanation}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[13.5px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export function LessonQuizModal({ open, onClose, lesson }) {
  if (!open || typeof document === "undefined" || !lesson) return null;
  return <QuizContent lesson={lesson} onClose={onClose} />;
}

function QuizContent({ lesson, onClose }) {
  const questions = useMemo(() => lesson?.questions || [], [lesson]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
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
  }, [onClose]);

  const current = questions[index];
  const total = questions.length;
  const answeredCurrent = current ? !!answers[current.id] : false;
  const allAnswered = questions.every((q) => !!answers[q.id]);

  function setAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  const body = total === 0 ? (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
      This lesson has no questions yet.
    </div>
  ) : completed ? (
    <Results
      questions={questions}
      answers={answers}
      onClose={onClose}
      onRetry={() => {
        setAnswers({});
        setIndex(0);
        setCompleted(false);
      }}
    />
  ) : (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
          <span>
            Question {index + 1} of {total}
          </span>
          <span>{Math.round(((index + 1) / total) * 100)}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            className="h-full bg-[var(--accent)] transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-[14px] font-medium text-[var(--foreground)]">
          {current.question}
        </p>
      </div>

      <QuestionPlayer
        question={current}
        value={answers[current.id]}
        onChange={(v) => setAnswer(current.id, v)}
      />

      <div className="flex justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        {index < total - 1 ? (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={!answeredCurrent}
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCompleted(true)}
            disabled={!allAnswered}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Complete
          </button>
        )}
      </div>
    </>
  );

  const modal = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 id="quiz-title" className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                {completed ? "Quiz results" : "Quiz"}
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">{lesson.title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-px w-full bg-[var(--border)]" />
          {body}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
