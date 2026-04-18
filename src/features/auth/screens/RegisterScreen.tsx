import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../app/navigation/types";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { colors, spacing, fontSize, fontWeight, radius } = useTheme();
  const { isLoading, error, signUp } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = useCallback((): boolean => {
    const errs: { email?: string; password?: string } = {};
    const trimmed = email.trim();
    if (!trimmed) errs.email = "El email es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      errs.email = "Ingresa un email válido.";
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
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { padding: spacing[6] }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", marginBottom: spacing[6] }}>
          <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing[1] }}>
            Crear cuenta
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.muted }}>
            Regístrate para empezar
          </Text>
        </View>

        <View style={{ width: "100%", gap: spacing[3] }}>
          <Input
            label="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); setFieldErrors((e) => ({ ...e, email: undefined })); }}
            error={fieldErrors.email}
            placeholder="tu@email.com"
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            disabled={isLoading}
          />

          <Input
            label="Contraseña"
            value={password}
            onChangeText={(t) => { setPassword(t); setFieldErrors((e) => ({ ...e, password: undefined })); }}
            error={fieldErrors.password}
            placeholder="Mínimo 6 caracteres"
            leftIcon="lock-closed-outline"
            secureTextEntry
            textContentType="newPassword"
            disabled={isLoading}
            onSubmitEditing={handleRegister}
          />

          {error ? (
            <Text style={{ color: colors.error, fontSize: fontSize.sm }}>{error}</Text>
          ) : null}

          {successMessage ? (
            <View style={{ backgroundColor: colors.successSoft, borderRadius: radius.md, padding: spacing[3] }}>
              <Text style={{ color: colors.success, fontSize: fontSize.sm }}>{successMessage}</Text>
            </View>
          ) : null}

          <Button
            label="Crear cuenta"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            size="lg"
          />

          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: "center", paddingVertical: spacing[2] })}
          >
            <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
