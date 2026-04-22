/**
 * QuestHome Design Tokens — Colors
 * HSL strings ready for both NativeWind (CSS vars) and StyleSheet usage.
 *
 * Use `hsl(colors.light.primary)` if you go the StyleSheet route,
 * or rely on the CSS variables in theme/global.css if you use NativeWind v4.
 */

export type ColorToken =
  | "background"
  | "foreground"
  | "card"
  | "cardForeground"
  | "popover"
  | "popoverForeground"
  | "primary"
  | "primaryForeground"
  | "secondary"
  | "secondaryForeground"
  | "muted"
  | "mutedForeground"
  | "accent"
  | "accentForeground"
  | "destructive"
  | "destructiveForeground"
  | "border"
  | "input"
  | "ring"
  | "xp"
  | "xpForeground"
  | "streak"
  | "streakForeground"
  | "points"
  | "pointsForeground"
  | "success"
  | "successForeground"
  | "warning"
  | "warningForeground"
  | "surface"
  | "surfaceElevated";

export type ColorScheme = Record<ColorToken, string>;

/** Helper: turns "8 85% 60%" into "hsl(8, 85%, 60%)" */
export const hsl = (token: string) => `hsl(${token})`;
/** Helper for translucent variants: hsla(token / alpha 0..1) */
export const hsla = (token: string, alpha: number) => {
  const [h, s, l] = token.split(" ");
  return `hsla(${h}, ${s}, ${l}, ${alpha})`;
};

export const light: ColorScheme = {
  background: "36 33% 97%",
  foreground: "220 20% 14%",

  card: "0 0% 100%",
  cardForeground: "220 20% 14%",

  popover: "0 0% 100%",
  popoverForeground: "220 20% 14%",

  primary: "8 85% 60%",
  primaryForeground: "0 0% 100%",

  secondary: "36 30% 92%",
  secondaryForeground: "220 20% 14%",

  muted: "36 20% 94%",
  mutedForeground: "220 10% 50%",

  accent: "36 40% 90%",
  accentForeground: "220 20% 14%",

  destructive: "0 72% 51%",
  destructiveForeground: "0 0% 100%",

  border: "36 20% 88%",
  input: "36 20% 88%",
  ring: "8 85% 60%",

  xp: "210 90% 56%",
  xpForeground: "0 0% 100%",
  streak: "28 95% 55%",
  streakForeground: "0 0% 100%",
  points: "8 85% 60%",
  pointsForeground: "0 0% 100%",

  success: "152 60% 42%",
  successForeground: "0 0% 100%",
  warning: "40 96% 56%",
  warningForeground: "220 20% 14%",

  surface: "0 0% 100%",
  surfaceElevated: "0 0% 100%",
};

export const dark: ColorScheme = {
  background: "220 20% 8%",
  foreground: "36 20% 94%",

  card: "220 18% 12%",
  cardForeground: "36 20% 94%",

  popover: "220 18% 12%",
  popoverForeground: "36 20% 94%",

  primary: "8 85% 60%",
  primaryForeground: "0 0% 100%",

  secondary: "220 15% 18%",
  secondaryForeground: "36 20% 94%",

  muted: "220 15% 18%",
  mutedForeground: "220 10% 55%",

  accent: "220 15% 20%",
  accentForeground: "36 20% 94%",

  destructive: "0 62% 40%",
  destructiveForeground: "0 0% 100%",

  border: "220 15% 20%",
  input: "220 15% 20%",
  ring: "8 85% 60%",

  xp: "210 90% 56%",
  xpForeground: "0 0% 100%",
  streak: "28 95% 55%",
  streakForeground: "0 0% 100%",
  points: "8 85% 60%",
  pointsForeground: "0 0% 100%",

  success: "152 60% 42%",
  successForeground: "0 0% 100%",
  warning: "40 96% 56%",
  warningForeground: "220 20% 14%",

  surface: "220 18% 12%",
  surfaceElevated: "220 16% 16%",
};

export const colors = { light, dark };
export default colors;