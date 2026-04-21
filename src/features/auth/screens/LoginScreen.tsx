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
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { colors, spacing, fontSize, fontWeight, radius } = useTheme();
  const { isLoading, error, signIn, signInAsChild, setupChild } = useAuth();
  const { selectGroup } = useAppSession();

  const [isChildMode, setIsChildMode] = useState(false);

  // Standard login fields
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  // Child login fields
  const [username, setUsername] = useState("");
  const [pin, setPin]           = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const validateEmail = useCallback((): boolean => {
    const errs: Record<string, string | undefined> = {};
    const trimmed = email.trim();
    if (!trimmed) errs.email = "El email es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      errs.email = "Ingresa un email válido.";
    if (!password) errs.password = "La contraseña es obligatoria.";
    else if (password.length < 6) errs.password = "Mínimo 6 caracteres.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [email, password]);

  const validateChild = useCallback((): boolean => {
    const errs: Record<string, string | undefined> = {};
    if (!username.trim()) errs.username = "El nombre de usuario es obligatorio.";
    if (!pin) errs.pin = "El PIN es obligatorio.";
    else if (!/^\d{4,6}$/.test(pin)) errs.pin = "El PIN debe tener entre 4 y 6 dígitos.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [username, pin]);

  const handleLogin = useCallback(async () => {
    if (!validateEmail()) return;
    await signIn(email.trim(), password);
  }, [validateEmail, signIn, email, password]);

  const handleChildLogin = useCallback(async () => {
    if (!validateChild()) return;
    // Try login first; if account doesn't exist yet, activate invitation
    const loggedIn = await signInAsChild(username.trim(), pin);
    if (!loggedIn) {
      const result = await setupChild(username.trim(), pin);
      if (result) {
        selectGroup(result.groupId, "");
      }
    }
  }, [validateChild, setupChild, signInAsChild, username, pin, selectGroup]);

  const switchMode = useCallback((child: boolean) => {
    setIsChildMode(child);
    setFieldErrors({});
    setEmail(""); setPassword("");
    setUsername(""); setPin("");
  }, []);

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
            {isChildMode ? "Acceso para miembros" : "Inicia sesión para continuar"}
          </Text>
        </View>

        {/* Mode toggle */}
        <View style={[styles.toggle, { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, marginBottom: spacing[5] }]}>
          <Pressable
            style={({ pressed }) => [
              styles.toggleBtn,
              { borderRadius: radius.md },
              !isChildMode && { backgroundColor: colors.surface },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => switchMode(false)}
          >
            <Text style={{ fontSize: fontSize.sm, fontWeight: !isChildMode ? fontWeight.bold : fontWeight.regular, color: !isChildMode ? colors.textStrong : colors.muted }}>
              Adulto
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.toggleBtn,
              { borderRadius: radius.md },
              isChildMode && { backgroundColor: colors.surface },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => switchMode(true)}
          >
            <Text style={{ fontSize: fontSize.sm, fontWeight: isChildMode ? fontWeight.bold : fontWeight.regular, color: isChildMode ? colors.textStrong : colors.muted }}>
              Soy niño / miembro
            </Text>
          </Pressable>
        </View>

        <View style={{ width: "100%", gap: spacing[3] }}>
          {!isChildMode ? (
            <>
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
                <Text style={{ color: colors.error, fontSize: fontSize.sm }}>{error}</Text>
              ) : null}
              <Button label="Ingresar" onPress={handleLogin} loading={isLoading} disabled={isLoading} size="lg" />
              <Pressable
                onPress={() => navigation.navigate("Register")}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: "center", paddingVertical: spacing[2] })}
              >
                <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
                  ¿No tienes cuenta? Regístrate
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={{ backgroundColor: colors.infoSoft, borderRadius: radius.md, padding: spacing[3], marginBottom: spacing[1] }}>
                <Text style={{ color: colors.info, fontSize: fontSize.xs }}>
                  Usa el nombre de usuario y PIN que te dio tu papá o mamá.
                </Text>
              </View>
              <Input
                label="Nombre de usuario"
                value={username}
                onChangeText={(t) => { setUsername(t); setFieldErrors((e) => ({ ...e, username: undefined })); }}
                error={fieldErrors.username}
                placeholder="mi_nombre"
                leftIcon="person-outline"
                autoCapitalize="none"
                autoCorrect={false}
                disabled={isLoading}
              />
              <Input
                label="PIN"
                value={pin}
                onChangeText={(t) => { setPin(t); setFieldErrors((e) => ({ ...e, pin: undefined })); }}
                error={fieldErrors.pin}
                placeholder="4-6 dígitos"
                leftIcon="keypad-outline"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                disabled={isLoading}
                onSubmitEditing={handleChildLogin}
              />

              {error ? (
                <Text style={{ color: colors.error, fontSize: fontSize.sm }}>{error}</Text>
              ) : null}
              <Button
                label="Entrar"
                onPress={handleChildLogin}
                loading={isLoading}
                disabled={isLoading}
                size="lg"
              />
            </>
          )}
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
  toggle: {
    flexDirection: "row",
    padding: 4,
    width: "100%",
  },
  toggleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
});
