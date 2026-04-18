import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export type AvatarProps = {
  uri?: string | null;
  name: string;
  size?: AvatarSize;
};

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const FONT_SIZE: Record<AvatarSize, number> = {
  sm: 12,
  md: 15,
  lg: 20,
  xl: 28,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ uri, name, size = "md" }: AvatarProps) {
  const { colors, radius, fontWeight } = useTheme();
  const px = SIZE_PX[size];
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.container,
        {
          width: px,
          height: px,
          borderRadius: px / 2,
          backgroundColor: colors.primarySoft,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: px, height: px, borderRadius: px / 2 }]}
        />
      ) : (
        <Text
          style={{
            color: colors.primary,
            fontSize: FONT_SIZE[size],
            fontWeight: fontWeight.bold,
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    position: "absolute",
  },
});
