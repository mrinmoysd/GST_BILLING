"use client";

import * as React from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "gst_billing.theme";
const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  mounted: boolean;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function getResolvedTheme(theme: ThemeMode): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  if (theme === "system") {
    return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
  }
  return theme;
}

function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === "undefined") return "light" as ResolvedTheme;
  const resolved = getResolvedTheme(theme);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null)
        : null;
    const initial = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setThemeState(initial);
    setResolvedTheme(applyThemeToDocument(initial));
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    setResolvedTheme(applyThemeToDocument(theme));

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    if (theme !== "system" || typeof window === "undefined") return;

    const media = window.matchMedia(THEME_MEDIA_QUERY);
    const onChange = () => setResolvedTheme(applyThemeToDocument("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mounted, theme]);

  const setTheme = React.useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
  }, []);

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      mounted,
      setTheme,
    }),
    [mounted, resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
