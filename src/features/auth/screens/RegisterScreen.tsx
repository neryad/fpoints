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
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
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
            Regístrate para empezar
          </Text>
        </View>

        <View className="w-full gap-3">
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
            <Text className="text-destructive text-sm font-sans">{error}</Text>
          ) : null}

          {successMessage ? (
            <View className="bg-success/15 rounded-xl p-3">
              <Text className="text-success text-sm font-sans">{successMessage}</Text>
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
            className="items-center py-2 active:opacity-70"
          >
            <Text className="text-primary text-sm font-sans-medium">
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
