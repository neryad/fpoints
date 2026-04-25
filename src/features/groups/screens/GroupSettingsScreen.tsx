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
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import shadows from "../../../../design-system-rn/tokens/shadows";
import { Button } from "../../../../design-system-rn/components";
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Nombre del grupo */}
        <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
          Nombre del grupo
        </Text>
        <View style={shadows.card} className="mb-4 rounded-2xl border border-border bg-card p-4">
          <TextInput
            className={`mb-3 rounded-xl border border-border bg-background px-3 py-3 font-sans text-sm text-foreground ${!isOwner ? "opacity-50" : ""}`}
            value={groupName}
            onChangeText={setGroupName}
            editable={isOwner && !isSaving}
            placeholder="Nombre del grupo"
            placeholderTextColor={colors.muted}
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
          {isOwner ? (
            <Button
              label={isSaving ? "Guardando..." : "Guardar nombre"}
              variant="primary"
              size="md"
              fullWidth
              disabled={isSaving}
              onPress={handleSaveName}
              iconLeft={
                isSaving ? undefined : (
                  <Ionicons name="checkmark" size={16} color={colors.primaryText} />
                )
              }
            />
          ) : null}
        </View>

        {/* Código de invitación */}
        <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
          Código de invitación
        </Text>
        <View style={shadows.card} className="mb-4 rounded-2xl border border-border bg-card p-4">
          <View className="rounded-xl bg-primary/10 py-4 items-center mb-3">
            <Text
              className="font-sans-bold text-[26px] text-primary"
              style={{ letterSpacing: 6 }}
              selectable
            >
              {inviteCode}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
            <Text className="font-sans text-[11px] text-muted-foreground flex-1">
              Comparte este código para que otros se unan al grupo.
            </Text>
          </View>
        </View>

        {/* Agregar miembro sin email (solo owners) */}
        {isOwner ? (
          <>
            <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Miembro sin email
            </Text>
            <View style={shadows.card} className="mb-4 rounded-2xl border border-border bg-card p-4">
              <Pressable
                className="flex-row items-center justify-between active:opacity-80"
                onPress={() => { setShowChildForm((v) => !v); setChildError(""); setChildSuccess(""); }}
                accessibilityRole="button"
                accessibilityLabel="Agregar miembro sin email"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="person-add-outline" size={16} color={colors.primary} />
                  <Text className="font-sans-medium text-sm text-foreground">
                    Agregar miembro sin email
                  </Text>
                </View>
                <Ionicons
                  name={showChildForm ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.muted}
                />
              </Pressable>

              {showChildForm ? (
                <View className="mt-4 gap-3">
                  <TextInput
                    className="rounded-xl border border-border bg-background px-3 py-3 font-sans text-sm text-foreground"
                    value={childDisplayName}
                    onChangeText={setChildDisplayName}
                    placeholder="Nombre visible (ej: Ana)"
                    placeholderTextColor={colors.muted}
                    editable={!isSavingChild}
                  />
                  <TextInput
                    className="rounded-xl border border-border bg-background px-3 py-3 font-sans text-sm text-foreground"
                    value={childUsername}
                    onChangeText={(t) => setChildUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="Nombre de usuario (ej: ana)"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSavingChild}
                  />
                  <TextInput
                    className="rounded-xl border border-border bg-background px-3 py-3 font-sans text-sm text-foreground"
                    value={childPin}
                    onChangeText={setChildPin}
                    placeholder="PIN (4-6 dígitos)"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    editable={!isSavingChild}
                  />
                  {childError ? (
                    <View className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                      <Text className="font-sans-medium text-sm text-destructive">{childError}</Text>
                    </View>
                  ) : null}
                  {childSuccess ? (
                    <View className="rounded-xl border border-success/30 bg-success/10 p-3">
                      <Text className="font-sans-medium text-sm text-success">{childSuccess}</Text>
                    </View>
                  ) : null}
                  <Button
                    label={isSavingChild ? "Creando..." : "Crear invitación"}
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={isSavingChild}
                    onPress={handleCreateChild}
                    iconLeft={
                      isSavingChild ? undefined : (
                        <Ionicons name="add" size={16} color={colors.primaryText} />
                      )
                    }
                  />
                </View>
              ) : (
                <Text className="mt-3 font-sans text-[11px] text-muted-foreground">
                  Crea acceso por usuario y PIN para miembros que no tienen correo.
                </Text>
              )}
            </View>
          </>
        ) : null}

        {/* Miembros */}
        <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
          Miembros ({members.length})
        </Text>
        <View style={shadows.card} className="rounded-2xl border border-border bg-card overflow-hidden">
          {members.map((item, idx) => {
            const isElevated = item.role === "owner" || item.role === "sub_owner";
            const initial = (item.displayName ?? "?").charAt(0).toUpperCase();
            return (
              <Pressable
                key={item.userId}
                className={`flex-row items-center gap-3 px-4 py-3 active:opacity-70 ${idx > 0 ? "border-t border-border" : ""}`}
                onPress={() => navigation.navigate("MemberDashboard", {
                  memberId: item.userId,
                  memberName: item.displayName,
                  memberRole: item.role,
                })}
                accessibilityRole="button"
                accessibilityLabel={`Ver miembro ${item.displayName}`}
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                  <Text className="font-sans-bold text-xs text-primary">{initial}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-sans-medium text-sm text-foreground">{item.displayName}</Text>
                </View>
                <View className={`rounded-full px-2.5 py-0.5 ${isElevated ? "bg-primary/15" : "bg-muted"}`}>
                  <Text className={`font-sans-medium text-[11px] ${isElevated ? "text-primary" : "text-muted-foreground"}`}>
                    {ROLE_LABELS[item.role] ?? item.role}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
