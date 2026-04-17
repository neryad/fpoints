export const motion = {
  duration: {
    instant: 80,
    fast: 140,
    normal: 220,
    slow: 320,
  },
} as const;

export type Motion = typeof motion;
