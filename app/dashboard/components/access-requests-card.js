"use client";

// Pending "can I use my apps?" requests from the children's devices — see
// app/lib/accessRequests.js. Approving grants extra Screen Time for today,
// applied by the child's device as soon as it sees the answer. Renders nothing
// when there's nothing waiting, so it never clutters the overview.

import { useState } from "react";
import { TitleIcon } from "../../../components/title-icon";
import {
  approveAccessRequest,
  denyAccessRequest,
  GRANT_MINUTE_OPTIONS,
} from "../../lib/accessRequests";
import { useToast } from "../../lib/useToast";

function childFirstName(request, childList) {
  const name = childList?.find((c) => c.id === request.childId)?.name;
  return name?.split(" ")[0] || "Your child";
}

function RequestRow({ request, childList }) {
  const { showToast } = useToast();
  const [minutes, setMinutes] = useState(GRANT_MINUTE_OPTIONS[0]);
  const [busy, setBusy] = useState(false);
  const child = childFirstName(request, childList);

  const respond = async (approve) => {
    setBusy(true);
    try {
      if (approve) {
        await approveAccessRequest(request.id, minutes);
        showToast(`Gave ${child} ${minutes} extra minutes`);
      } else {
        await denyAccessRequest(request.id);
        showToast(`Declined ${child}'s request`);
      }
    } catch (err) {
      showToast(err?.message || "Couldn't answer the request", "error");
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[var(--foreground)]">
          {child} wants extra app time
        </p>
        <p className="truncate text-[11.5px] text-[var(--muted)]">
          {request.moduleTitle
            ? `To finish “${request.moduleTitle}”`
            : "To finish a learning module"}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <select
          aria-label="Extra minutes"
          value={minutes}
          disabled={busy}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[12px] text-[var(--foreground)]"
        >
          {GRANT_MINUTE_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => respond(true)}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => respond(false)}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--foreground)] disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </li>
  );
}

export function AccessRequestsCard({ requests = [], childList = [] }) {
  if (requests.length === 0) return null;
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <TitleIcon>
          <svg
            width="18"
            height="18"
            fill="var(--accent)"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6 0 1.2.6 1.2 1.3v3.5c0 .6-.6 1.2-1.3 1.2H9.2c-.6 0-1.2-.6-1.2-1.3v-3.5c0-.6.6-1.2 1.2-1.2V9.5C9.2 8.1 10.6 7 12 7zm0 1.2c-.8 0-1.5.5-1.5 1.3V11h3V9.5c0-.8-.7-1.3-1.5-1.3z" />
          </svg>
        </TitleIcon>
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">
          Requests
        </h2>
        <span className="rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
          {requests.length}
        </span>
      </div>
      <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {requests.map((r) => (
          <RequestRow key={r.id} request={r} childList={childList} />
        ))}
      </ul>
    </div>
  );
}
