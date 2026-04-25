import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../core/theme/ThemeProvider";

export type OfflineBannerProps = {
  visible: boolean;
};

export function OfflineBanner({ visible }: OfflineBannerProps) {
  const { colors, spacing, fontSize, fontWeight } = useTheme();
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -60,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: colors.error,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[2],
          transform: [{ translateY }],
          gap: spacing[2],
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text
        style={{
          color: "#fff",
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
          flex: 1,
        }}
      >
        Sin conexión a internet
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1000,
  },
});
