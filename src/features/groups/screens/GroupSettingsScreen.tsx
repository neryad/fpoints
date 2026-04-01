import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
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

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;
  return StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    scrollContent: {
      backgroundColor: colors.background,
      padding: spacing[4],             // 16
      paddingBottom: spacing[8],       // 40
    },

    // ── Card ────────────────────────────────────────────────────────────────
    card: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing[4],
      marginBottom: spacing[3],
    },
    cardLabel: {
      fontSize: fontSize.xxs,
      fontWeight: fontWeight.medium,
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: spacing[3],
    },

    // ── Input ────────────────────────────────────────────────────────────────
    input: {
      backgroundColor: colors.background,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      fontSize: fontSize.sm,
      color: colors.text,
      marginBottom: spacing[3],
    },
    inputDisabled: { opacity: 0.5 },

    // ── Invite code ──────────────────────────────────────────────────────────
    codeBox: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      paddingVertical: spacing[4],
      alignItems: "center",
      marginBottom: spacing[2],
    },
    codeText: {
      fontSize: 26,
      fontWeight: fontWeight.bold,
      letterSpacing: 6,
      color: colors.primary,
    },
    hint: {
      fontSize: fontSize.xxs,
      color: colors.muted,
      textAlign: "center",
    },

    // ── Members ──────────────────────────────────────────────────────────────
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingVertical: spacing[3],
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    memberAvatar: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    memberAvatarText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    memberInfo: { flex: 1 },
    memberName: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.textStrong,
    },
    rolePill: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: 2,
    },
    rolePillOwner: {
      backgroundColor: colors.primarySoft,
    },
    rolePillText: {
      fontSize: fontSize.xxs,
      fontWeight: fontWeight.medium,
      color: colors.muted,
    },
    rolePillTextOwner: {
      color: colors.primary,
    },

    // ── Buttons ──────────────────────────────────────────────────────────────
    btnPrimary: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing[3],
      alignItems: "center",
    },
    btnPrimaryText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: colors.primaryText,
    },
    btnDisabled: { opacity: 0.4 },

    // ── Feedback ─────────────────────────────────────────────────────────────
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
    membersHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing[2],
    },
    membersCount: {
      fontSize: fontSize.xxs,
      color: colors.muted,
      fontWeight: fontWeight.medium,
    },
  });
}

export function GroupSettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { activeGroupId } = useAppSession();

  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.scrollContent}>

      {/* ── Nombre ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Nombre del grupo</Text>
        <TextInput
          style={[s.input, !isOwner && s.inputDisabled]}
          value={groupName}
          onChangeText={setGroupName}
          editable={isOwner && !isSaving}
          placeholder="Nombre del grupo"
          placeholderTextColor={theme.colors.muted}
        />
        {isOwner ? (
          <Pressable
            style={({ pressed }) => [s.btnPrimary, isSaving && s.btnDisabled, pressed && !isSaving && { opacity: 0.8 }]}
            onPress={handleSaveName}
            disabled={isSaving}
          >
            <Text style={s.btnPrimaryText}>{isSaving ? "Guardando..." : "Guardar nombre"}</Text>
          </Pressable>
        ) : null}
        {error ? <Text style={[s.errorText, { marginTop: theme.spacing[2], marginBottom: 0 }]}>{error}</Text> : null}
        {successMessage ? <Text style={[s.successText, { marginTop: theme.spacing[2], marginBottom: 0 }]}>{successMessage}</Text> : null}
      </View>

      {/* ── Código de invitación ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Código de invitación</Text>
        <View style={s.codeBox}>
          <Text style={s.codeText} selectable>{inviteCode}</Text>
        </View>
        <Text style={s.hint}>Comparte este código para que otros se unan al grupo.</Text>
      </View>

      {/* ── Miembros ── */}
      <View style={s.card}>
        <View style={s.membersHeader}>
          <Text style={s.cardLabel}>Miembros</Text>
          <Text style={s.membersCount}>{members.length} en total</Text>
        </View>
        {members.map((item, idx) => {
          const isElevated = item.role === "owner" || item.role === "sub_owner";
          const initial = (item.displayName ?? "?").charAt(0).toUpperCase();
          return (
            <View key={item.userId} style={[s.memberRow, idx === 0 && { borderTopWidth: 0 }]}>
              <View style={s.memberAvatar}>
                <Text style={s.memberAvatarText}>{initial}</Text>
              </View>
              <View style={s.memberInfo}>
                <Text style={s.memberName}>{item.displayName}</Text>
              </View>
              <View style={[s.rolePill, isElevated && s.rolePillOwner]}>
                <Text style={[s.rolePillText, isElevated && s.rolePillTextOwner]}>
                  {ROLE_LABELS[item.role] ?? item.role}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

    </ScrollView>
  );
}