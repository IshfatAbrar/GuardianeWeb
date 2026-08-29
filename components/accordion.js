"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export function Accordion({ items, defaultOpen = 0 }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);

  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.title} className="clarity-card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              className="focus-visible-ring flex w-full items-center justify-between gap-4 p-6 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-base font-medium text-[var(--foreground)]">
                {item.title}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--foreground)]">
                {isOpen ? (
                  <X className="h-4 w-4" aria-hidden />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden />
                )}
              </span>
            </button>
            {isOpen && (
              <div className="px-6 pb-6 text-sm leading-relaxed text-[var(--muted)]">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
