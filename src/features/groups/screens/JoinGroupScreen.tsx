import React, { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { Button } from "../../../../design-system-rn/components";
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
      <View className="items-center mb-8">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 mb-4">
          <Ionicons name="enter-outline" size={32} color={colors.primary} />
        </View>
        <Text className="font-sans-bold text-[22px] text-foreground text-center mb-1">
          Unirse a un grupo
        </Text>
        <Text className="font-sans text-sm text-muted-foreground text-center">
          Ingresa el código de invitación del grupo.
        </Text>
      </View>

      <TextInput
        className="mb-3 rounded-xl border border-border bg-card px-3 py-3 font-sans-bold text-base text-foreground text-center"
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
        label={isLoading ? "Uniéndose..." : "Unirse al grupo"}
        variant="primary"
        size="lg"
        fullWidth
        disabled={isLoading}
        onPress={handleJoin}
        iconLeft={
          isLoading ? undefined : (
            <Ionicons name="log-in-outline" size={20} color={colors.primaryText} />
          )
        }
      />
    </KeyboardAvoidingView>
  );
}
