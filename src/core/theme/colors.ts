// Base palette — "Warm Quest" design system
export const palette = {
  // Coral — primary brand
  coral: {
    100: "#FDE8E2",
    200: "#FAC4B2",
    300: "#F49D82",
    400: "#EE7658",
    500: "#E8583A", // hsl(8, 85%, 60%) — main primary
    600: "#C9402A",
  },

  // Warm sand — backgrounds & surfaces
  sand: {
    50:  "#FDFAF6",
    100: "#F7F3EE", // main background
    200: "#EDE6DC",
    300: "#DDD3C4",
    400: "#C8BAA6",
  },

  // Emerald green — success / tasks completed
  emerald: {
    100: "#D4F0E3",
    200: "#A3DDBF",
    300: "#65C495",
    400: "#36A86C",
    500: "#2F9E6B",
    600: "#217A4F",
  },

  // Indigo — links, info, active nav
  indigo: {
    100: "#E0E7FF",
    200: "#B5C4F8",
    300: "#8099F0",
    400: "#5578E8",
    500: "#3B5BDB",
    600: "#2A43B0",
  },

  // Gold — points
  gold: {
    100: "#FEF3C7",
    200: "#FDE58A",
    300: "#FBC824",
    400: "#F5A623",
    500: "#E5900A",
    600: "#B87108",
  },

  // Purple — XP & levels
  xp: {
    100: "#EDE9FA",
    200: "#C9BEF3",
    300: "#9E8AE8",
    400: "#7C65D8",
    500: "#6248C8",
    600: "#4C37A0",
  },

  // Orange fire — streaks
  fire: {
    100: "#FFE8D4",
    200: "#FFB87A",
    300: "#FF8C3A",
    400: "#F5700A",
    500: "#E06008",
    600: "#B84D06",
  },

  neutral: {
    50:  "#FFFFFF",
    100: "#F5F4F2",
    200: "#E5E1DC",
    300: "#C8C1B8",
    400: "#8A8480",
    500: "#3D3A36",
    600: "#1E1C1A",
  },

  success: {
    100: "#D4F0E3",
    500: "#2F9E6B",
    600: "#217A4F",
  },

  warning: {
    100: "#FFF3D4",
    500: "#F5A623",
    600: "#D97706",
  },

  error: {
    100: "#FDE8E2",
    500: "#D94A42",
    600: "#B3261E",
  },
} as const;

export const colors = {
  // Core surfaces
  background:        palette.sand[100],
  backgroundElevated: palette.sand[50],
  surface:           "#FFFFFF",
  surfaceMuted:      palette.sand[200],
  border:            palette.sand[300],
  divider:           palette.sand[400],

  // Content
  text:          palette.neutral[500],
  textStrong:    palette.neutral[600],
  textPrimary:   palette.neutral[600],
  textSecondary: palette.neutral[400],
  textInverse:   "#FFFFFF",
  inverseText:   "#FFFFFF",
  muted:         palette.neutral[400],

  // Brand — coral
  primary:      palette.coral[500],
  primaryHover: palette.coral[600],
  primarySoft:  palette.coral[100],
  primaryText:  "#FFFFFF",

  // Status
  success:     palette.emerald[500],
  successSoft: palette.emerald[100],
  warning:     palette.gold[400],
  warningSoft: palette.warning[100],
  error:       palette.error[500],
  errorSoft:   palette.error[100],
  info:        palette.indigo[500],
  infoSoft:    palette.indigo[100],

  // Gamification
  xp:          palette.xp[500],
  xpSoft:      palette.xp[100],
  streak:      palette.fire[400],
  streakSoft:  palette.fire[100],
  points:      palette.gold[400],
  pointsSoft:  palette.gold[100],
  reward:      palette.gold[500],
  rewardSoft:  palette.gold[100],

  // Overlays
  overlay: "rgba(30, 28, 26, 0.5)",
  scrim:   "rgba(30, 28, 26, 0.72)",
} as const;

export type Colors = Record<keyof typeof colors, string>;

export const darkColors: Colors = {
  // Core surfaces
  background:        "#16130F",
  backgroundElevated: "#1F1C17",
  surface:           "#252117",
  surfaceMuted:      "#1A1712",
  border:            "#332E26",
  divider:           "#3D3830",

  // Content
  text:          palette.sand[200],
  textStrong:    palette.sand[50],
  textPrimary:   palette.sand[50],
  textSecondary: palette.neutral[400],
  textInverse:   palette.neutral[600],
  inverseText:   palette.neutral[600],
  muted:         palette.neutral[400],

  // Brand — coral (ligeramente más brillante en dark)
  primary:      palette.coral[400],
  primaryHover: palette.coral[300],
  primarySoft:  "rgba(232, 88, 58, 0.18)",
  primaryText:  "#FFFFFF",

  // Status
  success:     palette.emerald[400],
  successSoft: "rgba(54, 168, 108, 0.15)",
  warning:     palette.gold[400],
  warningSoft: "rgba(245, 166, 35, 0.15)",
  error:       palette.error[500],
  errorSoft:   "rgba(217, 74, 66, 0.15)",
  info:        palette.indigo[400],
  infoSoft:    "rgba(85, 120, 232, 0.15)",

  // Gamification
  xp:          palette.xp[400],
  xpSoft:      "rgba(124, 101, 216, 0.18)",
  streak:      palette.fire[300],
  streakSoft:  "rgba(255, 140, 58, 0.18)",
  points:      palette.gold[300],
  pointsSoft:  "rgba(251, 200, 36, 0.15)",
  reward:      palette.gold[400],
  rewardSoft:  "rgba(245, 166, 35, 0.15)",

  // Overlays
  overlay: "rgba(0, 0, 0, 0.6)",
  scrim:   "rgba(0, 0, 0, 0.8)",
};
