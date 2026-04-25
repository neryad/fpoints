import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme as nwColorScheme } from "nativewind";
import { theme } from "./index";
import type { Colors } from "./colors";
import {
  light as dsLight,
  dark as dsDark,
  type ColorScheme as DSColorScheme,
} from "../../../design-system-rn/tokens/colors";

// ─── helpers ────────────────────────────────────────────────────────────────

/** "H S% L%" → "hsl(H, S%, L%)" — both formats are valid in React Native */
const h = (token: string) => {
  const [hue, sat, lum] = token.split(" ");
  return `hsl(${hue}, ${sat}, ${lum})`;
};

/** Semi-transparent version of an HSL token */
const ha = (token: string, alpha: number) => {
  const [hue, sat, lum] = token.split(" ");
  return `hsla(${hue}, ${sat}, ${lum}, ${alpha})`;
};

// ─── token → old Colors mapping ─────────────────────────────────────────────

function buildColors(t: DSColorScheme, isDark: boolean): Colors {
  return {
    background: h(t.background),
    backgroundElevated: h(t.surfaceElevated),
    surface: isDark ? h(t.surfaceElevated) : h(t.card),
    surfaceMuted: h(t.muted),
    border: h(t.border),
    divider: h(t.border),

    text: h(t.foreground),
    textStrong: h(t.foreground),
    textPrimary: h(t.foreground),
    textSecondary: h(t.mutedForeground),
    textInverse: h(t.primaryForeground),
    inverseText: h(t.primaryForeground),
    muted: h(t.mutedForeground),

    primary: h(t.primary),
    primaryHover: isDark ? ha(t.primary, 0.85) : ha(t.primary, 0.9),
    primarySoft: ha(t.primary, isDark ? 0.18 : 0.12),
    primaryText: h(t.primaryForeground),

    success: h(t.success),
    successSoft: ha(t.success, isDark ? 0.18 : 0.12),
    warning: h(t.warning),
    warningSoft: ha(t.warning, isDark ? 0.18 : 0.12),
    error: h(t.destructive),
    errorSoft: ha(t.destructive, isDark ? 0.18 : 0.12),

    // No direct DS equivalent — keep indigo palette values
    info: isDark ? "hsl(210, 90%, 56%)" : "hsl(221, 68%, 52%)",
    infoSoft: isDark
      ? "hsla(221, 68%, 52%, 0.18)"
      : "hsla(221, 68%, 52%, 0.12)",

    xp: h(t.xp),
    xpSoft: ha(t.xp, isDark ? 0.18 : 0.12),
    streak: h(t.streak),
    streakSoft: ha(t.streak, isDark ? 0.18 : 0.12),
    points: h(t.points),
    pointsSoft: ha(t.points, isDark ? 0.18 : 0.12),
    reward: h(t.points),
    rewardSoft: ha(t.points, isDark ? 0.18 : 0.12),

    overlay: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.4)",
    scrim: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.6)",
  };
}

// ─── types ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "@fpoints/theme_override";
type ThemeOverride = "light" | "dark" | null;

/** DS-native mode: includes "system" */
export type ThemeMode = "light" | "dark" | "system";

export type Screen = {
  width: number;
  height: number;
  isCompact: boolean;
  isWide: boolean;
};

type LegacyTheme = typeof theme;

type ThemeContextValue = Omit<LegacyTheme, "colors"> & {
  colors: Colors;
  // ─ legacy ─
  screen: Screen;
  isDark: boolean;
  themeOverride: ThemeOverride;
  setThemeOverride: (override: ThemeOverride) => void;
  // ─ new DS ─
  scheme: "light" | "dark";
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  /** Raw HSL token map for the active scheme */
  tokens: DSColorScheme;
};

const DEFAULT_SCREEN: Screen = {
  width: 390,
  height: 844,
  isCompact: false,
  isWide: false,
};

const ThemeContext = createContext<ThemeContextValue>({
  ...theme,
  screen: DEFAULT_SCREEN,
  isDark: false,
  themeOverride: null,
  setThemeOverride: () => {},
  scheme: "light",
  mode: "system",
  setMode: () => {},
  toggle: () => {},
  tokens: dsLight,
});

export const useTheme = () => useContext(ThemeContext);

// ─── provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemScheme, setSystemScheme] = useState(
    Appearance.getColorScheme() ?? "light"
  );

  // Restore saved override on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === "light" || val === "dark" || val === "system") {
        setModeState(val as ThemeMode);
      }
    });
  }, []);

  // Listen for OS scheme changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? "light");
    });
    return () => sub.remove();
  }, []);

  const scheme: "light" | "dark" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const isDark = scheme === "dark";

  // Sync NativeWind so dark: variants work everywhere
  useEffect(() => {
    try {
      nwColorScheme.set(scheme);
    } catch {
      // safe in non-RN contexts
    }
  }, [scheme]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m);
  }, []);

  // Legacy compat: themeOverride maps null/"system" → null, "light"/"dark" → value
  const setThemeOverride = useCallback(
    (val: ThemeOverride) => {
      setMode(val === null ? "system" : val);
    },
    [setMode]
  );

  const toggle = useCallback(() => {
    setMode(isDark ? "light" : "dark");
  }, [isDark, setMode]);

  const screen = useMemo<Screen>(
    () => ({
      width,
      height,
      isCompact: width < 360,
      isWide: width >= 428,
    }),
    [width, height]
  );

  const dsTokens = isDark ? dsDark : dsLight;
  const mappedColors = useMemo(
    () => buildColors(dsTokens, isDark),
    [dsTokens, isDark]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...theme,
      colors: mappedColors,
      screen,
      isDark,
      themeOverride: mode === "system" ? null : mode,
      setThemeOverride,
      scheme,
      mode,
      setMode,
      toggle,
      tokens: dsTokens,
    }),
    [
      mappedColors,
      screen,
      isDark,
      mode,
      setThemeOverride,
      scheme,
      setMode,
      toggle,
      dsTokens,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
