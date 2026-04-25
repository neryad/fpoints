import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { isLoading, error, signIn, signInAsChild, setupChild } = useAuth();
  const { selectGroup } = useAppSession();

  const [isChildMode, setIsChildMode] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
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
      style={{ flex: 1 }}
      className="bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        className="bg-background"
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full mb-6">
          <Text className="font-sans-bold text-[34px] text-primary mb-1">
            fpoints
          </Text>
          <Text className="font-sans text-sm text-muted-foreground">
            {isChildMode ? "Acceso para miembros" : "Inicia sesión para continuar"}
          </Text>
        </View>

        {/* Mode toggle */}
        <View className="flex-row gap-1 rounded-xl border border-border bg-muted p-1 w-full mb-5">
          {([false, true] as const).map((childMode) => {
            const isActive = isChildMode === childMode;
            return (
              <Pressable
                key={String(childMode)}
                className={`flex-1 items-center justify-center py-2 rounded-lg active:opacity-80 ${isActive ? "bg-primary" : ""}`}
                onPress={() => switchMode(childMode)}
              >
                <Text className={`text-sm ${isActive ? "font-sans-semibold text-primary-foreground" : "font-sans text-muted-foreground"}`}>
                  {childMode ? "Soy niño / miembro" : "Adulto"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="w-full gap-3">
          {!isChildMode ? (
            <>
              <Input
                key="adult-email"
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
                key="adult-password"
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
                <Text className="text-destructive text-sm font-sans">{error}</Text>
              ) : null}
              <Button label="Ingresar" onPress={handleLogin} loading={isLoading} disabled={isLoading} size="lg" />
              <Pressable
                onPress={() => navigation.navigate("Register")}
                className="items-center py-2 active:opacity-70"
              >
                <Text className="text-primary text-sm font-sans-medium">
                  ¿No tienes cuenta? Regístrate
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View className="bg-secondary rounded-xl p-3 mb-1">
                <Text className="text-secondary-foreground text-xs font-sans">
                  Usa el nombre de usuario y PIN que te dio tu papá o mamá.
                </Text>
              </View>
              <Input
                key="child-username"
                label="Nombre de usuario"
                value={username}
                onChangeText={(t) => { setUsername(t); setFieldErrors((e) => ({ ...e, username: undefined })); }}
                error={fieldErrors.username}
                placeholder="mi_nombre"
                leftIcon="person-outline"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
                textContentType="username"
                autoComplete="username"
                disabled={isLoading}
              />
              <Input
                key="child-pin"
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
                <Text className="text-destructive text-sm font-sans">{error}</Text>
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
