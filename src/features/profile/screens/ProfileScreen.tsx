import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
import { signOut } from "../../auth/services/auth.service";
import { getMyProfile, saveMyProfile } from "../services/profile.service";

export function ProfileScreen() {
  const { clearGroup } = useAppSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setError("");
      setIsLoadingProfile(true);
      const profile = await getMyProfile();
      setName(profile.name ?? "");
      setEmail(profile.email);
      setAvatarUrl(profile.avatarUrl ?? "");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrio un error al cargar perfil.";
      setError(message);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSaveProfile() {
    try {
      setError("");
      setSuccessMessage("");
      setIsSaving(true);
      const profile = await saveMyProfile({ name, avatarUrl });
      setName(profile.name ?? "");
      setEmail(profile.email);
      setAvatarUrl(profile.avatarUrl ?? "");
      setSuccessMessage("Perfil guardado correctamente.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrio un error al guardar perfil.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      setError("");
      setIsLoading(true);
      await signOut();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cerrar sesión.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>
        Gestiona tu identidad para grupos y ranking.
      </Text>

      {isLoadingProfile ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={name}
            onChangeText={setName}
            editable={!isSaving && !isLoading}
          />
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            placeholder="Email"
            value={email}
            editable={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Avatar URL (opcional)"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            autoCapitalize="none"
            editable={!isSaving && !isLoading}
          />

          <Button
            title={isSaving ? "Saving profile..." : "Save Profile"}
            onPress={handleSaveProfile}
            disabled={isSaving || isLoading}
          />
        </>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <Button title="Switch Group" onPress={clearGroup} />

      <View style={styles.spacer} />

      <Button
        title={isLoading ? "Closing session..." : "Logout"}
        onPress={handleLogout}
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  inputDisabled: {
    opacity: 0.7,
  },
  errorText: {
    width: "100%",
    color: "#B42318",
    marginBottom: 12,
    textAlign: "center",
  },
  successText: {
    width: "100%",
    color: "#0B6E4F",
    marginTop: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  spacer: {
    height: 12,
  },
});
