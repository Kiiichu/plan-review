import { useEffect, useState } from "react";

export type ThemePref = "dark" | "light" | "system";
export type Spacing = "comfortable" | "compact";
export interface Settings {
  theme: ThemePref;
  spacing: Spacing;
}
const KEY = "darlyn.settings.v1";
const DEFAULTS: Settings = { theme: "dark", spacing: "comfortable" };

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved) setSettings({ ...DEFAULTS, ...saved });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [settings.theme]);

  const update = (patch: Partial<Settings>) =>
    setSettings((s) => {
      const next = { ...s, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });

  return { settings, update };
}
