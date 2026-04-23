import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
} from "react-native";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { joinGroupByCode } from "../services/groups.service";
import { useAppSession } from "../../../app/providers/AppSessionProvider";

export function JoinGroupScreen() {
  const { colors } = useTheme();
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
      className="flex-1 bg-background justify-center px-6"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text className="text-[22px] font-sans-bold text-foreground text-center mb-1">
        Unirse a un grupo
      </Text>
      <Text className="text-sm font-sans text-muted-foreground text-center mb-5">
        Ingresa el código de invitación del grupo.
      </Text>

      <TextInput
        className="bg-card border border-border rounded-lg px-3 py-3 text-base font-sans-bold text-foreground text-center mb-3"
        style={{ letterSpacing: 4 }}
        placeholder="CÓDIGO"
        placeholderTextColor={colors.muted}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isLoading}
        value={inviteCode}
        onChangeText={setInviteCode}
        onSubmitEditing={handleJoin}
      />

      {error ? (
        <Text className="text-destructive text-xs text-center mb-3 font-sans">{error}</Text>
      ) : null}
      {successMessage ? (
        <Text className="text-success text-xs text-center mb-3 font-sans">{successMessage}</Text>
      ) : null}

      <Pressable
        className={`bg-primary rounded-xl py-4 items-center active:opacity-80 ${isLoading ? "opacity-40" : ""}`}
        onPress={handleJoin}
        disabled={isLoading}
      >
        <Text className="text-base font-sans-bold text-primary-foreground">
          {isLoading ? "Uniéndose..." : "Unirse al grupo"}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
