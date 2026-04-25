import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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

export function CreateTaskScreen({ navigation }: Props) {
  const { colors } = useTheme();
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
    let isMounted = true;
    listGroupMembers(activeGroupId)
      .then((data) => { if (isMounted) setMembers(data); })
      .catch(() => { if (isMounted) setMembers([]); });
    return () => { isMounted = false; };
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

  const fieldLabel = "text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-2";
  const fieldInput = "bg-card border border-border rounded-lg px-3 py-3 text-sm text-foreground";

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
        {/* Título */}
        <View className="mb-4">
          <Text className={fieldLabel}>Título *</Text>
          <TextInput
            className={`${fieldInput} ${fieldErrors.title ? "border-destructive" : ""}`}
            placeholder="Ej: Lavar los platos"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={(t) => { setTitle(t); setFieldErrors((e) => ({ ...e, title: undefined })); }}
            editable={!isLoading}
          />
          {fieldErrors.title ? (
            <Text className="text-destructive text-[11px] mt-1 font-sans">{fieldErrors.title}</Text>
          ) : null}
        </View>

        {/* Descripción */}
        <View className="mb-4">
          <Text className={fieldLabel}>Descripción</Text>
          <TextInput
            className={fieldInput}
            style={{ height: 88, textAlignVertical: "top" }}
            placeholder="Opcional"
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Puntos */}
        <View className="mb-4">
          <Text className={fieldLabel}>Puntos</Text>
          <TextInput
            className={`${fieldInput} ${fieldErrors.pointsValue ? "border-destructive" : ""}`}
            placeholder="10"
            placeholderTextColor={colors.muted}
            value={pointsValue}
            onChangeText={(t) => { setPointsValue(t); setFieldErrors((e) => ({ ...e, pointsValue: undefined })); }}
            editable={!isLoading}
            keyboardType="numeric"
          />
          {fieldErrors.pointsValue ? (
            <Text className="text-destructive text-[11px] mt-1 font-sans">{fieldErrors.pointsValue}</Text>
          ) : null}
        </View>

        {/* Asignar a */}
        {members.length > 0 && (
          <View className="mb-4">
            <Text className={fieldLabel}>Asignar a</Text>
            <Pressable
              className="bg-card border border-border rounded-lg px-3 py-3 flex-row items-center justify-between active:opacity-80"
              onPress={() => setShowMemberPicker(true)}
              disabled={isLoading}
            >
              <Text className={`text-sm ${selectedMember ? "text-foreground" : "text-muted-foreground"}`}>
                {selectedMember ? selectedMember.displayName : "Sin asignar (cualquiera puede hacerla)"}
              </Text>
              <Text className="text-xs text-muted-foreground">▾</Text>
            </Pressable>
          </View>
        )}

        {/* Switch requiere prueba */}
        <View className="bg-card border border-border rounded-xl p-4 flex-row items-center justify-between mb-4">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-sans-semibold text-foreground mb-[2px]">
              Requiere prueba fotográfica
            </Text>
            <Text className="text-[11px] text-muted-foreground">
              El miembro deberá adjuntar una URL de imagen.
            </Text>
          </View>
          <Switch
            value={requiresProof}
            onValueChange={setRequiresProof}
            disabled={isLoading}
            trackColor={{ true: colors.primary }}
          />
        </View>

        {error ? (
          <Text className="text-destructive text-xs text-center mb-3 font-sans">{error}</Text>
        ) : null}

        <Pressable
          className={`bg-primary rounded-xl py-4 items-center active:opacity-80 ${isLoading ? "opacity-40" : ""}`}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text className="text-base font-sans-bold text-primary-foreground">
            {isLoading ? "Creando..." : "Crear tarea"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal selector de miembro */}
      <Modal
        visible={showMemberPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberPicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
          onPress={() => setShowMemberPicker(false)}
        >
          <Pressable
            className="bg-background rounded-t-[20px] pt-4"
            style={{ paddingBottom: 40, maxHeight: "60%" }}
            onPress={() => {}}
          >
            <Text className="text-base font-sans-semibold text-foreground text-center mb-3 px-4">
              Asignar tarea a
            </Text>
            <ScrollView>
              <Pressable
                className={`px-4 py-3 active:opacity-70 ${!assignedTo ? "bg-primary/10" : ""}`}
                onPress={() => handleSelectMember(null)}
              >
                <Text className={`text-sm ${!assignedTo ? "font-sans-semibold text-primary" : "font-sans text-muted-foreground"}`}>
                  Sin asignar
                </Text>
              </Pressable>
              <View className="h-px bg-border mx-4" />
              {members.map((member, index) => (
                <View key={member.userId}>
                  <Pressable
                    className={`px-4 py-3 flex-row items-center justify-between active:opacity-70 ${assignedTo === member.userId ? "bg-primary/10" : ""}`}
                    onPress={() => handleSelectMember(member.userId)}
                  >
                    <Text className={`text-sm ${assignedTo === member.userId ? "font-sans-semibold text-primary" : "font-sans text-foreground"}`}>
                      {member.displayName}
                    </Text>
                    {assignedTo === member.userId && (
                      <Text className="text-sm text-primary">✓</Text>
                    )}
                  </Pressable>
                  {index < members.length - 1 && <View className="h-px bg-border mx-4" />}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
