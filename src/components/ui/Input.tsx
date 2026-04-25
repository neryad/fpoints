import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../core/theme/ThemeProvider";

export type InputProps = {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  disabled?: boolean;
} & Omit<TextInputProps, "value" | "onChangeText" | "secureTextEntry" | "placeholder">;

export function Input({
  label,
  value,
  onChangeText,
  error,
  hint,
  placeholder,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  ...rest
}: InputProps) {
  const { colors, spacing, radius, fontSize, fontWeight } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.primary
    : colors.border;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: fontSize.xs,
            fontWeight: fontWeight.medium,
            marginBottom: spacing[1],
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.container,
          {
            borderColor,
            borderRadius: radius.md,
            backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
            paddingHorizontal: spacing[3],
            gap: spacing[2],
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? colors.primary : colors.muted}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: fontSize.sm,
              paddingVertical: spacing[3],
            },
          ]}
          {...rest}
          secureTextEntry={hidden}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={18}
              color={colors.muted}
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8} disabled={!onRightIconPress}>
            <Ionicons name={rightIcon} size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text
          style={{
            color: colors.error,
            fontSize: fontSize.xs,
            marginTop: spacing[1],
          }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          style={{
            color: colors.muted,
            fontSize: fontSize.xs,
            marginTop: spacing[1],
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
  },
  input: {
    flex: 1,
  },
});
