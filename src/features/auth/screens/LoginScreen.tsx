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

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { colors, spacing, fontSize, fontWeight } = useTheme();
  const { isLoading, error, signIn } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
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

  const handleLogin = useCallback(async () => {
    if (!validate()) return;
    await signIn(email.trim(), password);
  }, [validate, signIn, email, password]);

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
          <Text style={{ fontSize: 34, fontWeight: fontWeight.bold, color: colors.primary, marginBottom: spacing[1] }}>
            fpoints
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.muted }}>
            Inicia sesión para continuar
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
            textContentType="password"
            disabled={isLoading}
            onSubmitEditing={handleLogin}
          />

          {error ? (
            <Text style={{ color: colors.error, fontSize: fontSize.sm }}>
              {error}
            </Text>
          ) : null}

          <Button
            label="Ingresar"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            size="lg"
          />

          <Pressable
            onPress={() => navigation.navigate("Register")}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: "center", paddingVertical: spacing[2] })}
          >
            <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
              ¿No tienes cuenta? Regístrate
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
