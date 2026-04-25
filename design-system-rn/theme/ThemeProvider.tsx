import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { colorScheme as nwColorScheme } from "nativewind";
import { colors, ColorScheme } from "../tokens/colors";

type Mode = "light" | "dark" | "system";

interface ThemeContextValue {
  /** Resolved scheme actually applied to the UI. */
  scheme: "light" | "dark";
  /** What the user picked (may be "system"). */
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggle: () => void;
  /** Raw HSL token map for the current scheme — useful in StyleSheet. */
  tokens: ColorScheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** Initial mode. Defaults to "system". */
  initialMode?: Mode;
  children: React.ReactNode;
}

export function ThemeProvider({
  initialMode = "system",
  children,
}: ThemeProviderProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const scheme: "light" | "dark" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  // Sync NativeWind so `dark:` variants work everywhere.
  useEffect(() => {
    try {
      nwColorScheme.set(scheme);
    } catch {
      // safe to ignore in non-RN contexts
    }
  }, [scheme]);

  const toggle = useCallback(() => {
    setMode((m) => (m === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      mode,
      setMode,
      toggle,
      tokens: colors[scheme],
    }),
    [scheme, mode, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>.");
  }
  return ctx;
}