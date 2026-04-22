/** Border-radius scale. `--radius: 12px` (0.75rem) is the design system base. */
export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
export default radius;