export const layout = {
  grid: {
    columns: 4,
    gutter: 16,
    margin: 16,
  },
  chrome: {
    systemBarHeight: 24,
    appBarHeight: 56,
    bottomSystemNavigationHeight: 24,
  },
  maxContentWidth: 560,
  minTouchTarget: 48,
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
} as const;

export type Layout = typeof layout;
