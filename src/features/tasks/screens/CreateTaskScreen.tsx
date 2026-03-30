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

  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    pointsValue?: string;
  }>({});

  function validate(): boolean {
    const errs: { title?: string; pointsValue?: string } = {};
    if (!title.trim()) {
      errs.title = "El título es obligatorio.";
    } else if (title.trim().length > 100) {
      errs.title = "El título no puede superar los 100 caracteres.";
    }
    const parsed = parseInt(pointsValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      errs.pointsValue = "Los puntos deben ser un número mayor a 0.";
    } else if (parsed > 9999) {
      errs.pointsValue = "Los puntos no pueden superar 9999.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate() {
    if (!activeGroupId) return;
    if (!validate()) return;
    try {
      setError("");
      setIsLoading(true);
      await createTask(activeGroupId, {
        title,
        description,
        pointsValue: parseInt(pointsValue, 10),
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
        style={[styles.input, fieldErrors.title ? styles.inputInvalid : null]}
        placeholder="Ej: Lavar los platos"
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          setFieldErrors((e) => ({ ...e, title: undefined }));
        }}
        editable={!isLoading}
      />
      {fieldErrors.title ? (
        <Text style={styles.fieldError}>{fieldErrors.title}</Text>
      ) : null}

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
        style={[
          styles.input,
          fieldErrors.pointsValue ? styles.inputInvalid : null,
        ]}
        placeholder="10"
        value={pointsValue}
        onChangeText={(t) => {
          setPointsValue(t);
          setFieldErrors((e) => ({ ...e, pointsValue: undefined }));
        }}
        editable={!isLoading}
        keyboardType="numeric"
      />
      {fieldErrors.pointsValue ? (
        <Text style={styles.fieldError}>{fieldErrors.pointsValue}</Text>
      ) : null}

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
  inputInvalid: {
    borderColor: "#B42318",
  },
  fieldError: {
    color: "#B42318",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
});
