import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
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
import { listGroupMembers, type GroupMember } from "../../groups/services/groups.service";

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
    pickerBtn: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pickerBtnText: {
      fontSize: fontSize.sm,
      color: colors.text,
    },
    pickerBtnPlaceholder: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
    pickerChevron: {
      fontSize: fontSize.xs,
      color: colors.muted,
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
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingTop: spacing[4],
      paddingBottom: spacing[8],
      maxHeight: "60%",
    },
    modalTitle: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
      color: colors.textStrong,
      textAlign: "center",
      marginBottom: spacing[3],
      paddingHorizontal: spacing[4],
    },
    memberRow: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    memberRowSelected: {
      backgroundColor: colors.primarySoft,
    },
    memberName: {
      fontSize: fontSize.sm,
      color: colors.text,
    },
    memberNameSelected: {
      color: colors.primary,
      fontWeight: fontWeight.semibold,
    },
    memberCheck: {
      fontSize: fontSize.sm,
      color: colors.primary,
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.divider,
      marginHorizontal: spacing[4],
    },
    noneRow: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    noneText: {
      fontSize: fontSize.sm,
      color: colors.muted,
    },
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
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; pointsValue?: string }>({});
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  useEffect(() => {
    if (!activeGroupId) return;
    listGroupMembers(activeGroupId).then(setMembers).catch(() => {});
  }, [activeGroupId]);

  const selectedMember = members.find((m) => m.userId === assignedTo) ?? null;

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
        assignedTo,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la tarea.");
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId, title, description, pointsValue, requiresProof, assignedTo, validate, navigation]);

  const handleSelectMember = useCallback((userId: string | null) => {
    setAssignedTo(userId);
    setShowMemberPicker(false);
  }, []);

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

        {/* Asignar a */}
        {members.length > 0 && (
          <View style={s.fieldWrap}>
            <Text style={s.label}>Asignar a</Text>
            <Pressable
              style={({ pressed }) => [s.pickerBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setShowMemberPicker(true)}
              disabled={isLoading}
            >
              <Text style={selectedMember ? s.pickerBtnText : s.pickerBtnPlaceholder}>
                {selectedMember ? selectedMember.displayName : "Sin asignar (cualquiera puede hacerla)"}
              </Text>
              <Text style={s.pickerChevron}>▾</Text>
            </Pressable>
          </View>
        )}

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

      {/* Modal selector de miembro */}
      <Modal
        visible={showMemberPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberPicker(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setShowMemberPicker(false)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <Text style={s.modalTitle}>Asignar tarea a</Text>

            <ScrollView>
              {/* Opción sin asignar */}
              <Pressable
                style={({ pressed }) => [s.noneRow, !assignedTo && s.memberRowSelected, pressed && { opacity: 0.7 }]}
                onPress={() => handleSelectMember(null)}
              >
                <Text style={[s.noneText, !assignedTo && { color: theme.colors.primary, fontWeight: "600" as any }]}>
                  Sin asignar
                </Text>
              </Pressable>
              <View style={s.divider} />

              {members.map((member, index) => (
                <View key={member.userId}>
                  <Pressable
                    style={({ pressed }) => [
                      s.memberRow,
                      assignedTo === member.userId && s.memberRowSelected,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleSelectMember(member.userId)}
                  >
                    <Text style={[s.memberName, assignedTo === member.userId && s.memberNameSelected]}>
                      {member.displayName}
                    </Text>
                    {assignedTo === member.userId && (
                      <Text style={s.memberCheck}>✓</Text>
                    )}
                  </Pressable>
                  {index < members.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
