"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateModuleModal } from "./create-module-modal";
import { ModuleDetailView } from "./module-detail-view";
import { LessonDetailView } from "./lesson-detail-view";
import { LessonQuizModal } from "./lesson-quiz-modal";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAllModules,
  MODULE_CATEGORIES,
} from "../../lib/learningModules";

const CATEGORY_LABEL = {
  [MODULE_CATEGORIES.PARENT]: "Parent",
  [MODULE_CATEGORIES.CHILD]: "Child",
};

function CategoryPill({ category }) {
  const label = CATEGORY_LABEL[category] || (category || "Module");
  const isParent = category === MODULE_CATEGORIES.PARENT;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        isParent
          ? "bg-amber-500/15 text-amber-500"
          : "bg-[var(--accent)] text-white"
      }`}
    >
      {label}
    </span>
  );
}

function ModuleCard({ module, isYours, onOpen }) {
  const totalLessons = module.lessonCount ?? module.lessons?.length ?? 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex flex-col gap-4 rounded-2xl border bg-[var(--surface)] p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${
        isYours
          ? "border-emerald-500/40 hover:border-emerald-500"
          : "border-[var(--border)] hover:border-[var(--accent-border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent)]">
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
            <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
            <path d="M4 4v12a4 4 0 0 0 4 4" />
          </svg>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <CategoryPill category={module.category} />
          {isYours && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-500">
              Your module
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
          {module.title}
        </h3>
        {module.description && (
          <p className="line-clamp-3 text-[12.5px] leading-relaxed text-[var(--muted)]">
            {module.description}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
        <span className="truncate">
          By {module.createdByName || "Unknown"}
        </span>
        <span className="flex-shrink-0">
          {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
        </span>
      </div>
    </button>
  );
}

function Section({ title, count, accent, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h2>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            accent === "emerald"
              ? "bg-emerald-500/15 text-emerald-500"
              : "bg-[var(--accent-bg)] text-[var(--accent)]"
          }`}
        >
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function HubContent({
  loading,
  errorMessage,
  modules,
  filtered,
  yourModules,
  communityModules,
  hasActiveFilters,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  clearFilters,
  onOpenModule,
  onCreate,
  onRefresh,
  uid,
}) {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Learning Hub
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Discover, create, and take learning modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={!uid}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Create Module
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      {/* Search + filters */}
      <div className="space-y-3 p-6 pb-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors focus-within:border-[var(--accent-border)]">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="text-[var(--accent)]">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules, creators, or topics…"
            className="flex-1 bg-transparent text-[13.5px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
          />
          {!!searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[11px] font-semibold text-[var(--accent)] hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: null, label: "All categories" },
            { id: MODULE_CATEGORIES.PARENT, label: "Parent" },
            { id: MODULE_CATEGORIES.CHILD, label: "Child" },
          ].map((c) => {
            const active = categoryFilter === c.id;
            return (
              <button
                key={c.id || "all"}
                type="button"
                onClick={() => setCategoryFilter(c.id)}
                className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {c.label}
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[12px] font-semibold text-rose-500 transition-colors hover:bg-rose-500/15"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-[11px] font-medium text-[var(--muted)]">
            {filtered.length} {filtered.length === 1 ? "module" : "modules"}
          </span>
        </div>
      </div>

      <div className="space-y-8 p-6 pt-3">
        {errorMessage && (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-[12.5px] text-[var(--danger)]">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center text-sm text-[var(--muted)]">
            Loading modules…
          </div>
        ) : modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              No modules yet
            </p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Create your first module to get started.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              No modules match your filters
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 rounded-full bg-[var(--accent)] px-4 py-1.5 text-[12px] font-semibold text-white"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {yourModules.length > 0 && (
              <Section title="Your Modules" count={yourModules.length} accent="emerald">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {yourModules.map((m) => (
                    <ModuleCard
                      key={m.id}
                      module={m}
                      isYours
                      onOpen={() => onOpenModule(m.id)}
                    />
                  ))}
                </div>
              </Section>
            )}

            <Section title="Community Modules" count={communityModules.length}>
              {communityModules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[12.5px] text-[var(--muted)]">
                  Nothing from the community yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {communityModules.map((m) => (
                    <ModuleCard
                      key={m.id}
                      module={m}
                      isYours={false}
                      onOpen={() => onOpenModule(m.id)}
                    />
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

export function LearningTab({ data }) {
  const { user, userProfile } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Navigation: 'hub' | 'module' | 'lesson'
  const [view, setView] = useState("hub");
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeLessonIsParent, setActiveLessonIsParent] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const rows = await fetchAllModules();
      setModules(rows);
    } catch (err) {
      setErrorMessage(err.message || "Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uid = user?.uid;
  const creatorName =
    userProfile?.fullName || user?.displayName || user?.email || "Parent";
  const childList = useMemo(() => data?.children || [], [data?.children]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return modules.filter((m) => {
      if (categoryFilter && m.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        (m.title || "").toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q) ||
        (m.createdByName || "").toLowerCase().includes(q) ||
        (m.category || "").toLowerCase().includes(q)
      );
    });
  }, [modules, searchQuery, categoryFilter]);

  const yourModules = useMemo(
    () => filtered.filter((m) => uid && m.createdBy === uid),
    [filtered, uid],
  );
  const communityModules = useMemo(
    () => filtered.filter((m) => !uid || m.createdBy !== uid),
    [filtered, uid],
  );

  const hasActiveFilters = !!searchQuery || !!categoryFilter;
  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter(null);
  }

  function openModule(moduleId) {
    setActiveModuleId(moduleId);
    setView("module");
  }
  function backToHub() {
    setActiveModuleId(null);
    setActiveLesson(null);
    setView("hub");
  }
  function backToModule() {
    setActiveLesson(null);
    setView("module");
  }
  function openLesson(lesson, isParentModule) {
    setActiveLesson(lesson);
    setActiveLessonIsParent(isParentModule);
    setView("lesson");
  }

  return (
    <>
      {view === "hub" && (
        <HubContent
          loading={loading}
          errorMessage={errorMessage}
          modules={modules}
          filtered={filtered}
          yourModules={yourModules}
          communityModules={communityModules}
          hasActiveFilters={hasActiveFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          clearFilters={clearFilters}
          onOpenModule={openModule}
          onCreate={() => setCreateOpen(true)}
          onRefresh={refresh}
          uid={uid}
        />
      )}

      {view === "module" && activeModuleId && (
        <ModuleDetailView
          moduleId={activeModuleId}
          childList={childList}
          parentId={uid}
          onBack={backToHub}
          onAssigned={refresh}
          onOpenLesson={openLesson}
        />
      )}

      {view === "lesson" && activeLesson && (
        <LessonDetailView
          lesson={activeLesson}
          canTakeQuiz={activeLessonIsParent}
          onBack={backToModule}
          onStartQuiz={() => setQuizOpen(true)}
        />
      )}

      <CreateModuleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        childList={childList}
        creatorId={uid}
        creatorName={creatorName}
        onCreated={refresh}
      />

      <LessonQuizModal
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        lesson={activeLesson}
      />
    </>
  );
}
