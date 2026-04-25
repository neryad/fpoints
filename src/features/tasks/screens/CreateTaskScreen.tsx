import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TasksStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { createTask } from "../services/tasks.service";

type Props = NativeStackScreenProps<TasksStackParamList, "CreateTask">;

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing[4],
      paddingBottom: spacing[8],
    },
    fieldWrap: {
      marginBottom: spacing[4],
    },
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
      height: 88,
      textAlignVertical: "top",
    },
    fieldError: {
      fontSize: fontSize.xxs,
      color: colors.error,
      marginTop: spacing[1],
    },
    switchCard: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing[4],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing[4],
    },
    switchLabelWrap: { flex: 1, marginRight: spacing[3] },
    switchLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.textStrong,
      marginBottom: 2,
    },
    switchSub: {
      fontSize: fontSize.xxs,
      color: colors.muted,
    },
    errorText: {
      fontSize: fontSize.xs,
      color: colors.error,
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

export function CreateTaskScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { activeGroupId } = useAppSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointsValue, setPointsValue] = useState("10");
  const [requiresProof, setRequiresProof] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; pointsValue?: string }>({});

  const validate = useCallback((): boolean => {
    const errs: { title?: string; pointsValue?: string } = {};
    if (!title.trim()) errs.title = "El título es obligatorio.";
    else if (title.trim().length > 100) errs.title = "Máximo 100 caracteres.";
    const parsed = parseInt(pointsValue, 10);
    if (isNaN(parsed) || parsed < 1) errs.pointsValue = "Debe ser un número mayor a 0.";
    else if (parsed > 9999) errs.pointsValue = "No puede superar 9999.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [title, pointsValue]);

  const handleCreate = useCallback(async () => {
    if (!activeGroupId || !validate()) return;
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
  }, [activeGroupId, title, description, pointsValue, requiresProof, validate, navigation]);

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

        {/* Título */}
        <View style={s.fieldWrap}>
          <Text style={s.label}>Título *</Text>
          <TextInput
            style={[s.input, fieldErrors.title ? s.inputInvalid : null]}
            placeholder="Ej: Lavar los platos"
            placeholderTextColor={theme.colors.muted}
            value={title}
            onChangeText={(t) => { setTitle(t); setFieldErrors((e) => ({ ...e, title: undefined })); }}
            editable={!isLoading}
          />
          {fieldErrors.title ? <Text style={s.fieldError}>{fieldErrors.title}</Text> : null}
        </View>

        {/* Descripción */}
        <View style={s.fieldWrap}>
          <Text style={s.label}>Descripción</Text>
          <TextInput
            style={[s.input, s.inputMultiline]}
            placeholder="Opcional"
            placeholderTextColor={theme.colors.muted}
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Puntos */}
        <View style={s.fieldWrap}>
          <Text style={s.label}>Puntos</Text>
          <TextInput
            style={[s.input, fieldErrors.pointsValue ? s.inputInvalid : null]}
            placeholder="10"
            placeholderTextColor={theme.colors.muted}
            value={pointsValue}
            onChangeText={(t) => { setPointsValue(t); setFieldErrors((e) => ({ ...e, pointsValue: undefined })); }}
            editable={!isLoading}
            keyboardType="numeric"
          />
          {fieldErrors.pointsValue ? <Text style={s.fieldError}>{fieldErrors.pointsValue}</Text> : null}
        </View>

        {/* Switch requiere prueba */}
        <View style={s.switchCard}>
          <View style={s.switchLabelWrap}>
            <Text style={s.switchLabel}>Requiere prueba fotográfica</Text>
            <Text style={s.switchSub}>El miembro deberá adjuntar una URL de imagen.</Text>
          </View>
          <Switch
            value={requiresProof}
            onValueChange={setRequiresProof}
            disabled={isLoading}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [s.btnPrimary, isLoading && s.btnDisabled, pressed && !isLoading && { opacity: 0.8 }]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={s.btnPrimaryText}>{isLoading ? "Creando..." : "Crear tarea"}</Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}