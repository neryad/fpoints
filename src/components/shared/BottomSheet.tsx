import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../core/theme/ThemeProvider";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const { colors, spacing, radius, fontSize, fontWeight, shadow } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            shadow.level3Up,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingHorizontal: spacing[5],
              paddingBottom: spacing[7],
              paddingTop: spacing[3],
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag handle */}
          <View
            style={[
              styles.handle,
              { backgroundColor: colors.border, borderRadius: radius.full, marginBottom: spacing[4] },
            ]}
          />

          {title && (
            <View style={[styles.titleRow, { marginBottom: spacing[4] }]}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: fontSize.base,
                  fontWeight: fontWeight.bold,
                  flex: 1,
                }}
              >
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
          )}

          <Pressable onPress={() => {}}>{children}</Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
  },
  handle: {
    width: 36,
    height: 4,
    alignSelf: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
