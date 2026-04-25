import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "./index";
import { darkColors } from "./colors";

const STORAGE_KEY = "@fpoints/theme_override";
type ThemeOverride = "light" | "dark" | null;

export type Screen = {
  width: number;
  height: number;
  /** < 360 dp — teléfonos compactos (SE, Galaxy A) */
  isCompact: boolean;
  /** >= 428 dp — teléfonos grandes (Pro Max, Pixel 9 Pro) */
  isWide: boolean;
};

type Theme = typeof theme;
type ThemeContextValue = Theme & {
  screen: Screen;
  isDark: boolean;
  themeOverride: ThemeOverride;
  setThemeOverride: (override: ThemeOverride) => void;
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
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const [override, setOverride] = useState<ThemeOverride>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === "light" || val === "dark") setOverride(val);
    });
  }, []);

  const activeScheme = override ?? systemScheme;
  const isDark = activeScheme === "dark";

  const screen = useMemo<Screen>(
    () => ({
      width,
      height,
      isCompact: width < 360,
      isWide: width >= 428,
    }),
    [width, height],
  );

  const setThemeOverride = useCallback((val: ThemeOverride) => {
    setOverride(val);
    if (val === null) {
      AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      AsyncStorage.setItem(STORAGE_KEY, val);
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...theme,
      colors: isDark ? darkColors : theme.colors,
      screen,
      isDark,
      themeOverride: override,
      setThemeOverride,
    }),
    [isDark, screen, override, setThemeOverride],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
