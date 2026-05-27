"use client";

import { QUESTION_TYPES } from "../../lib/learningModules";

const TYPE_LABEL = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: "Multiple Choice",
  [QUESTION_TYPES.TRUE_FALSE]: "True / False",
  [QUESTION_TYPES.FILL_BLANK]: "Short Answer",
};

function QuestionPreview({ question, index }) {
  const correctText = question.correctAnswer || question.acceptedAnswers?.[0] || "—";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-[var(--foreground)]">
          {index + 1}. {question.question}
        </p>
        <span className="flex-shrink-0 rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
          {TYPE_LABEL[question.type] || "Question"}
        </span>
      </div>

      {question.type === QUESTION_TYPES.MULTIPLE_CHOICE && Array.isArray(question.options) && (
        <ul className="mt-3 space-y-1 text-[12.5px]">
          {question.options.map((opt, i) => {
            const isAnswer = opt === question.correctAnswer || i === question.correctAnswerIndex;
            return (
              <li
                key={i}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                  isAnswer ? "bg-emerald-500/10 text-emerald-500" : "text-[var(--muted)]"
                }`}
              >
                <span className="text-[10px]">{isAnswer ? "✓" : "○"}</span>
                <span>{opt}</span>
              </li>
            );
          })}
        </ul>
      )}

      {question.type !== QUESTION_TYPES.MULTIPLE_CHOICE && (
        <p className="mt-2 text-[12.5px] text-[var(--muted)]">
          Correct answer:{" "}
          <span className="font-semibold text-emerald-500">{correctText}</span>
        </p>
      )}

      {question.explanation && (
        <p className="mt-2 rounded-lg bg-[var(--accent-bg)] p-2 text-[12px] text-[var(--foreground)]">
          {question.explanation}
        </p>
      )}
    </div>
  );
}

export function LessonDetailView({ lesson, canTakeQuiz = true, onBack, onStartQuiz }) {
  if (!lesson) return null;
  const questions = Array.isArray(lesson.questions) ? lesson.questions : [];
  const canStart = canTakeQuiz && questions.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 p-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Lesson
          </p>
          <h1 className="truncate text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {lesson.title}
          </h1>
        </div>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      <div className="space-y-6 p-6">
        {lesson.description && (
          <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
            {lesson.description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
            <p className="text-base font-bold text-[var(--accent)]">{questions.length}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Questions
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
            <p className="text-base font-bold capitalize text-emerald-500">
              {lesson.category || "—"}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Category
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
            <p className="truncate text-base font-bold text-amber-500" title={lesson.createdByName || "Unknown"}>
              {lesson.createdByName || "Unknown"}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Creator
            </p>
          </div>
        </div>

        {canStart && (
          <button
            type="button"
            onClick={onStartQuiz}
            className="w-full rounded-2xl bg-[var(--accent)] px-4 py-4 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5"
          >
            Start Quiz
          </button>
        )}

        {!canTakeQuiz && (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center text-[12.5px] text-[var(--muted)]">
            This lesson is meant for children. Assign the module to a child to let them take it.
          </p>
        )}

        {questions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
            No questions in this lesson yet.
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-[14px] font-semibold tracking-tight text-[var(--foreground)]">
              Questions
            </h2>
            {questions.map((q, idx) => (
              <QuestionPreview key={q.id || idx} question={q} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
