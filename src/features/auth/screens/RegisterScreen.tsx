import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../app/navigation/types";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

function makeStyles(t: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, lineHeight, radius, layout } = t;
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[6],             // 24
    },
    header: {
      width: "100%",
      marginBottom: spacing[6],        // 24
    },
    title: {
      fontSize: fontSize.xl,           // 22
      fontWeight: fontWeight.bold,     // "700"
      color: colors.textStrong,
      marginBottom: spacing[1],        // 4
    },
    subtitle: {
      fontSize: fontSize.sm,           // 14
      color: colors.muted,
      lineHeight: lineHeight.sm,
    },
    form: {
      width: "100%",
      gap: spacing[3],                 // 12
    },
    fieldWrap: { width: "100%" },
    input: {
      width: "100%",
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.md,         // 12
      paddingHorizontal: spacing[4],   // 16
      paddingVertical: spacing[3],     // 12
      color: colors.text,
      fontSize: fontSize.base,         // 16
    },
    inputInvalid: {
      borderColor: colors.error,
      borderWidth: 1,
    },
    fieldError: {
      color: colors.error,
      fontSize: fontSize.xs,           // 12
      marginTop: spacing[1],           // 4
    },
    errorText: {
      color: colors.error,
      fontSize: fontSize.sm,           // 14
    },
    successCard: {
      width: "100%",
      backgroundColor: colors.successSoft,
      borderRadius: radius.md,         // 12
      padding: spacing[3],             // 12
    },
    successText: {
      color: colors.success,
      fontSize: fontSize.sm,           // 14
      lineHeight: lineHeight.sm,
    },
    btnPrimary: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      marginTop: spacing[2],           // 8
      minHeight: layout.minTouchTarget, // 48
    },
    btnPrimaryText: {
      color: colors.primaryText,
      fontSize: fontSize.base,         // 16
      fontWeight: fontWeight.semibold, // "600"
    },
    btnDisabled: { opacity: 0.5 },
    btnSecondary: {
      width: "100%",
      alignItems: "center",
      paddingVertical: spacing[3],     // 12
      marginTop: spacing[1],           // 4
    },
    btnSecondaryText: {
      color: colors.primary,
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.medium,   // "500"
    },
  });
}

export function RegisterScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { isLoading, error, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = useCallback((): boolean => {
    const errs: { email?: string; password?: string } = {};
    const trimmed = email.trim();
    if (!trimmed) errs.email = "El email es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) errs.email = "Ingresa un email válido.";
    if (!password) errs.password = "La contraseña es obligatoria.";
    else if (password.length < 6) errs.password = "Mínimo 6 caracteres.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [email, password]);

  const handleRegister = useCallback(async () => {
    setSuccessMessage("");
    if (!validate()) return;
    const success = await signUp(email.trim(), password);
    if (success) {
      setSuccessMessage("Cuenta creada. Ahora puedes iniciar sesión.");
    }
  }, [validate, signUp, email, password]);

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Crear cuenta</Text>
          <Text style={s.subtitle}>Regístrate para empezar</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          <View style={s.fieldWrap}>
            <TextInput
              style={[s.input, fieldErrors.email && s.inputInvalid]}
              placeholder="Email"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => { setEmail(t); setFieldErrors((e) => ({ ...e, email: undefined })); }}
              editable={!isLoading}
            />
            {fieldErrors.email ? <Text style={s.fieldError}>{fieldErrors.email}</Text> : null}
          </View>

          <View style={s.fieldWrap}>
            <TextInput
              style={[s.input, fieldErrors.password && s.inputInvalid]}
              placeholder="Contraseña"
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
              textContentType="newPassword"
              value={password}
              onChangeText={(t) => { setPassword(t); setFieldErrors((e) => ({ ...e, password: undefined })); }}
              onSubmitEditing={handleRegister}
              editable={!isLoading}
            />
            {fieldErrors.password ? <Text style={s.fieldError}>{fieldErrors.password}</Text> : null}
          </View>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          {successMessage ? (
            <View style={s.successCard}>
              <Text style={s.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              s.btnPrimary,
              isLoading && s.btnDisabled,
              pressed && !isLoading && { opacity: 0.8 },
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={theme.colors.primaryText} />
              : <Text style={s.btnPrimaryText}>Crear cuenta</Text>
            }
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.btnSecondary, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={s.btnSecondaryText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}