export const fontSize = {
  xxs: 11,
  xs: 12,
  sm: 14,
  base: 16,
  md: 16,
  lg: 18,
  xl: 22,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;
export const lineHeight = {
  xxs: 16,
  xs: 16,
  sm: 20,
  md: 18,
  base: 24,
  lg: 28,
} as const;

export const letterSpacing = {
  none: 0,
  tight: 0.1,
  subtle: 0.15,
  body: 0.25,
  negative: -0.25,
  wide: 0.5,
  decorative: 2.4,
} as const;

export const textStyles = {
  title: {
    lg: {
      fontSize: fontSize.xl,
      lineHeight: lineHeight.lg,
      fontWeight: fontWeight.regular,
      letterSpacing: letterSpacing.none,
    },
    md: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.base,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.subtle,
    },
    sm: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.tight,
    },
  },
  label: {
    lg: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.sm,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.none,
    },
    md: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.xs,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.wide,
    },
    sm: {
      fontSize: fontSize.xxs,
      lineHeight: lineHeight.xxs,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.wide,
    },
  },
  body: {
    lg: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.base,
      fontWeight: fontWeight.regular,
      letterSpacing: letterSpacing.wide,
    },
    md: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
      fontWeight: fontWeight.regular,
      letterSpacing: letterSpacing.negative,
    },
    sm: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.md,
      fontWeight: fontWeight.regular,
      letterSpacing: letterSpacing.decorative,
    },
  },
} as const;

export type Typography = {
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  lineHeight: typeof lineHeight;
  letterSpacing: typeof letterSpacing;
  textStyles: typeof textStyles;
};
