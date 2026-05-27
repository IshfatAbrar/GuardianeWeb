"use client";

import { useState } from "react";

const DANGER = "#EF4444";

const AVATAR_PALETTE = [
  { fg: "#3B82F6", bg: "rgba(59, 130, 246, 0.18)" },
  { fg: "#A855F7", bg: "rgba(168, 85, 247, 0.18)" },
  { fg: "#EC4899", bg: "rgba(236, 72, 153, 0.18)" },
  { fg: "#10B981", bg: "rgba(16, 185, 129, 0.18)" },
];

function colorForName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function gradeFromAge(age) {
  if (typeof age !== "number") return null;
  const grade = age - 5;
  if (grade < 1) return "Pre-K";
  const suffix =
    grade === 1 ? "st" : grade === 2 ? "nd" : grade === 3 ? "rd" : "th";
  return `${grade}${suffix} Grade`;
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked
          ? "bg-[#10B981]"
          : "border border-[var(--border)] bg-[var(--surface-muted)]"
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

function EditButton({ children = "Edit", onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
        danger
          ? "border-[rgba(239,68,68,0.4)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)]"
          : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function FieldRow({ label, value, trailing, isLast }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-4 ${
        isLast ? "" : "border-b border-[var(--border)]"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[var(--foreground)]">
          {label}
        </p>
        {value && (
          <div className="mt-0.5 text-[13px] leading-relaxed text-[var(--muted)]">
            {value}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">{trailing}</div>
    </div>
  );
}

function NavItem({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left text-[13.5px] font-medium transition-colors ${
        active
          ? "bg-[var(--accent-bg)] text-[var(--accent)]"
          : "text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function SelectInline({ value, onChange, options, ariaLabel }) {
  return (
    <label className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-3 pr-8 text-[13px] font-medium text-[var(--foreground)] focus:border-[var(--accent-border)] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </label>
  );
}

function HeroProfile({ name, email }) {
  const palette = colorForName(name || email || "?");
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-5">
      <div className="flex items-center gap-4">
        <span
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-[24px] font-semibold"
          style={{ backgroundColor: palette.bg, color: palette.fg }}
        >
          {(name?.[0] || email?.[0] || "?").toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[var(--foreground)]">
            {name || "Account"}
          </p>
          {email && (
            <p className="truncate text-[13px] text-[var(--muted)]">{email}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Remove avatar"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[#EF4444] transition-colors hover:bg-[rgba(239,68,68,0.08)]"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
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
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            <polyline points="16 7 12 3 8 7" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload
        </button>
      </div>
    </div>
  );
}

function ChildAvatar({ child, size = 36 }) {
  const palette = colorForName(child.name);
  const initial = (child.initials?.[0] || child.name?.[0] || "?").toUpperCase();
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: palette.bg,
        color: palette.fg,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </span>
  );
}

const NAV_ITEMS = [
  { id: "general", label: "General" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy & Security" },
  { id: "children", label: "Children" },
  { id: "restrictions", label: "App Restrictions" },
  { id: "support", label: "Support" },
  { id: "about", label: "About" },
];

function GeneralPanel({ name, email, language, setLanguage }) {
  return (
    <>
      <HeroProfile name={name} email={email} />
      <FieldRow
        label="Name"
        value={name || "—"}
        trailing={<EditButton />}
      />
      <FieldRow
        label="Email"
        value={email || "—"}
        trailing={<EditButton />}
      />
      <FieldRow
        label="Language"
        value="App display language"
        trailing={
          <SelectInline
            value={language}
            onChange={setLanguage}
            ariaLabel="Language"
            options={[
              { value: "en", label: "English" },
              { value: "es", label: "Español" },
              { value: "fr", label: "Français" },
              { value: "vi", label: "Tiếng Việt" },
            ]}
          />
        }
        isLast
      />
    </>
  );
}

function NotificationsPanel({ pushOn, setPushOn, alerts, setAlerts, weekly, setWeekly }) {
  return (
    <>
      <FieldRow
        label="Push notifications"
        value="Receive activity updates on this device"
        trailing={<Toggle checked={pushOn} onChange={setPushOn} />}
      />
      <FieldRow
        label="Safety alerts"
        value="Get notified when something needs attention"
        trailing={<Toggle checked={alerts} onChange={setAlerts} />}
      />
      <FieldRow
        label="Weekly digest"
        value="Summary email every Monday"
        trailing={<Toggle checked={weekly} onChange={setWeekly} />}
        isLast
      />
    </>
  );
}

function PrivacyPanel({ faceId, setFaceId }) {
  return (
    <>
      <FieldRow
        label="Face ID"
        value="Use Face ID to unlock the app"
        trailing={<Toggle checked={faceId} onChange={setFaceId} />}
      />
      <FieldRow
        label="Export my data"
        value="Download a copy of your family's data"
        trailing={<EditButton>Export</EditButton>}
      />
      <FieldRow
        label="Delete account"
        value="Permanently remove your account and data"
        trailing={<EditButton danger>Delete</EditButton>}
        isLast
      />
    </>
  );
}

function ChildrenPanel({ children }) {
  return (
    <>
      {children.length === 0 ? (
        <FieldRow
          label="No children added"
          value="Add your first child to start monitoring"
          trailing={<EditButton>Add</EditButton>}
          isLast
        />
      ) : (
        children.map((c, i) => (
          <div
            key={c.id}
            className={`flex items-center justify-between gap-4 px-5 py-4 ${
              i === children.length - 1
                ? ""
                : "border-b border-[var(--border)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <ChildAvatar child={c} />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-[var(--foreground)]">
                  {c.name}
                </p>
                <p className="text-[12.5px] text-[var(--muted)]">
                  {gradeFromAge(c.age) || `Age ${c.age}`}
                </p>
              </div>
            </div>
            <EditButton>Manage</EditButton>
          </div>
        ))
      )}
      <div className="border-t border-[var(--border)] px-5 py-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
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
          Add child
        </button>
      </div>
    </>
  );
}

function RestrictionsPanel({ appBlocking, setAppBlocking }) {
  return (
    <>
      <FieldRow
        label="App blocking"
        value={appBlocking ? "Enabled" : "Disabled"}
        trailing={<Toggle checked={appBlocking} onChange={setAppBlocking} />}
      />
      <FieldRow
        label="Bedtime mode"
        value="Pause apps overnight"
        trailing={<EditButton>Configure</EditButton>}
      />
      <FieldRow
        label="Screen time limits"
        value="Daily caps per category"
        trailing={<EditButton>Configure</EditButton>}
        isLast
      />
    </>
  );
}

function SupportPanel() {
  return (
    <>
      <FieldRow
        label="Help Center"
        value="Browse guides and FAQs"
        trailing={<EditButton>Open</EditButton>}
      />
      <FieldRow
        label="Contact Support"
        value="Reach our team by email"
        trailing={<EditButton>Contact</EditButton>}
        isLast
      />
    </>
  );
}

function AboutPanel() {
  return (
    <>
      <FieldRow
        label="App version"
        value="Guardiane for Web"
        trailing={
          <span className="inline-flex items-center rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--muted)]">
            v1.2.3
          </span>
        }
      />
      <FieldRow
        label="Terms of Service"
        trailing={<EditButton>View</EditButton>}
      />
      <FieldRow
        label="Privacy Policy"
        trailing={<EditButton>View</EditButton>}
      />
      <FieldRow
        label="Log out"
        value="Sign out of this device"
        trailing={<EditButton danger>Log Out</EditButton>}
        isLast
      />
    </>
  );
}

export function SettingsTab({ data }) {
  const user = data?.user || null;
  const profile = data?.userProfile || null;
  const children = data?.children || [];

  const accountName =
    profile?.fullName || user?.displayName || user?.email?.split("@")[0] || "";
  const accountEmail = user?.email || "";

  const [section, setSection] = useState("general");
  const [language, setLanguage] = useState("en");
  const [pushOn, setPushOn] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [weekly, setWeekly] = useState(false);
  const [faceId, setFaceId] = useState(true);
  const [appBlocking, setAppBlocking] = useState(false);

  function renderPanel() {
    switch (section) {
      case "general":
        return (
          <GeneralPanel
            name={accountName}
            email={accountEmail}
            language={language}
            setLanguage={setLanguage}
          />
        );
      case "notifications":
        return (
          <NotificationsPanel
            pushOn={pushOn}
            setPushOn={setPushOn}
            alerts={alerts}
            setAlerts={setAlerts}
            weekly={weekly}
            setWeekly={setWeekly}
          />
        );
      case "privacy":
        return <PrivacyPanel faceId={faceId} setFaceId={setFaceId} />;
      case "children":
        return <ChildrenPanel children={children} />;
      case "restrictions":
        return (
          <RestrictionsPanel
            appBlocking={appBlocking}
            setAppBlocking={setAppBlocking}
          />
        );
      case "support":
        return <SupportPanel />;
      case "about":
        return <AboutPanel />;
      default:
        return null;
    }
  }

  return (
    <div>
      <div className="p-6">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
          Settings
        </h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Manage your account and preferences
        </p>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 lg:flex-row">
        {/* Left nav */}
        <nav className="flex flex-row gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              active={section === item.id}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </NavItem>
          ))}
        </nav>

        {/* Content panel */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}
