"use client";

import * as React from "react";
import { useTheme, ColorTheme, ModeTheme } from "@/components/theme-provider";
import { Sun, Moon, CheckCircle2 } from "lucide-react";

const palettes: { label: string; value: ColorTheme; color: string }[] = [
  { label: "Shamrock", value: "shamrock", color: "#2a7d3b" },
  { label: "Ocean",    value: "ocean",    color: "#1d61c5" },
  { label: "Violet",   value: "violet",   color: "#6d28d9" },
  { label: "Sunset",   value: "sunset",   color: "#d97706" },
  { label: "Rose",     value: "rose",     color: "#e11d48" },
  { label: "Slate",    value: "slate",    color: "#475569" },
];

/**
 * Full-palette + light/dark mode switcher panel.
 * Renders as an inline panel suitable for use inside settings pages,
 * dropdown menus, or floating panels in the dashboard.
 */
export function ThemeSwitcher() {
  const { colorTheme, modeTheme, setColorTheme, setModeTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4 p-4 min-w-[220px]">
      {/* Light / Dark Toggle */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Appearance
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(["light", "dark"] as ModeTheme[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setModeTheme(mode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-150 ${
                modeTheme === mode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {mode === "light" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="capitalize">{mode}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette Selector */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Color Theme
        </p>
        <div className="grid grid-cols-3 gap-2">
          {palettes.map((palette) => (
            <button
              key={palette.value}
              onClick={() => setColorTheme(palette.value)}
              title={palette.label}
              className={`relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all duration-150 hover:scale-105 ${
                colorTheme === palette.value
                  ? "border-foreground ring-2 ring-primary/30"
                  : "border-border"
              }`}
            >
              <span
                className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm"
                style={{ backgroundColor: palette.color }}
              >
                {colorTheme === palette.value && (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                )}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground leading-none">
                {palette.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact header icon button that opens the theme switcher panel.
 * Usage: wrap with Popover or DropdownMenu for flyout panel.
 */
export function ThemeSwitcherTrigger() {
  const { modeTheme, setModeTheme } = useTheme();

  return (
    <button
      onClick={() => setModeTheme(modeTheme === "light" ? "dark" : "light")}
      className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
      aria-label="Toggle theme"
    >
      {modeTheme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}
