"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { usePreference, useDarkMode } from "../../lib/preferences";
import { ChildFormModal } from "./child-form-modal";
import { EditNameModal } from "./edit-name-modal";
import { DeleteAccountModal } from "./delete-account-modal";
import { SupportModal } from "./support-modal";
import { AppBlockManagerModal } from "./app-block-manager-modal";

const APP_VERSION = "1.0.0 (web)";

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

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked
          ? "bg-emerald-500"
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

function ActionButton({ children = "Edit", onClick, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        danger
          ? "border-rose-500/40 text-rose-500 hover:bg-rose-500/10"
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

function HeroProfile({ name, email, onEditName }) {
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
      <ActionButton onClick={onEditName}>Edit name</ActionButton>
    </div>
  );
}

function ChildAvatar({ child, size = 36 }) {
  const palette = colorForName(child.name);
  const initial = (child.name?.[0] || "?").toUpperCase();
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
  { id: "children", label: "Children" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy & Security" },
  { id: "support", label: "Support" },
  { id: "about", label: "About" },
];

export function SettingsTab({ data }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const user = data?.user || null;
  const profile = data?.userProfile || null;
  const children = data?.children || [];
  const familyId = profile?.familyId || null;

  const accountName =
    profile?.fullName || user?.displayName || user?.email?.split("@")[0] || "";
  const accountEmail = user?.email || "";

  const [section, setSection] = useState("general");

  // Preferences (localStorage-backed, matches iOS @AppStorage)
  const [language, setLanguage] = usePreference("pref.language", "en");
  const [notificationsEnabled, setNotificationsEnabled] = usePreference(
    "pref.notificationsEnabled",
    true,
  );
  const [biometricEnabled, setBiometricEnabled] = usePreference(
    "pref.biometricEnabled",
    false,
  );
  const [darkMode, setDarkMode] = useDarkMode();

  // Total apps blocked across all children — drives the App blocking summary.
  const totalBlockedApps = children.reduce(
    (sum, c) => sum + (Array.isArray(c.blockedApps) ? c.blockedApps.length : 0),
    0,
  );

  // Modals
  const [editName, setEditName] = useState(false);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [editChild, setEditChild] = useState(null);
  const [supportMode, setSupportMode] = useState(null); // "help" | "contact" | null
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [appBlockOpen, setAppBlockOpen] = useState(false);

  async function handleLogout() {
    try {
      await signOut();
    } catch (_) {
      // Silent — even if signOut throws (rare), still navigate away.
    }
    router.push("/login");
  }

  function handleExport() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            profile: profile ? { ...profile } : null,
            children: children.map((c) => ({ ...c })),
          },
          (_key, value) => {
            // Convert Firestore Timestamps for readability.
            if (value && typeof value.toDate === "function") {
              try {
                return value.toDate().toISOString();
              } catch {
                return null;
              }
            }
            return value;
          },
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guardiane-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderPanel() {
    switch (section) {
      case "general":
        return (
          <>
            <HeroProfile
              name={accountName}
              email={accountEmail}
              onEditName={() => setEditName(true)}
            />
            <FieldRow
              label="Dark mode"
              value="Use a dark color scheme"
              trailing={<Toggle checked={darkMode} onChange={setDarkMode} />}
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
                    { value: "es", label: "Spanish" },
                    { value: "hi", label: "Hindi" },
                  ]}
                />
              }
              isLast
            />
          </>
        );

      case "children":
        return (
          <>
            {children.length === 0 ? (
              <FieldRow
                label="No children added"
                value="Add your first child to start monitoring"
                trailing={
                  <ActionButton
                    onClick={() => setAddChildOpen(true)}
                    disabled={!familyId}
                  >
                    Add
                  </ActionButton>
                }
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
                        {c.grade ||
                          (typeof c.age === "number" ? `Age ${c.age}` : "—")}
                      </p>
                    </div>
                  </div>
                  <ActionButton onClick={() => setEditChild(c)}>
                    Manage
                  </ActionButton>
                </div>
              ))
            )}
            <div className="border-t border-[var(--border)] px-5 py-3">
              <button
                type="button"
                onClick={() => setAddChildOpen(true)}
                disabled={!familyId}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                Add child
              </button>
            </div>
          </>
        );

      case "notifications":
        return (
          <FieldRow
            label="Enable notifications"
            value="Get activity updates and safety alerts on this device"
            trailing={
              <Toggle
                checked={notificationsEnabled}
                onChange={setNotificationsEnabled}
              />
            }
            isLast
          />
        );

      case "privacy":
        return (
          <>
            <FieldRow
              label="Biometric unlock"
              value="Use Touch ID / Windows Hello where supported"
              trailing={
                <Toggle
                  checked={biometricEnabled}
                  onChange={setBiometricEnabled}
                />
              }
            />
            <FieldRow
              label="App blocking"
              value={
                totalBlockedApps > 0
                  ? `${totalBlockedApps} app${totalBlockedApps === 1 ? "" : "s"} blocked across your children`
                  : "Block distracting apps on your children's devices"
              }
              trailing={
                <ActionButton
                  onClick={() => setAppBlockOpen(true)}
                  disabled={children.length === 0}
                >
                  Manage
                </ActionButton>
              }
            />
            <FieldRow
              label="Export my data"
              value="Download a JSON copy of your family's data"
              trailing={<ActionButton onClick={handleExport}>Export</ActionButton>}
            />
            <FieldRow
              label="Delete account"
              value="Permanently remove your account and data"
              trailing={
                <ActionButton danger onClick={() => setDeleteOpen(true)}>
                  Delete
                </ActionButton>
              }
              isLast
            />
          </>
        );

      case "support":
        return (
          <>
            <FieldRow
              label="Help Center"
              value="Browse guides and FAQs"
              trailing={
                <ActionButton onClick={() => setSupportMode("help")}>
                  Open
                </ActionButton>
              }
            />
            <FieldRow
              label="Contact Support"
              value="Reach our team by email"
              trailing={
                <ActionButton onClick={() => setSupportMode("contact")}>
                  Contact
                </ActionButton>
              }
              isLast
            />
          </>
        );

      case "about":
        return (
          <>
            <FieldRow
              label="App version"
              value="Guardiané for Web"
              trailing={
                <span className="inline-flex items-center rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--muted)]">
                  v{APP_VERSION}
                </span>
              }
            />
            <FieldRow
              label="Log out"
              value="Sign out of this device"
              trailing={
                <ActionButton danger onClick={handleLogout}>
                  Log out
                </ActionButton>
              }
              isLast
            />
          </>
        );

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

      <EditNameModal
        open={editName}
        onClose={() => setEditName(false)}
        currentName={accountName}
        uid={user?.uid}
        onSaved={() => {
          // AuthContext listenToDoc will re-fire when users/{uid} updates,
          // so no explicit refresh needed.
        }}
      />

      <ChildFormModal
        open={addChildOpen}
        onClose={() => setAddChildOpen(false)}
        parentUid={user?.uid}
        familyId={familyId}
        onSaved={() => {
          // useDashboardData re-fetches children on next render of the tab,
          // but it's also fine to leave stale — listener will reconcile.
        }}
      />

      <ChildFormModal
        open={!!editChild}
        onClose={() => setEditChild(null)}
        child={editChild}
        parentUid={user?.uid}
        familyId={familyId}
        onSaved={() => setEditChild(null)}
      />

      <SupportModal
        open={!!supportMode}
        mode={supportMode || "help"}
        onClose={() => setSupportMode(null)}
      />

      <DeleteAccountModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        uid={user?.uid}
        familyId={familyId}
        children={children}
        onDeleted={() => router.push("/login")}
      />

      <AppBlockManagerModal
        open={appBlockOpen}
        onClose={() => setAppBlockOpen(false)}
        childList={children}
      />
    </div>
  );
}
