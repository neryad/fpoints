import { Platform, ViewStyle } from "react-native";

/**
 * Shadows that work on iOS (shadow*) and Android (elevation).
 * Spread them onto your style: <View style={[styles.card, shadows.card]} />
 */
const ios = (
  opacity: number,
  radius: number,
  offsetY: number
): ViewStyle => ({
  shadowColor: "#000",
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: offsetY },
});

export const shadows = {
  none: Platform.select<ViewStyle>({
    ios: { shadowOpacity: 0 },
    android: { elevation: 0 },
    default: {},
  })!,
  card: Platform.select<ViewStyle>({
    ios: ios(0.06, 8, 2),
    android: { elevation: 2 },
    default: {},
  })!,
  cardHover: Platform.select<ViewStyle>({
    ios: ios(0.12, 16, 6),
    android: { elevation: 6 },
    default: {},
  })!,
  modal: Platform.select<ViewStyle>({
    ios: ios(0.18, 24, 12),
    android: { elevation: 12 },
    default: {},
  })!,
} as const;

export default shadows;