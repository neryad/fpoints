import React, { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { createGroup } from "../services/groups.service";
import { useAppSession } from "../../../app/providers/AppSessionProvider";

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.background,
      padding: spacing[6],             // 24
    },
    title: {
      fontSize: fontSize.xl,           // 22
      fontWeight: fontWeight.bold,     // "700"
      color: colors.textStrong,
      textAlign: "center",
      marginBottom: spacing[1],        // 4
    },
    subtitle: {
      fontSize: fontSize.sm,           // 14
      color: colors.muted,
      textAlign: "center",
      marginBottom: spacing[5],        // 20
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.sm,         // 8
      paddingHorizontal: spacing[3],   // 12
      paddingVertical: spacing[3],     // 12
      fontSize: fontSize.sm,           // 14
      color: colors.text,
      marginBottom: spacing[3],        // 12
    },
    errorText: {
      fontSize: fontSize.xs,           // 12
      color: colors.error,
      textAlign: "center",
      marginBottom: spacing[3],        // 12
    },
    successText: {
      fontSize: fontSize.xs,           // 12
      color: colors.success,
      textAlign: "center",
      marginBottom: spacing[3],        // 12
    },
    btnPrimary: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[4],     // 16
      alignItems: "center",
    },
    btnPrimaryText: {
      fontSize: fontSize.base,         // 16
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },
    btnDisabled: { opacity: 0.4 },
  });
}

export function CreateGroupScreen() {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { selectGroup } = useAppSession();

  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { setError("El nombre debe tener al menos 2 caracteres."); return; }
    if (trimmed.length > 50) { setError("El nombre no puede superar los 50 caracteres."); return; }
    try {
      setError("");
      setSuccessMessage("");
      setIsLoading(true);
      const group = await createGroup(trimmed);
      setSuccessMessage("Grupo creado correctamente.");
      setName("");
      selectGroup(group.id, group.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al crear el grupo.");
    } finally {
      setIsLoading(false);
    }
  }, [name, selectGroup]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Crear grupo</Text>
      <Text style={s.subtitle}>Crea un nuevo grupo para comenzar.</Text>

      <TextInput
        style={s.input}
        placeholder="Nombre del grupo"
        placeholderTextColor={theme.colors.muted}
        editable={!isLoading}
        value={name}
        onChangeText={setName}
        onSubmitEditing={handleCreate}
      />

      {error ? <Text style={s.errorText}>{error}</Text> : null}
      {successMessage ? <Text style={s.successText}>{successMessage}</Text> : null}

      <Pressable
        style={({ pressed }) => [s.btnPrimary, isLoading && s.btnDisabled, pressed && !isLoading && { opacity: 0.8 }]}
        onPress={handleCreate}
        disabled={isLoading}
      >
        <Text style={s.btnPrimaryText}>{isLoading ? "Creando..." : "Crear grupo"}</Text>
      </Pressable>
    </View>
  );
}