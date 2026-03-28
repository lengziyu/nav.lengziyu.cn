"use client";

import { Moon, SunMedium } from "lucide-react";
import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "nav-theme";
const THEME_EVENT = "nav-theme-change";

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getThemeSnapshot(): ThemeMode {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(nextTheme: ThemeMode) {
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  window.localStorage.setItem(STORAGE_KEY, nextTheme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => "light");

  function onToggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
      onClick={onToggleTheme}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === "dark" ? <SunMedium size={16} /> : <Moon size={16} />}
      </span>
      <span>{theme === "dark" ? "浅色" : "深色"}</span>
    </button>
  );
}
