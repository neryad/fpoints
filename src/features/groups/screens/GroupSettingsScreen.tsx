import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { getMyRoleInGroup } from "../../tasks/services/tasks.service";
import {
  createChildInvitation,
  getGroupDetails,
  listGroupMembers,
  updateGroupName,
  type GroupMember,
} from "../services/groups.service";

type Props = NativeStackScreenProps<ProfileStackParamList, "GroupSettings">;

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  sub_owner: "Sub-propietario",
  member: "Miembro",
};

export function GroupSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { activeGroupId } = useAppSession();

  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showChildForm, setShowChildForm] = useState(false);
  const [childUsername, setChildUsername] = useState("");
  const [childPin, setChildPin] = useState("");
  const [childDisplayName, setChildDisplayName] = useState("");
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [childError, setChildError] = useState("");
  const [childSuccess, setChildSuccess] = useState("");

  const loadData = useCallback(async () => {
    if (!activeGroupId) { setIsLoading(false); return; }
    try {
      setError("");
      setIsLoading(true);
      const [details, role, memberList] = await Promise.all([
        getGroupDetails(activeGroupId),
        getMyRoleInGroup(activeGroupId),
        listGroupMembers(activeGroupId),
      ]);
      setGroupName(details.name);
      setInviteCode(details.invite_code);
      setIsOwner(role === "owner");
      setMembers(memberList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la configuración.");
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const handleCreateChild = useCallback(async () => {
    if (!activeGroupId) return;
    try {
      setChildError("");
      setChildSuccess("");
      setIsSavingChild(true);
      await createChildInvitation(childUsername, childPin, childDisplayName, activeGroupId);
      setChildSuccess(`¡Invitación creada! El niño puede entrar con usuario "${childUsername.trim().toLowerCase()}" y su PIN.`);
      setChildUsername("");
      setChildPin("");
      setChildDisplayName("");
    } catch (err) {
      setChildError(err instanceof Error ? err.message : "No se pudo crear la invitación.");
    } finally {
      setIsSavingChild(false);
    }
  }, [activeGroupId, childUsername, childPin, childDisplayName]);

  const handleSaveName = useCallback(async () => {
    if (!activeGroupId) return;
    try {
      setError("");
      setSuccessMessage("");
      setIsSaving(true);
      await updateGroupName(activeGroupId, groupName);
      setSuccessMessage("Nombre actualizado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el nombre.");
    } finally {
      setIsSaving(false);
    }
  }, [activeGroupId, groupName]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const inputClass = "bg-background border border-border rounded-lg px-3 py-3 text-sm text-foreground mb-3";
  const cardLabel = "text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-3";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      className="bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Nombre del grupo */}
        <View className="bg-card border border-border rounded-xl p-4 mb-3">
          <Text className={cardLabel}>Nombre del grupo</Text>
          <TextInput
            className={`${inputClass} ${!isOwner ? "opacity-50" : ""}`}
            value={groupName}
            onChangeText={setGroupName}
            editable={isOwner && !isSaving}
            placeholder="Nombre del grupo"
            placeholderTextColor={colors.muted}
          />
          {isOwner ? (
            <Pressable
              className={`bg-primary rounded-xl py-3 items-center active:opacity-80 ${isSaving ? "opacity-40" : ""}`}
              onPress={handleSaveName}
              disabled={isSaving}
            >
              <Text className="text-sm font-sans-bold text-primary-foreground">
                {isSaving ? "Guardando..." : "Guardar nombre"}
              </Text>
            </Pressable>
          ) : null}
          {error ? <Text className="text-destructive text-xs text-center mt-2 font-sans">{error}</Text> : null}
          {successMessage ? <Text className="text-success text-xs text-center mt-2 font-sans">{successMessage}</Text> : null}
        </View>

        {/* Código de invitación */}
        <View className="bg-card border border-border rounded-xl p-4 mb-3">
          <Text className={cardLabel}>Código de invitación</Text>
          <View className="bg-primary/15 rounded-xl py-4 items-center mb-2">
            <Text
              className="text-[26px] font-sans-bold text-primary"
              style={{ letterSpacing: 6 }}
              selectable
            >
              {inviteCode}
            </Text>
          </View>
          <Text className="text-[11px] text-muted-foreground text-center">
            Comparte este código para que otros se unan al grupo.
          </Text>
        </View>

        {/* Agregar niño (solo owners) */}
        {isOwner ? (
          <View className="bg-card border border-border rounded-xl p-4 mb-3">
            <Pressable
              className="flex-row items-center justify-between active:opacity-80"
              onPress={() => { setShowChildForm((v) => !v); setChildError(""); setChildSuccess(""); }}
            >
              <Text className={cardLabel}>Agregar miembro sin email</Text>
              <Text className="text-xs text-primary">
                {showChildForm ? "Cancelar" : "+ Nuevo"}
              </Text>
            </Pressable>

            {showChildForm ? (
              <View className="mt-3 gap-3">
                <TextInput
                  className={inputClass}
                  value={childDisplayName}
                  onChangeText={setChildDisplayName}
                  placeholder="Nombre visible (ej: Ana)"
                  placeholderTextColor={colors.muted}
                  editable={!isSavingChild}
                />
                <TextInput
                  className={inputClass}
                  value={childUsername}
                  onChangeText={(t) => setChildUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="Nombre de usuario (ej: ana)"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSavingChild}
                />
                <TextInput
                  className={inputClass}
                  value={childPin}
                  onChangeText={setChildPin}
                  placeholder="PIN (4-6 dígitos)"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  editable={!isSavingChild}
                />
                {childError ? <Text className="text-destructive text-xs font-sans">{childError}</Text> : null}
                {childSuccess ? <Text className="text-success text-xs font-sans">{childSuccess}</Text> : null}
                <Pressable
                  className={`bg-primary rounded-xl py-3 items-center active:opacity-80 ${isSavingChild ? "opacity-40" : ""}`}
                  onPress={handleCreateChild}
                  disabled={isSavingChild}
                >
                  <Text className="text-sm font-sans-bold text-primary-foreground">
                    {isSavingChild ? "Creando..." : "Crear invitación"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text className="text-[11px] text-muted-foreground mt-2">
                Crea acceso por usuario y PIN para niños que no tienen correo.
              </Text>
            )}
          </View>
        ) : null}

        {/* Miembros */}
        <View className="bg-card border border-border rounded-xl p-4 mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className={cardLabel}>Miembros</Text>
            <Text className="text-[11px] font-sans-medium text-muted-foreground">
              {members.length} en total
            </Text>
          </View>
          {members.map((item, idx) => {
            const isElevated = item.role === "owner" || item.role === "sub_owner";
            const initial = (item.displayName ?? "?").charAt(0).toUpperCase();
            return (
              <Pressable
                key={item.userId}
                className={`flex-row items-center gap-3 py-3 active:opacity-70 ${idx > 0 ? "border-t border-border" : ""}`}
                onPress={() => navigation.navigate("MemberDashboard", {
                  memberId: item.userId,
                  memberName: item.displayName,
                  memberRole: item.role,
                })}
              >
                <View className="w-[34px] h-[34px] rounded-full bg-primary/15 items-center justify-center">
                  <Text className="text-xs font-sans-bold text-primary">{initial}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-sans-medium text-foreground">{item.displayName}</Text>
                </View>
                <View className={`rounded-full px-2 ${isElevated ? "bg-primary/15" : "bg-muted"}`} style={{ paddingVertical: 2 }}>
                  <Text className={`text-[11px] font-sans-medium ${isElevated ? "text-primary" : "text-muted-foreground"}`}>
                    {ROLE_LABELS[item.role] ?? item.role}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
