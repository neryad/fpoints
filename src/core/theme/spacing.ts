const spacingScale = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 56,
  11: 64,
  12: 72,
  13: 80,
} as const;

export const spacing = {
  ...spacingScale,
  // Backward-compatible aliases used by older screens.
  14: spacingScale[10],
  16: spacingScale[11],
  18: spacingScale[12],
  20: spacingScale[13],
} as const;

export type Spacing = typeof spacing;
