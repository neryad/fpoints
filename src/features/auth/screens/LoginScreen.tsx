import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../app/navigation/types";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

function makeStyles(t: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, lineHeight, radius, layout } = t;
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      padding: spacing[6],
    },
    header: {
      width: "100%",
      marginBottom: spacing[6],
    },
    form: {
      width: "100%",
      gap: spacing[3],
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.lg,
      color: colors.primary,
    },
    subtitle: {
      marginTop: spacing[2],
      color: colors.muted,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
    },
    input: {
      width: "100%",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      color: colors.text,
      fontSize: fontSize.base,
    },
    inputInvalid: {
      borderColor: colors.error,
    },
    fieldError: {
      color: colors.error,
      fontSize: fontSize.xs,
      lineHeight: lineHeight.xs,
      marginTop: -spacing[2],
    },
    errorText: {
      color: colors.error,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
    },
    btnPrimary: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing[3],
      marginTop: spacing[2],
      minHeight: layout.minTouchTarget,
    },
    btnPrimaryText: {
      color: colors.textInverse,
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
    },
    btnDisabled: { opacity: 0.6 },
    btnPressed: { opacity: 0.85 },
    btnSecondary: {
      width: "100%",
      alignItems: "center",
      paddingVertical: spacing[3],
      marginTop: spacing[2],
    },
    btnSecondaryText: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    spacer: { height: spacing[3] },
  });
}

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { isLoading, error, signIn } = useAuth();

  function validate(): boolean {
    const errs: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = "El email es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = "Ingresa un email válido.";
    }
    if (!password) {
      errs.password = "La contraseña es obligatoria.";
    } else if (password.length < 6) {
      errs.password = "Mínimo 6 caracteres.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    await signIn(email, password);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>fpoints</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
      </View>

      <View style={styles.form}>
        <View>
          <TextInput
            style={[
              styles.input,
              fieldErrors.email ? styles.inputInvalid : null,
            ]}
            placeholder="Email"
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setFieldErrors((e) => ({ ...e, email: undefined }));
            }}
          />
          {fieldErrors.email ? (
            <Text style={styles.fieldError}>{fieldErrors.email}</Text>
          ) : null}
        </View>

        <View>
          <TextInput
            style={[
              styles.input,
              fieldErrors.password ? styles.inputInvalid : null,
            ]}
            placeholder="Password"
            placeholderTextColor={theme.colors.muted}
            secureTextEntry
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setFieldErrors((e) => ({ ...e, password: undefined }));
            }}
          />
          {fieldErrors.password ? (
            <Text style={styles.fieldError}>{fieldErrors.password}</Text>
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.btnPrimary,
            isLoading && styles.btnDisabled,
            pressed && !isLoading && styles.btnPressed,
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <Text style={styles.btnPrimaryText}>Ingresar</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.btnSecondary}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.btnSecondaryText}>Crear cuenta</Text>
        </Pressable>
      </View>
    </View>
  );
}


