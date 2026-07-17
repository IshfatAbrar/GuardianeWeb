"use client";

// The parent's crisis call list. These rows are read by the Android child app's
// EmergencyContactsModal, so anything marked "show on child's screen" is what a
// child can reach in a crisis — this is a real two-way integration, not a
// web-only list.

import { telHref } from "../../lib/emergencyContacts";

function ContactRow({ contact, onEdit, isLast }) {
  const href = telHref(contact.phone);
  return (
    <li
      className={`flex items-center justify-between gap-3 px-4 py-3 ${
        isLast ? "" : "border-b border-[var(--border)]"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
            {contact.name}
          </p>
          {contact.isEmergency && (
            <span
              title="Visible on your child's emergency screen"
              className="flex-shrink-0 rounded-full bg-[var(--danger)]/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[var(--danger)]"
            >
              On child&apos;s phone
            </span>
          )}
        </div>
        <p className="truncate text-[11.5px] text-[var(--muted)]">
          {[contact.relationship, contact.phone].filter(Boolean).join(" · ")}
        </p>
        {contact.notes && (
          <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{contact.notes}</p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {href && (
          <a
            href={href}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--accent)] transition-colors hover:bg-[var(--surface-muted)]"
            aria-label={`Call ${contact.name}`}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>
        )}
        <button
          type="button"
          onClick={() => onEdit(contact)}
          className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
        >
          Edit
        </button>
      </div>
    </li>
  );
}

export function EmergencyContactsCard({ contacts, loading, onAdd, onEdit }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--foreground)]">
            Emergency contacts
          </h2>
          <p className="text-[11.5px] text-[var(--muted)]">
            Your child can call these from their app
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex-shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          Add
        </button>
      </div>

      {loading ? (
        <p className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">Loading…</p>
      ) : contacts.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-[13px] text-[var(--muted)]">No emergency contacts yet.</p>
          <p className="mt-1 text-[11.5px] text-[var(--muted)]">
            Add one so your child has someone to reach in a crisis.
          </p>
        </div>
      ) : (
        <ul>
          {contacts.map((c, i) => (
            <ContactRow
              key={c.id}
              contact={c}
              onEdit={onEdit}
              isLast={i === contacts.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
