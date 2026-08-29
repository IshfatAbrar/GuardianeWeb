import { Image as ImageIcon } from "lucide-react";

function ScreenPlaceholder({ label, compact }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-[var(--border)] text-[var(--muted)]">
      <ImageIcon
        className={compact ? "h-5 w-5" : "h-8 w-8"}
        strokeWidth={1.5}
      />
      <span className={compact ? "text-[0.6rem]" : "text-[0.8rem]"}>
        {label}
      </span>
    </div>
  );
}

export function GuardianeDeviceMockup({ laptopSrc, phoneSrc }) {
  return (
    <div className="relative mx-auto w-full max-w-[100%]">
      {/* laptop */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-elevated)] sm:p-4">
        <div className="flex items-center gap-1.5 px-1.5 pb-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
        </div>

        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-[var(--surface-muted)]">
          {laptopSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={laptopSrc}
              alt="Guardiané dashboard showing a real-time risk alert"
              className="h-full w-full object-cover"
            />
          ) : (
            <ScreenPlaceholder label="Laptop screen — red alert" />
          )}
        </div>
      </div>

      {/* phone — sits on the left, bottom-aligned with the laptop */}
      <div className="absolute -left-12 bottom-0 z-10 w-32 rounded-[1.7rem] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-elevated)] sm:-left-12 sm:w-44">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[1.3rem] bg-[var(--surface-muted)]">
          {phoneSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={phoneSrc}
              alt="Guardiané messaging view on a child's phone"
              className="h-full w-full object-cover"
            />
          ) : (
            <ScreenPlaceholder label="Phone screen — messages" compact />
          )}
        </div>
      </div>
    </div>
  );
}
