import React, { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { Button } from "../../../../design-system-rn/components";
import { createGroup } from "../services/groups.service";
import { useAppSession } from "../../../app/providers/AppSessionProvider";

export function CreateGroupScreen() {
  const { colors } = useTheme();
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
    <KeyboardAvoidingView
      className="flex-1 bg-background justify-center px-6"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="items-center mb-8">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 mb-4">
          <Ionicons name="people-outline" size={32} color={colors.primary} />
        </View>
        <Text className="font-sans-bold text-[22px] text-foreground text-center mb-1">
          Crear grupo
        </Text>
        <Text className="font-sans text-sm text-muted-foreground text-center">
          Crea un nuevo grupo para comenzar.
        </Text>
      </View>

      <TextInput
        className="mb-3 rounded-xl border border-border bg-card px-3 py-3 font-sans text-sm text-foreground"
        placeholder="Nombre del grupo"
        placeholderTextColor={colors.muted}
        editable={!isLoading}
        value={name}
        onChangeText={setName}
        onSubmitEditing={handleCreate}
      />

      {error ? (
        <View className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
          <Text className="font-sans-medium text-center text-sm text-destructive">{error}</Text>
        </View>
      ) : null}
      {successMessage ? (
        <View className="mb-3 rounded-xl border border-success/30 bg-success/10 p-3">
          <Text className="font-sans-medium text-center text-sm text-success">{successMessage}</Text>
        </View>
      ) : null}

      <Button
        label={isLoading ? "Creando..." : "Crear grupo"}
        variant="primary"
        size="lg"
        fullWidth
        disabled={isLoading}
        onPress={handleCreate}
        iconLeft={
          isLoading ? undefined : (
            <Ionicons name="add" size={20} color={colors.primaryText} />
          )
        }
      />
    </KeyboardAvoidingView>
  );
}
