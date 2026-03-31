import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { theme } from "../../../core/theme";
import { AuthStackParamList } from "../../../app/navigation/types";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const { isLoading, error, signUp } = useAuth();

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

  async function handleRegister() {
    setSuccessMessage("");
    if (!validate()) return;
    const success = await signUp(email, password);
    if (success) {
      setSuccessMessage(
        "Cuenta creada correctamente. Ahora puedes iniciar sesión.",
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Regístrate para empezar</Text>

      <TextInput
        style={[styles.input, fieldErrors.email ? styles.inputInvalid : null]}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        editable={!isLoading}
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setFieldErrors((e) => ({ ...e, email: undefined }));
        }}
      />
      {fieldErrors.email ? (
        <Text style={styles.fieldError}>{fieldErrors.email}</Text>
      ) : null}

      <TextInput
        style={[
          styles.input,
          fieldErrors.password ? styles.inputInvalid : null,
        ]}
        placeholder="Password"
        secureTextEntry
        textContentType="password"
        editable={!isLoading}
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setFieldErrors((e) => ({ ...e, password: undefined }));
        }}
        onSubmitEditing={handleRegister}
      />
      {fieldErrors.password ? (
        <Text style={styles.fieldError}>{fieldErrors.password}</Text>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <Button
        title={isLoading ? "Creando cuenta..." : "Register"}
        onPress={handleRegister}
        disabled={isLoading}
      />

      <View style={styles.spacer} />

      <Button title="Back to Login" onPress={() => navigation.goBack()} />
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
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.textStrong,
  },
  subtitle: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[5],
    color: theme.colors.muted,
    textAlign: "center",
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
  input: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    marginBottom: theme.spacing[3],
    color: theme.colors.text,
  },
  errorText: {
    width: "100%",
    color: theme.colors.error,
    marginBottom: theme.spacing[3],
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
  successText: {
    width: "100%",
    color: theme.colors.success,
    marginBottom: theme.spacing[3],
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
  inputInvalid: {
    borderColor: theme.colors.error,
  },
  fieldError: {
    width: "100%",
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.xs,
    marginTop: -theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  spacer: {
    height: theme.spacing[3],
  },
});
