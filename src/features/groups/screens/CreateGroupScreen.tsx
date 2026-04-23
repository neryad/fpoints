import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
} from "react-native";
import { useTheme } from "../../../core/theme/ThemeProvider";
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
      <Text className="text-[22px] font-sans-bold text-foreground text-center mb-1">
        Crear grupo
      </Text>
      <Text className="text-sm font-sans text-muted-foreground text-center mb-5">
        Crea un nuevo grupo para comenzar.
      </Text>

      <TextInput
        className="bg-card border border-border rounded-lg px-3 py-3 text-sm text-foreground mb-3"
        placeholder="Nombre del grupo"
        placeholderTextColor={colors.muted}
        editable={!isLoading}
        value={name}
        onChangeText={setName}
        onSubmitEditing={handleCreate}
      />

      {error ? (
        <Text className="text-destructive text-xs text-center mb-3 font-sans">{error}</Text>
      ) : null}
      {successMessage ? (
        <Text className="text-success text-xs text-center mb-3 font-sans">{successMessage}</Text>
      ) : null}

      <Pressable
        className={`bg-primary rounded-xl py-4 items-center active:opacity-80 ${isLoading ? "opacity-40" : ""}`}
        onPress={handleCreate}
        disabled={isLoading}
      >
        <Text className="text-base font-sans-bold text-primary-foreground">
          {isLoading ? "Creando..." : "Crear grupo"}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
