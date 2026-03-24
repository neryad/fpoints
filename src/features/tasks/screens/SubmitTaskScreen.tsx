import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../../core/theme/colors";
import { TasksStackParamList } from "../../../app/navigation/types";
import { createTaskSubmission } from "../services/tasks.service";

type Props = NativeStackScreenProps<TasksStackParamList, "SubmitTask">;

export function SubmitTaskScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const [note, setNote] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit() {
    try {
      setError("");
      setSuccessMessage("");
      setIsLoading(true);

      await createTaskSubmission(taskId, {
        note,
        proofImageUrl,
      });

      setSuccessMessage("Enviado. Quedo pendiente de revision.");
      setTimeout(() => navigation.goBack(), 500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al enviar la tarea.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nota</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="Opcional"
        value={note}
        onChangeText={setNote}
        editable={!isLoading}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>URL de prueba (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="https://..."
        value={proofImageUrl}
        onChangeText={setProofImageUrl}
        editable={!isLoading}
        autoCapitalize="none"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <Button
        title={isLoading ? "Enviando..." : "Enviar completado"}
        onPress={handleSubmit}
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
    height: 96,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#ef4444",
    marginTop: 12,
    marginBottom: 8,
  },
  successText: {
    color: colors.primary,
    marginTop: 12,
    marginBottom: 8,
  },
});
