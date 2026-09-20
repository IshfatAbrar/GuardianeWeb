// The tinted rounded box that holds the icon beside a card title on the
// dashboard home page. Children are the icon itself, which should use
// `var(--accent)` (or `currentColor`, which is already the accent here).
export function TitleIcon({ children }) {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent)]"
    >
      {children}
    </span>
  );
}
