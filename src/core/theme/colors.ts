// Base palette. Use semantic colors from `colors` in UI.
export const palette = {
  primary: {
    100: "#EAE8FB",
    200: "#C5BFF4",
    300: "#9B8CF2",
    400: "#7C6EE0",
    500: "#6E5DCD",
    600: "#5746B5",
  },

  neutral: {
    50: "#FBFAFC",
    100: "#F5F3F7",
    200: "#DED9E0",
    300: "#C7C3CC",
    400: "#8A8791",
    500: "#2B2A31",
    600: "#1F1E24",
  },

  success: {
    100: "#E6F7EF",
    200: "#B7EAD1",
    300: "#7ED9A8",
    400: "#4CCB86",
    500: "#26B765",
    600: "#1B8E4E",
  },

  warning: {
    100: "#FFF3E6",
    200: "#FFD1A8",
    300: "#F5A25C",
    400: "#F0872F",
    500: "#E5730A",
    600: "#B85C08",
  },

  error: {
    100: "#FDECEC",
    200: "#F5B5B2",
    300: "#E5736D",
    400: "#D94A42",
    500: "#B3261E",
    600: "#8F1E18",
  },

  reward: {
    100: "#FEF9C3",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
  },

  info: {
    100: "#EAF2FF",
    200: "#C9DEFF",
    300: "#99C1FF",
    400: "#5D98FA",
    500: "#2F76E8",
    600: "#1F57B2",
  },
} as const;

export const colors = {
  // Core surfaces
  background: palette.neutral[100],
  backgroundElevated: palette.neutral[50],
  surface: "#FFFFFF",
  surfaceMuted: palette.neutral[100],
  border: palette.neutral[200],
  divider: palette.neutral[300],

  // Content
  text: palette.neutral[500],
  textStrong: palette.neutral[600],
  muted: palette.neutral[400],
  inverseText: "#FFFFFF",
  textPrimary: palette.neutral[600],
  textSecondary: palette.neutral[400],
  textInverse: "#FFFFFF",

  // Brand
  primary: palette.primary[500],
  primaryHover: palette.primary[600],
  primarySoft: palette.primary[100],
  primaryText: "#FFFFFF",

  // Status
  success: palette.success[500],
  successSoft: palette.success[100],
  warning: palette.warning[500],
  warningSoft: palette.warning[100],
  error: palette.error[500],
  errorSoft: palette.error[100],
  info: palette.info[500],
  infoSoft: palette.info[100],

  // Domain
  reward: palette.reward[500],
  rewardSoft: palette.reward[100],

  // Overlays
  overlay: "rgba(31, 30, 36, 0.5)",
  scrim: "rgba(43, 42, 49, 0.72)",
} as const;

export type Colors = typeof colors;

export const darkColors: Colors = {
  // Core surfaces
  background: "#0F0E13",
  backgroundElevated: "#1A1921",
  surface: "#1F1E26",
  surfaceMuted: "#17161D",
  border: "#2E2C38",
  divider: "#3A3845",

  // Content
  text: palette.neutral[200],
  textStrong: palette.neutral[50],
  muted: palette.neutral[400],
  inverseText: palette.neutral[600],
  textPrimary: palette.neutral[50],
  textSecondary: palette.neutral[400],
  textInverse: palette.neutral[600],

  // Brand
  primary: palette.primary[400],
  primaryHover: palette.primary[300],
  primarySoft: "rgba(110, 93, 205, 0.18)",
  primaryText: "#FFFFFF",

  // Status
  success: palette.success[400],
  successSoft: "rgba(38, 183, 101, 0.15)",
  warning: palette.warning[400],
  warningSoft: "rgba(229, 115, 10, 0.15)",
  error: palette.error[400],
  errorSoft: "rgba(179, 38, 30, 0.15)",
  info: palette.info[400],
  infoSoft: "rgba(47, 118, 232, 0.15)",

  // Domain
  reward: palette.reward[400],
  rewardSoft: "rgba(245, 158, 11, 0.15)",

  // Overlays
  overlay: "rgba(0, 0, 0, 0.6)",
  scrim: "rgba(0, 0, 0, 0.8)",
};
