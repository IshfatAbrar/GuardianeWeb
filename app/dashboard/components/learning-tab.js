"use client";

import { useState } from "react";
import { CreateModuleModal } from "./create-module-modal";

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

export function LearningTab() {
  const [createOpen, setCreateOpen] = useState(false);

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
            onClick={() => setCreateOpen(true)}
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

      <CreateModuleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
