"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  createModuleWithLesson,
  buildMultipleChoiceQuestion,
  buildTrueFalseQuestion,
  buildFillBlankQuestion,
  MODULE_CATEGORIES,
  QUESTION_TYPES,
} from "../../lib/learningModules";

const TYPE_OPTIONS = [
  { id: QUESTION_TYPES.MULTIPLE_CHOICE, label: "Multiple Choice" },
  { id: QUESTION_TYPES.TRUE_FALSE, label: "True / False" },
  { id: QUESTION_TYPES.FILL_BLANK, label: "Short Answer" },
];

function emptyQuestion(type) {
  const base = { id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, prompt: "", explanation: "" };
  if (type === QUESTION_TYPES.MULTIPLE_CHOICE) {
    return { ...base, options: ["", ""], correctIndex: 0 };
  }
  if (type === QUESTION_TYPES.TRUE_FALSE) {
    return { ...base, correctAnswer: "true" };
  }
  return { ...base, acceptedAnswers: [""] };
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-[var(--accent)]" : "border border-[var(--border)] bg-[var(--surface-muted)]"
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

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[13.5px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent-border)] focus:outline-none ${props.className || ""}`}
    />
  );
}

function MultipleChoiceEditor({ q, onChange }) {
  function setOption(i, value) {
    const options = q.options.slice();
    options[i] = value;
    onChange({ ...q, options });
  }
  function addOption() {
    onChange({ ...q, options: [...q.options, ""] });
  }
  function removeOption(i) {
    if (q.options.length <= 2) return;
    const options = q.options.filter((_, idx) => idx !== i);
    const correctIndex = Math.min(q.correctIndex, options.length - 1);
    onChange({ ...q, options, correctIndex });
  }
  return (
    <div className="space-y-2">
      {q.options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...q, correctIndex: i })}
            aria-label={i === q.correctIndex ? "Correct answer" : "Mark as correct"}
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
              i === q.correctIndex
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
            }`}
          >
            {i === q.correctIndex ? "✓" : ""}
          </button>
          <TextInput
            value={opt}
            onChange={(e) => setOption(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
          />
          {q.options.length > 2 && (
            <button
              type="button"
              onClick={() => removeOption(i)}
              aria-label="Remove option"
              className="text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        className="text-[12px] font-semibold text-[var(--accent)] hover:underline"
      >
        + Add option
      </button>
    </div>
  );
}

function TrueFalseEditor({ q, onChange }) {
  return (
    <div className="flex gap-2">
      {["true", "false"].map((v) => {
        const active = q.correctAnswer === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange({ ...q, correctAnswer: v })}
            className={`flex-1 rounded-lg border px-3 py-2 text-[13px] font-semibold capitalize transition-colors ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

function FillBlankEditor({ q, onChange }) {
  function setAnswer(i, value) {
    const acceptedAnswers = q.acceptedAnswers.slice();
    acceptedAnswers[i] = value;
    onChange({ ...q, acceptedAnswers });
  }
  function addAnswer() {
    onChange({ ...q, acceptedAnswers: [...q.acceptedAnswers, ""] });
  }
  function removeAnswer(i) {
    if (q.acceptedAnswers.length <= 1) return;
    onChange({ ...q, acceptedAnswers: q.acceptedAnswers.filter((_, idx) => idx !== i) });
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-[var(--muted)]">
        List any answers that should be accepted as correct.
      </p>
      {q.acceptedAnswers.map((ans, i) => (
        <div key={i} className="flex items-center gap-2">
          <TextInput
            value={ans}
            onChange={(e) => setAnswer(i, e.target.value)}
            placeholder={`Accepted answer ${i + 1}`}
          />
          {q.acceptedAnswers.length > 1 && (
            <button
              type="button"
              onClick={() => removeAnswer(i)}
              aria-label="Remove answer"
              className="text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addAnswer}
        className="text-[12px] font-semibold text-[var(--accent)] hover:underline"
      >
        + Add accepted answer
      </button>
    </div>
  );
}

function QuestionEditor({ q, index, onChange, onRemove }) {
  const label = TYPE_OPTIONS.find((t) => t.id === q.type)?.label || "Question";
  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Question {index + 1} · {label}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove question"
          className="text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <TextInput
        value={q.prompt}
        onChange={(e) => onChange({ ...q, prompt: e.target.value })}
        placeholder="Type your question…"
      />
      {q.type === QUESTION_TYPES.MULTIPLE_CHOICE && (
        <MultipleChoiceEditor q={q} onChange={onChange} />
      )}
      {q.type === QUESTION_TYPES.TRUE_FALSE && (
        <TrueFalseEditor q={q} onChange={onChange} />
      )}
      {q.type === QUESTION_TYPES.FILL_BLANK && (
        <FillBlankEditor q={q} onChange={onChange} />
      )}
      <TextInput
        value={q.explanation}
        onChange={(e) => onChange({ ...q, explanation: e.target.value })}
        placeholder="Explanation (optional)"
      />
    </div>
  );
}

export function CreateModuleModal({
  open,
  onClose,
  onCreated,
  childList = [],
  creatorId,
  creatorName,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moduleType, setModuleType] = useState(MODULE_CATEGORIES.CHILD);
  const [targetSpecific, setTargetSpecific] = useState(false);
  const [selectedChildIds, setSelectedChildIds] = useState([]);
  const [questionType, setQuestionType] = useState(QUESTION_TYPES.MULTIPLE_CHOICE);
  const [questions, setQuestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const canCreate = useMemo(() => {
    if (!title.trim() || submitting || !creatorId) return false;
    if (questions.length === 0) return false;
    if (moduleType === MODULE_CATEGORIES.CHILD && targetSpecific && selectedChildIds.length === 0) return false;
    return true;
  }, [title, submitting, creatorId, questions.length, moduleType, targetSpecific, selectedChildIds.length]);

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
      setModuleType(MODULE_CATEGORIES.CHILD);
      setTargetSpecific(false);
      setSelectedChildIds([]);
      setQuestionType(QUESTION_TYPES.MULTIPLE_CHOICE);
      setQuestions([]);
      setSubmitting(false);
      setErrorMessage(null);
    }
  }, [open]);

  function handleAddQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion(questionType)]);
  }

  function handleQuestionChange(id, next) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? next : q)));
  }

  function handleRemoveQuestion(id) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function toggleChild(childId) {
    setSelectedChildIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId],
    );
  }

  async function handleCreate() {
    if (!canCreate) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const builtQuestions = questions.map((q) => {
        if (q.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
          return buildMultipleChoiceQuestion({
            question: q.prompt,
            explanation: q.explanation,
            options: q.options,
            correctAnswerIndex: q.correctIndex,
          });
        }
        if (q.type === QUESTION_TYPES.TRUE_FALSE) {
          return buildTrueFalseQuestion({
            question: q.prompt,
            explanation: q.explanation,
            correctAnswer: q.correctAnswer,
          });
        }
        return buildFillBlankQuestion({
          question: q.prompt,
          explanation: q.explanation,
          acceptedAnswers: q.acceptedAnswers,
        });
      });

      const isChild = moduleType === MODULE_CATEGORIES.CHILD;
      await createModuleWithLesson({
        title,
        description,
        category: moduleType,
        difficulty: 1,
        estimatedDuration: 15,
        questions: builtQuestions,
        createdBy: creatorId,
        createdByName: creatorName || "Parent",
        targetChildIds: isChild && targetSpecific ? selectedChildIds : null,
        isChildSpecific: isChild && targetSpecific,
      });

      onCreated?.();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to create module");
    } finally {
      setSubmitting(false);
    }
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
              <h1 id="create-module-title" className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
                Create Module
              </h1>
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                Add a lesson with one or more questions
              </p>
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

          {errorMessage && (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
              {errorMessage}
            </div>
          )}

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

          {/* Module Type */}
          <div className="space-y-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
              Module Type
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: MODULE_CATEGORIES.PARENT,
                  label: "Parent",
                  hint: "You can take the quiz yourself",
                },
                {
                  id: MODULE_CATEGORIES.CHILD,
                  label: "Child",
                  hint: "Assign to a child to let them take it",
                },
              ].map((t) => {
                const active = moduleType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setModuleType(t.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-bg)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    <p className={`text-[13.5px] font-semibold ${active ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
                      {t.label}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">{t.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Children (child modules only) */}
          {moduleType === MODULE_CATEGORIES.CHILD && (
            <div className="space-y-3">
              <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                Target Children
              </h2>
              <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[14px] font-medium text-[var(--foreground)]">
                    Create for specific children
                  </span>
                  <Toggle checked={targetSpecific} onChange={setTargetSpecific} />
                </div>
                <p className="text-[12px] leading-relaxed text-[var(--muted)]">
                  {targetSpecific
                    ? "Choose which children will receive this lesson."
                    : "This lesson will be available to all children."}
                </p>

                {targetSpecific && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {childList.length === 0 ? (
                      <p className="text-[12px] text-[var(--muted)]">
                        No children on file yet — add children from settings first.
                      </p>
                    ) : (
                      childList.map((c) => {
                        const active = selectedChildIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleChild(c.id)}
                            className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                              active
                                ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                                : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                            }`}
                          >
                            {c.name || "Child"}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Questions header */}
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
              {TYPE_OPTIONS.map((t) => {
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
                <QuestionEditor
                  key={q.id}
                  q={q}
                  index={idx}
                  onChange={(next) => handleQuestionChange(q.id, next)}
                  onRemove={() => handleRemoveQuestion(q.id)}
                />
              ))}
            </div>
          )}

          {/* Add Question */}
          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-[14px] font-semibold text-[var(--muted)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Add Question
          </button>

          {/* Create */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className="w-full rounded-2xl bg-[var(--accent)] px-4 py-4 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)] disabled:shadow-none"
          >
            {submitting ? "Creating…" : "Create Lesson"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
