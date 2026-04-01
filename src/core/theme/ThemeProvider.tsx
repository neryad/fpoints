import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "./index";
import { darkColors } from "./colors";

const STORAGE_KEY = "@fpoints/theme_override";
type ThemeOverride = "light" | "dark" | null;

type Theme = typeof theme;
type ThemeContextValue = Theme & {
  isDark: boolean;
  themeOverride: ThemeOverride;
  setThemeOverride: (override: ThemeOverride) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  ...theme,
  isDark: false,
  themeOverride: null,
  setThemeOverride: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<ThemeOverride>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === "light" || val === "dark") setOverride(val);
      setLoaded(true);
    });
  }, []);

  const activeScheme = override ?? systemScheme;
  const isDark = activeScheme === "dark";
  const activeTheme: Theme = isDark ? { ...theme, colors: darkColors } : theme;

  const setThemeOverride = (val: ThemeOverride) => {
    setOverride(val);
    if (val === null) {
      AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      AsyncStorage.setItem(STORAGE_KEY, val);
    }
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider
      value={{ ...activeTheme, isDark, themeOverride: override, setThemeOverride }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
