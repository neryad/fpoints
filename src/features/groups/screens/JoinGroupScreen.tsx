import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { joinGroupByCode } from "../services/groups.service";
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
      fontWeight: fontWeight.bold,
      color: colors.textStrong,
      textAlign: "center",
      marginBottom: spacing[1],
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.muted,
      textAlign: "center",
      marginBottom: spacing[5],
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      fontSize: fontSize.base,         // 16 — más grande para código
      fontWeight: fontWeight.bold,
      color: colors.text,
      textAlign: "center",
      letterSpacing: 4,
      marginBottom: spacing[3],
    },
    errorText: {
      fontSize: fontSize.xs,
      color: colors.error,
      textAlign: "center",
      marginBottom: spacing[3],
    },
    successText: {
      fontSize: fontSize.xs,
      color: colors.success,
      textAlign: "center",
      marginBottom: spacing[3],
    },
    btnPrimary: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing[4],
      alignItems: "center",
    },
    btnPrimaryText: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
      color: colors.primaryText,
    },
    btnDisabled: { opacity: 0.4 },
  });
}

export function JoinGroupScreen() {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { selectGroup } = useAppSession();

  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleJoin = useCallback(async () => {
    if (!inviteCode.trim()) { setError("El código de invitación es obligatorio."); return; }
    try {
      setError("");
      setSuccessMessage("");
      setIsLoading(true);
      const group = await joinGroupByCode(inviteCode.trim());
      setSuccessMessage("¡Te uniste al grupo correctamente!");
      setInviteCode("");
      selectGroup(group.id, group.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al unirse al grupo.");
    } finally {
      setIsLoading(false);
    }
  }, [inviteCode, selectGroup]);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text style={s.title}>Unirse a un grupo</Text>
      <Text style={s.subtitle}>Ingresa el código de invitación del grupo.</Text>

      <TextInput
        style={s.input}
        placeholder="CÓDIGO"
        placeholderTextColor={theme.colors.muted}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isLoading}
        value={inviteCode}
        onChangeText={setInviteCode}
        onSubmitEditing={handleJoin}
      />

      {error ? <Text style={s.errorText}>{error}</Text> : null}
      {successMessage ? <Text style={s.successText}>{successMessage}</Text> : null}

      <Pressable
        style={({ pressed }) => [s.btnPrimary, isLoading && s.btnDisabled, pressed && !isLoading && { opacity: 0.8 }]}
        onPress={handleJoin}
        disabled={isLoading}
      >
        <Text style={s.btnPrimaryText}>{isLoading ? "Uniéndose..." : "Unirse al grupo"}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}