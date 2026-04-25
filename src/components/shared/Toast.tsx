import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../core/theme/ThemeProvider";

export type ToastVariant = "success" | "error" | "info" | "warning";

type ToastConfig = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
});

export const useToast = () => useContext(ToastContext);

function ToastItem({
  config,
  onDismiss,
}: {
  config: ToastConfig;
  onDismiss: (id: string) => void;
}) {
  const { colors, spacing, radius, fontSize, fontWeight, shadow } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => dismiss(), config.duration ?? 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(config.id));
  }

  const iconName: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
    success: "checkmark-circle",
    error:   "close-circle",
    warning: "warning",
    info:    "information-circle",
  };

  const bgColor: Record<ToastVariant, string> = {
    success: colors.success,
    error:   colors.error,
    warning: colors.warning,
    info:    colors.info,
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        shadow.level2,
        {
          backgroundColor: bgColor[config.variant],
          borderRadius: radius.md,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          opacity,
          transform: [{ translateY }],
          gap: spacing[2],
        },
      ]}
    >
      <Ionicons name={iconName[config.variant]} size={18} color="#fff" />
      <Text
        style={{
          color: "#fff",
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
          flex: 1,
        }}
      >
        {config.message}
      </Text>
      <Pressable onPress={dismiss} hitSlop={8}>
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const show = useCallback(
    (message: string, variant: ToastVariant = "success", duration = 3000) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} config={t} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
});
