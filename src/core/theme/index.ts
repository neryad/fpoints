import { colors, palette } from "./colors";
export type { Colors } from "./colors";

import { spacing } from "./spacing";
export type { Spacing } from "./spacing";
import { radius } from "./radius";
import { shadow } from "./shadow";
export type { Shadow } from "./shadow";

import {
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyles,
} from "./typography";
export type { Typography } from "./typography";

import { motion } from "./motion";
export type { Motion } from "./motion";

import { zIndex } from "./zIndex";
export type { ZIndex } from "./zIndex";

import { layout } from "./layout";
export type { Layout } from "./layout";

export { colors, palette };
export { spacing };
export { radius };
export { shadow };
export { fontSize, fontWeight, lineHeight, letterSpacing, textStyles };
export { motion };
export { zIndex };
export { layout };

export const theme = {
  colors,
  spacing,
  radius,
  shadow,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyles,
  motion,
  zIndex,
  layout,
} as const;

export type Theme = typeof theme;
