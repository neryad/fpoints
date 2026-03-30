import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../core/theme/colors";
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
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.muted,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: colors.text,
  },
  errorText: {
    width: "100%",
    color: "#B42318",
    marginBottom: 12,
  },
  successText: {
    width: "100%",
    color: "#0B6E4F",
    marginBottom: 12,
  },
  inputInvalid: {
    borderColor: "#B42318",
  },
  fieldError: {
    width: "100%",
    color: "#B42318",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 6,
  },
  spacer: {
    height: 12,
  },
});
