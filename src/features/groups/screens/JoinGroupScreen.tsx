import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../../../core/theme/colors";
import { joinGroupByCode } from "../services/groups.service";
import { useAppSession } from "../../../app/providers/AppSessionProvider";

export function JoinGroupScreen() {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { selectGroup } = useAppSession();

  async function handleJoinGroup() {
    try {
      setError("");
      setSuccessMessage("");
      setIsLoading(true);

      await joinGroupByCode(inviteCode);
      setSuccessMessage("Te uniste al grupo correctamente.");
      setInviteCode("");
      selectGroup();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al unirse al grupo.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Group</Text>
      <Text style={styles.subtitle}>
        Ingresa el código de invitación del grupo.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Invite code"
        autoCapitalize="characters"
        editable={!isLoading}
        value={inviteCode}
        onChangeText={setInviteCode}
        onSubmitEditing={handleJoinGroup}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <Button
        title={isLoading ? "Joining group..." : "Join Group"}
        onPress={handleJoinGroup}
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
