import React, { useState } from "react";
import {
  Button,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../core/theme/colors";
import { TasksStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { createTask } from "../services/tasks.service";

type Props = NativeStackScreenProps<TasksStackParamList, "CreateTask">;

export function CreateTaskScreen({ navigation }: Props) {
  const { activeGroupId } = useAppSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointsValue, setPointsValue] = useState("10");
  const [requiresProof, setRequiresProof] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!activeGroupId) return;
    try {
      setError("");
      setIsLoading(true);
      await createTask(activeGroupId, {
        title,
        description,
        pointsValue: parseInt(pointsValue, 10) || 10,
        requiresProof,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la tarea.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Lavar los platos"
        value={title}
        onChangeText={setTitle}
        editable={!isLoading}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="Opcional"
        value={description}
        onChangeText={setDescription}
        editable={!isLoading}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Puntos</Text>
      <TextInput
        style={styles.input}
        placeholder="10"
        value={pointsValue}
        onChangeText={setPointsValue}
        editable={!isLoading}
        keyboardType="numeric"
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Requiere prueba fotográfica</Text>
        <Switch
          value={requiresProof}
          onValueChange={setRequiresProof}
          disabled={isLoading}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        title={isLoading ? "Creando..." : "Crear Tarea"}
        onPress={handleCreate}
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.text,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: colors.text,
  },
  errorText: {
    color: "#ef4444",
    marginTop: 12,
    marginBottom: 8,
  },
});
