import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";

export type EmptyStateProps = {
  emoji: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  emoji,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors, spacing, radius, fontSize, fontWeight } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing[7] }]}>
      <Text style={[styles.emoji, { marginBottom: spacing[3] }]}>{emoji}</Text>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: fontSize.base,
          fontWeight: fontWeight.semibold,
          textAlign: "center",
          marginBottom: spacing[2],
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: fontSize.sm,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: colors.primarySoft,
              borderRadius: radius.md,
              paddingHorizontal: spacing[5],
              paddingVertical: spacing[3],
              marginTop: spacing[5],
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: fontSize.sm,
              fontWeight: fontWeight.bold,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 48,
  },
  action: {
    alignSelf: "center",
  },
});
