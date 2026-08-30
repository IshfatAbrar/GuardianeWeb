// Tiny `@AppStorage`-style hook backed by localStorage. Used by Settings
// for preferences that don't (yet) have a backend (notifications, language,
// biometric, app blocking). Survives reloads; syncs across tabs via the
// "storage" event.

"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVT = "preferencechange";

function subscribe(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(EVT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVT, callback);
  };
}

function makeSnapshot(key, defaultValue) {
  return () => {
    if (typeof window === "undefined") return defaultValue;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  };
}

export function usePreference(key, defaultValue) {
  const value = useSyncExternalStore(
    subscribe,
    makeSnapshot(key, defaultValue),
    () => defaultValue,
  );

  const setValue = useCallback(
    (next) => {
      if (typeof window === "undefined") return;
      const resolved = typeof next === "function" ? next(value) : next;
      window.localStorage.setItem(key, JSON.stringify(resolved));
      window.dispatchEvent(new Event(EVT));
    },
    [key, value],
  );

  return [value, setValue];
}

// Dark mode hook bridges to the same storage the existing ThemeToggle uses,
// so toggling Settings keeps the rest of the app in sync.
export function useDarkMode() {
  const subscribeTheme = (cb) => {
    if (typeof window === "undefined") return () => {};
    window.addEventListener("storage", cb);
    window.addEventListener("themechange", cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener("themechange", cb);
    };
  };
  const getThemeSnapshot = () => {
    if (typeof window === "undefined") return false;
    const fromAttr = document.documentElement.getAttribute("data-theme");
    if (fromAttr) return fromAttr === "dark";
    const stored = window.localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const isDark = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    () => false,
  );

  const setDark = useCallback(
    (next) => {
      if (typeof window === "undefined") return;
      const resolved = typeof next === "function" ? next(isDark) : next;
      const theme = resolved ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      window.localStorage.setItem("theme", theme);
      window.dispatchEvent(new Event("themechange"));
    },
    [isDark],
  );

  return [isDark, setDark];
}
