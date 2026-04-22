import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { GroupStackParamList } from "../../../app/navigation/types";
import { useGroups } from "../hooks/useGroups";

type Props = NativeStackScreenProps<GroupStackParamList, "GroupSelection">;

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  sub_owner: "Sub-propietario",
  member: "Miembro",
};

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing[6],             // 24
    },
    hero: {
      alignItems: "center",
      paddingTop: spacing[8],          // 40
      paddingBottom: spacing[6],       // 24
    },
    title: {
      fontSize: fontSize.xl,           // 22
      fontWeight: fontWeight.bold,
      color: colors.textStrong,
      marginBottom: spacing[1],
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.muted,
      textAlign: "center",
    },
    listContent: {
      paddingBottom: spacing[4],
    },
    groupCard: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,         // 16
      padding: spacing[4],             // 16
      marginBottom: spacing[3],        // 12
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    groupAvatar: {
      width: 42,
      height: 42,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    groupAvatarText: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    groupInfo: { flex: 1 },
    groupName: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
      color: colors.textStrong,
      marginBottom: 2,
    },
    groupMeta: {
      fontSize: fontSize.xxs,
      color: colors.muted,
    },
    rolePill: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: 2,
    },
    rolePillText: {
      fontSize: fontSize.xxs,
      fontWeight: fontWeight.medium,
      color: colors.primary,
    },
    infoText: {
      fontSize: fontSize.sm,
      color: colors.muted,
      textAlign: "center",
      marginBottom: spacing[4],
    },
    errorText: {
      fontSize: fontSize.xs,
      color: colors.error,
      textAlign: "center",
      marginBottom: spacing[3],
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.border,
      marginVertical: spacing[4],
    },
    actionsLabel: {
      fontSize: fontSize.xxs,
      fontWeight: fontWeight.medium,
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: spacing[3],
    },
    actionsRow: {
      flexDirection: "row",
      gap: spacing[3],
      marginBottom: spacing[3],
    },
    btnPrimary: {
      flex: 1,
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
    btnSecondary: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing[3],
      alignItems: "center",
    },
    btnSecondaryText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    reloadBtn: {
      alignSelf: "center",
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[4],
    },
    reloadBtnText: {
      fontSize: fontSize.xs,
      color: colors.muted,
      textDecorationLine: "underline",
    },
  });
}

export function GroupSelectionScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { selectGroup } = useAppSession();
  const { groups, isLoading, error, reload } = useGroups();

  const renderGroupItem = useCallback(({ item }: { item: typeof groups[0] }) => (
    <Pressable
      style={({ pressed }) => [s.groupCard, pressed && { opacity: 0.75 }]}
      onPress={() => selectGroup(item.id, item.name)}
    >
      <View style={s.groupAvatar}>
        <Text style={s.groupAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={s.groupInfo}>
        <Text style={s.groupName}>{item.name}</Text>
        <Text style={s.groupMeta}>Código: {item.invite_code}</Text>
      </View>
      {item.my_role ? (
        <View style={s.rolePill}>
          <Text style={s.rolePillText}>
            {ROLE_LABELS[item.my_role] ?? item.my_role}
          </Text>
        </View>
      ) : null}
    </Pressable>
  ), [s, selectGroup]);

  return (
    <View style={s.container}>
      <View style={s.hero}>
        <Text style={s.title}>Selecciona un grupo</Text>
        <Text style={s.subtitle}>Elige un grupo existente o crea uno nuevo.</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginBottom: theme.spacing[4] }} />
      ) : null}
      {error ? <Text style={s.errorText}>{error}</Text> : null}
      {!isLoading && !error && groups.length === 0 ? (
        <Text style={s.infoText}>Aún no perteneces a ningún grupo.</Text>
      ) : null}

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        scrollEnabled={groups.length > 4}
        renderItem={renderGroupItem}
      />

      <View style={s.divider} />
      <Text style={s.actionsLabel}>Más opciones</Text>

      <View style={s.actionsRow}>
        <Pressable
          style={({ pressed }) => [s.btnPrimary, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate("CreateGroup")}
        >
          <Text style={s.btnPrimaryText}>Crear grupo</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.btnSecondary, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.navigate("JoinGroup")}
        >
          <Text style={s.btnSecondaryText}>Unirse</Text>
        </Pressable>
      </View>

      <Pressable style={({ pressed }) => [s.reloadBtn, pressed && { opacity: 0.6 }]} onPress={reload}>
        <Text style={s.reloadBtnText}>Recargar grupos</Text>
      </Pressable>
    </View>
  );
}