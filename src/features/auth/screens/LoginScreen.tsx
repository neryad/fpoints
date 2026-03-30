import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../core/theme/colors";
import { AuthStackParamList } from "../../../app/navigation/types";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isLoading, error, signIn } = useAuth();

  async function handleLogin() {
    await signIn(email, password);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>fpoints</Text>
      <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
      <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind!
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        title={isLoading ? "Ingresando..." : "Login"}
        onPress={handleLogin}
        disabled={isLoading}
      />

      <View style={styles.spacer} />

      <Button
        title="Go to Register"
        onPress={() => navigation.navigate("Register")}
      />
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
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.muted,
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
  spacer: {
    height: 12,
  },
});
