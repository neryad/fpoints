import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  cancelText = "Cancelar",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors, spacing, radius, fontSize, fontWeight } = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
          onPress={() => {}}
        >
          <Text
            style={[
              styles.title,
              {
                color: colors.textStrong,
                fontSize: fontSize.base,
                fontWeight: fontWeight.semibold,
                marginBottom: spacing[2],
              },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.message,
              {
                color: colors.text,
                fontSize: fontSize.sm,
                marginBottom: spacing[5],
              },
            ]}
          >
            {message}
          </Text>
          <View style={[styles.actions, { gap: spacing[2] }]}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                {
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  paddingVertical: spacing[3],
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={onCancel}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.medium,
                  textAlign: "center",
                }}
              >
                {cancelText}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.btnConfirm,
                {
                  backgroundColor: destructive ? colors.error : colors.primary,
                  borderRadius: radius.md,
                  paddingVertical: spacing[3],
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={onConfirm}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  textAlign: "center",
                }}
              >
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderWidth: 1,
    padding: 20,
  },
  title: {},
  message: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    alignItems: "center",
  },
  btnConfirm: {
    borderWidth: 0,
  },
});
