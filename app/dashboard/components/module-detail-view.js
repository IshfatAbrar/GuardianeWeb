"use client";

import { useEffect, useState } from "react";
import {
  getModuleWithLessons,
  assignModule,
  MODULE_CATEGORIES,
} from "../../lib/learningModules";

function StatPill({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
      <p className="text-base font-bold text-[var(--accent)]">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}

function LessonRow({ lesson, isParentModule, onOpen }) {
  const questionCount = Array.isArray(lesson.questions) ? lesson.questions.length : 0;
  const playable = isParentModule && questionCount > 0;
  return (
    <button
      type="button"
      onClick={playable ? onOpen : undefined}
      disabled={!playable}
      className={`flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all ${
        playable ? "hover:border-[var(--accent-border)] hover:bg-[var(--surface-muted)]" : "cursor-default"
      }`}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent)]">
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M22 7 12 13 2 7" />
          <path d="M2 7v10l10 6 10-6V7L12 1z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
          {lesson.title}
        </p>
        {lesson.description && (
          <p className="line-clamp-1 text-[12px] text-[var(--muted)]">
            {lesson.description}
          </p>
        )}
        <p className="mt-0.5 text-[11px] text-[var(--muted)]">
          {questionCount} {questionCount === 1 ? "question" : "questions"}
          {!isParentModule && " · assign module to a child to take it"}
        </p>
      </div>
      {playable && (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}
    </button>
  );
}

export function ModuleDetailView({
  moduleId,
  childList = [],
  parentId,
  onBack,
  onAssigned,
  onOpenLesson,
}) {
  const [module_, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [assigningChildId, setAssigningChildId] = useState(null);
  const [assignError, setAssignError] = useState(null);

  useEffect(() => {
    if (!moduleId) return;
    let cancelled = false;
    getModuleWithLessons(moduleId)
      .then((result) => {
        if (!cancelled) setModule(result);
      })
      .catch((err) => {
        if (!cancelled) setErrorMessage(err.message || "Failed to load module");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const isParentModule = module_?.category === MODULE_CATEGORIES.PARENT;
  const lessons = module_?.lessons || [];

  async function handleAssign(childId) {
    if (!module_ || !parentId) return;
    setAssigningChildId(childId);
    setAssignError(null);
    try {
      await assignModule({
        moduleId: module_.id,
        childId,
        parentId,
        category: module_.category,
      });
      onAssigned?.();
    } catch (err) {
      setAssignError(err.message || "Failed to assign");
    } finally {
      setAssigningChildId(null);
    }
  }

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
            {isParentModule ? "Parent Module" : module_?.category === MODULE_CATEGORIES.CHILD ? "Child Module" : "Module"}
          </p>
          <h1 className="truncate text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {module_?.title || (loading ? "Loading…" : "Module")}
          </h1>
        </div>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      <div className="space-y-6 p-6">
        {errorMessage && (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
            {errorMessage}
          </div>
        )}

        {module_ && (
          <>
            {module_.description && (
              <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
                {module_.description}
              </p>
            )}
            {module_.createdByName && (
              <p className="text-[12px] text-[var(--muted)]">
                Created by {module_.createdByName}
              </p>
            )}

            {/*
              `estimatedDuration` and `difficulty` only exist on modules this
              web app created. The Android built-ins carry neither, and showing
              "0 min" / "Difficulty 1" for them is worse than showing nothing.
            */}
            <div
              className={`grid gap-2 ${
                module_.estimatedDuration || module_.difficulty ? "grid-cols-3" : "grid-cols-1"
              }`}
            >
              <StatPill label="Lessons" value={module_.lessonCount ?? lessons.length} />
              {module_.estimatedDuration > 0 && (
                <StatPill
                  label="Duration"
                  value={`${Math.round(module_.estimatedDuration / 60)} min`}
                />
              )}
              {module_.difficulty != null && (
                <StatPill label="Difficulty" value={module_.difficulty} />
              )}
            </div>

            {!isParentModule && (
              <div className="space-y-2">
                <h2 className="text-[14px] font-semibold tracking-tight text-[var(--foreground)]">
                  Assign to a child
                </h2>
                {childList.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-center text-[12.5px] text-[var(--muted)]">
                    No children on file. Add children from settings first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {childList.map((c) => {
                      const busy = assigningChildId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleAssign(c.id)}
                          disabled={busy || !parentId}
                          className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy ? "Assigning…" : c.name || "Child"}
                        </button>
                      );
                    })}
                  </div>
                )}
                {assignError && (
                  <p className="text-[12px] text-[var(--danger)]">{assignError}</p>
                )}
              </div>
            )}
          </>
        )}

        <div className="space-y-3">
          <h2 className="text-[14px] font-semibold tracking-tight text-[var(--foreground)]">
            Lessons
          </h2>
          {loading ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
              Loading lessons…
            </div>
          ) : lessons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
              No lessons in this module yet.
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  isParentModule={isParentModule}
                  onOpen={() => onOpenLesson?.(lesson, isParentModule)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
