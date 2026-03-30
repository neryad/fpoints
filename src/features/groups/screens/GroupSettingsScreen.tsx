import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
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

export function GroupSettingsScreen({ navigation }: Props) {
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
    if (!activeGroupId) {
      setIsLoading(false);
      return;
    }

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
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la configuración del grupo.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  async function handleSaveName() {
    if (!activeGroupId) return;

    try {
      setError("");
      setSuccessMessage("");
      setIsSaving(true);
      await updateGroupName(activeGroupId, groupName);
      setSuccessMessage("Nombre actualizado correctamente.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el nombre.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Nombre del grupo</Text>
      <TextInput
        style={[styles.input, !isOwner && styles.inputDisabled]}
        value={groupName}
        onChangeText={setGroupName}
        editable={isOwner && !isSaving}
        placeholder="Nombre del grupo"
      />
      {isOwner ? (
        <Button
          title={isSaving ? "Guardando..." : "Guardar nombre"}
          onPress={handleSaveName}
          disabled={isSaving}
        />
      ) : null}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Código de invitación</Text>
      <View style={styles.codeBox}>
        <Text style={styles.codeText} selectable>
          {inviteCode}
        </Text>
      </View>
      <Text style={styles.hint}>
        Comparte este código para que otros se unan al grupo.
      </Text>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Miembros ({members.length})</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <Text style={styles.memberName}>{item.displayName}</Text>
            <Text style={styles.memberRole}>
              {ROLE_LABELS[item.role] ?? item.role}
            </Text>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  container: {
    backgroundColor: colors.background,
    padding: 24,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  input: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: colors.text,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  codeBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    alignItems: "center",
  },
  codeText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 4,
    color: colors.primary,
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 4,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  memberName: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  memberRole: {
    fontSize: 13,
    color: colors.muted,
    marginLeft: 8,
  },
  errorText: {
    color: "#B42318",
    marginBottom: 12,
    textAlign: "center",
  },
  successText: {
    color: "#0B6E4F",
    marginBottom: 12,
    textAlign: "center",
  },
});
