import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TasksStackParamList } from "../../../app/navigation/types";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { createTaskSubmission } from "../services/tasks.service";

type Props = NativeStackScreenProps<TasksStackParamList, "SubmitTask">;

export function SubmitTaskScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const { colors } = useTheme();

  const [note, setNote] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [proofError, setProofError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [shouldGoBack, setShouldGoBack] = useState(false);

  useEffect(() => {
    if (!shouldGoBack) return;
    const timer = setTimeout(() => navigation.goBack(), 600);
    return () => clearTimeout(timer);
  }, [shouldGoBack, navigation]);

  const handleSubmit = useCallback(async () => {
    const urlTrimmed = proofImageUrl.trim();
    if (urlTrimmed && !/^https?:\/\//i.test(urlTrimmed)) {
      setProofError("Debe comenzar con http:// o https://");
      return;
    }
    try {
      setError("");
      setProofError("");
      setSuccessMessage("");
      setIsLoading(true);
      await createTaskSubmission(taskId, { note, proofImageUrl: urlTrimmed });
      setSuccessMessage("Enviado. Quedó pendiente de revisión.");
      setShouldGoBack(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar la tarea.");
    } finally {
      setIsLoading(false);
    }
  }, [taskId, note, proofImageUrl]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nota */}
        <View className="mb-4">
          <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-2">
            Nota
          </Text>
          <TextInput
            className="bg-card border border-border rounded-lg px-3 py-3 text-sm text-foreground"
            style={{ height: 104, textAlignVertical: "top" }}
            placeholder="Opcional — describe cómo completaste la tarea"
            placeholderTextColor={colors.muted}
            value={note}
            onChangeText={setNote}
            editable={!isLoading}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* URL de prueba */}
        <View className="mb-4">
          <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-2">
            URL de prueba (opcional)
          </Text>
          <TextInput
            className={`bg-card border rounded-lg px-3 py-3 text-sm text-foreground ${proofError ? "border-destructive" : "border-border"}`}
            placeholder="https://..."
            placeholderTextColor={colors.muted}
            value={proofImageUrl}
            onChangeText={(v) => { setProofImageUrl(v); setProofError(""); }}
            editable={!isLoading}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {proofError ? (
            <Text className="text-destructive text-xs text-center mt-1 font-sans">{proofError}</Text>
          ) : null}
        </View>

        {error ? (
          <Text className="text-destructive text-xs text-center mb-3 font-sans">{error}</Text>
        ) : null}
        {successMessage ? (
          <Text className="text-success text-xs text-center mb-3 font-sans">{successMessage}</Text>
        ) : null}

        <Pressable
          className={`bg-primary rounded-xl py-4 items-center active:opacity-80 ${isLoading ? "opacity-40" : ""}`}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text className="text-base font-sans-bold text-primary-foreground">
            {isLoading ? "Enviando..." : "Enviar completado"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
