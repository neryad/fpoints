import React, { useEffect, useState } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
import { GroupStackParamList } from "../../../app/navigation/types";
import { listMyGroups } from "../services/groups.service";

type Props = NativeStackScreenProps<GroupStackParamList, "GroupSelection">;

type GroupListItem = {
  id: string;
  name: string;
  invite_code: string;
  my_role?: string;
};

export function GroupSelectionScreen({ navigation }: Props) {
  const { selectGroup } = useAppSession();
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGroups() {
    try {
      setError("");
      setIsLoading(true);
      const data = await listMyGroups();
      setGroups(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar grupos.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Group</Text>
      <Text style={styles.subtitle}>
        Choose an existing group or create a new one.
      </Text>

      {isLoading ? (
        <Text style={styles.infoText}>Loading groups...</Text>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isLoading && !error && groups.length === 0 ? (
        <Text style={styles.infoText}>Aún no perteneces a ningún grupo.</Text>
      ) : null}

      {!isLoading &&
        !error &&
        groups.map((group) => (
          <Pressable
            key={group.id}
            style={styles.groupCard}
            onPress={() => selectGroup(group.id, group.name)}
          >
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupMeta}>Code: {group.invite_code}</Text>
            {group.my_role ? (
              <Text style={styles.groupMeta}>Role: {group.my_role}</Text>
            ) : null}
          </Pressable>
        ))}

      <View style={styles.spacer} />

      <Button title="Reload Groups" onPress={loadGroups} />

      <View style={styles.spacer} />

      <Button
        title="Create Group"
        onPress={() => navigation.navigate("CreateGroup")}
      />

      <View style={styles.spacer} />

      <Button
        title="Join Group"
        onPress={() => navigation.navigate("JoinGroup")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.muted,
    textAlign: "center",
  },
  infoText: {
    color: colors.muted,
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    color: "#B42318",
    marginBottom: 12,
    textAlign: "center",
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  groupMeta: {
    marginTop: 4,
    color: colors.muted,
  },
  spacer: {
    height: 12,
  },
});
