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
import { theme } from "../../../core/theme";
import { AuthStackParamList } from "../../../app/navigation/types";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    padding: theme.spacing[6],
  },
  header: {
    width: "100%",
    marginBottom: theme.spacing[6],
  },
  form: {
    width: "100%",
    gap: theme.spacing[3],
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.primary,
  },
  subtitle: {
    marginTop: theme.spacing[2],
    color: theme.colors.muted,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
  input: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    color: theme.colors.text,
    fontSize: theme.fontSize.base,
  },
  inputInvalid: {
    borderColor: theme.colors.error,
  },
  fieldError: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.xs,
    marginTop: -theme.spacing[2],
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
  btnPrimary: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing[3],
    marginTop: theme.spacing[2],
    minHeight: theme.layout.minTouchTarget,
  },
  btnPrimaryText: {
    color: theme.colors.textInverse,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnSecondary: {
    width: "100%",
    alignItems: "center",
    paddingVertical: theme.spacing[3],
    marginTop: theme.spacing[2],
  },
  btnSecondaryText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  spacer: {
    height: theme.spacing[3],
  },
});
