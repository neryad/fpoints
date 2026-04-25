import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TasksStackParamList } from "../../../app/navigation/types";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { createTaskSubmission } from "../services/tasks.service";

type Props = NativeStackScreenProps<TasksStackParamList, "SubmitTask">;

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      padding: spacing[4],
      paddingBottom: spacing[8],
    },
    fieldWrap: { marginBottom: spacing[4] },
    label: {
      fontSize: fontSize.xxs,
      fontWeight: fontWeight.medium,
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: spacing[2],
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      fontSize: fontSize.sm,
      color: colors.text,
    },
    inputInvalid: {
      borderColor: colors.error,
      borderWidth: 0.5,
    },
    inputMultiline: {
      height: 104,
      textAlignVertical: "top",
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

export function SubmitTaskScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const theme = useTheme();
  const s = makeStyles(theme);

  const [note, setNote] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [proofError, setProofError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
      setTimeout(() => navigation.goBack(), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar la tarea.");
    } finally {
      setIsLoading(false);
    }
  }, [taskId, note, proofImageUrl, navigation]);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* Nota */}
        <View style={s.fieldWrap}>
          <Text style={s.label}>Nota</Text>
          <TextInput
            style={[s.input, s.inputMultiline]}
            placeholder="Opcional — describe cómo completaste la tarea"
            placeholderTextColor={theme.colors.muted}
            value={note}
            onChangeText={setNote}
            editable={!isLoading}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* URL de prueba */}
        <View style={s.fieldWrap}>
          <Text style={s.label}>URL de prueba (opcional)</Text>
          <TextInput
            style={[s.input, proofError ? s.inputInvalid : null]}
            placeholder="https://..."
            placeholderTextColor={theme.colors.muted}
            value={proofImageUrl}
            onChangeText={(v) => { setProofImageUrl(v); setProofError(""); }}
            editable={!isLoading}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {proofError ? <Text style={s.errorText}>{proofError}</Text> : null}
        </View>

        {error ? <Text style={s.errorText}>{error}</Text> : null}
        {successMessage ? <Text style={s.successText}>{successMessage}</Text> : null}

        <Pressable
          style={({ pressed }) => [s.btnPrimary, isLoading && s.btnDisabled, pressed && !isLoading && { opacity: 0.8 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={s.btnPrimaryText}>{isLoading ? "Enviando..." : "Enviar completado"}</Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}