import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../../../core/theme/colors";
import { createGroup } from "../services/groups.service";
import { useAppSession } from "../../../app/providers/AppSessionProvider";

export function CreateGroupScreen() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { selectGroup } = useAppSession();
  async function handleCreateGroup() {
    try {
      setError("");
      setSuccessMessage("");
      setIsLoading(true);

      const group = await createGroup(name);
      setSuccessMessage("Grupo creado correctamente.");
      setName("");
      selectGroup(group.id, group.name);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear el grupo.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Group</Text>
      <Text style={styles.subtitle}>Crea un nuevo grupo para comenzar.</Text>

      <TextInput
        style={styles.input}
        placeholder="Group name"
        editable={!isLoading}
        value={name}
        onChangeText={setName}
        onSubmitEditing={handleCreateGroup}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <Button
        title={isLoading ? "Creating group..." : "Create Group"}
        onPress={handleCreateGroup}
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
    textAlign: "center",
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
  errorText: {
    color: "#B42318",
    marginBottom: 12,
    textAlign: "center",
  },
  successText: {
    color: "#0B6E4F",
    marginBottom: 12,
    textAlign: "center",
  },
});
