"use client";

import * as React from "react";

export type ColorTheme = "shamrock" | "ocean" | "violet" | "sunset" | "rose" | "slate";
export type ModeTheme = "light" | "dark";

interface ThemeContextType {
  colorTheme: ColorTheme;
  modeTheme: ModeTheme;
  setColorTheme: (color: ColorTheme) => void;
  setModeTheme: (mode: ModeTheme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = React.useState<ColorTheme>("shamrock");
  const [modeTheme, setModeThemeState] = React.useState<ModeTheme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Load from local storage
    const savedColor = localStorage.getItem("rf-color-theme") as ColorTheme;
    const savedMode = localStorage.getItem("rf-mode-theme") as ModeTheme;

    if (savedColor) setColorThemeState(savedColor);
    if (savedMode) setModeThemeState(savedMode);
    
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    // Remove existing themes
    root.classList.remove(
      "theme-shamrock",
      "theme-ocean",
      "theme-violet",
      "theme-sunset",
      "theme-rose",
      "theme-slate"
    );
    root.classList.add(`theme-${colorTheme}`);

    // Set dark/light mode
    if (modeTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("rf-color-theme", colorTheme);
    localStorage.setItem("rf-mode-theme", modeTheme);
  }, [colorTheme, modeTheme, mounted]);

  const setColorTheme = (color: ColorTheme) => setColorThemeState(color);
  const setModeTheme = (mode: ModeTheme) => setModeThemeState(mode);

  return (
    <ThemeContext.Provider value={{ colorTheme, modeTheme, setColorTheme, setModeTheme }}>
      <div className={mounted ? "" : "invisible"}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
