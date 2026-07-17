"use client";

import {create} from "zustand";

export type Theme = "dark" | "light";

/** Read the theme the no-flash script already applied to <html>. Dark is the default. */
function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function apply(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // localStorage can be unavailable (private mode). The in memory choice still applies.
  }
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  /** Sync the store to whatever the pre-hydration script set on <html>. */
  sync: () => void;
}

/**
 * Theme store. The palette itself flips via CSS variables keyed on data-theme, so this only
 * has to track the current choice, persist it, and let any control (top bar, settings) stay
 * in sync. There is no wallet or account here; the preference is purely local.
 */
export const useTheme = create<ThemeState>((set, get) => ({
  theme: "dark",
  setTheme: (theme) => {
    apply(theme);
    set({theme});
  },
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    apply(next);
    set({theme: next});
  },
  sync: () => set({theme: currentTheme()}),
}));
