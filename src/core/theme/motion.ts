export const motion = {
  duration: {
    instant: 80,
    fast: 140,
    normal: 220,
    slow: 320,
  },
  easing: {
    standard: "ease-in-out",
    accelerate: "ease-in",
    decelerate: "ease-out",
    linear: "linear",
  },
} as const;

export type Motion = typeof motion;
