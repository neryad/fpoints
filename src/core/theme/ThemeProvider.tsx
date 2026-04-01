import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { theme } from "./index";
import { darkColors } from "./colors";

type Theme = typeof theme;

const ThemeContext = createContext<Theme>(theme);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const activeTheme: Theme =
    scheme === "dark" ? { ...theme, colors: darkColors } : theme;

  return (
    <ThemeContext.Provider value={activeTheme}>{children}</ThemeContext.Provider>
  );
}
