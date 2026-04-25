import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import shadows from "../../../../design-system-rn/tokens/shadows";
import { Button } from "../../../../design-system-rn/components";
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

export function GroupSelectionScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { selectGroup } = useAppSession();
  const { groups, isLoading, error, reload } = useGroups();

  const renderGroupItem = useCallback(({ item }: { item: typeof groups[0] }) => (
    <Pressable
      style={shadows.card}
      className="mb-3 rounded-2xl border border-border bg-card p-4 flex-row items-center gap-3 active:opacity-75"
      onPress={() => selectGroup(item.id, item.name)}
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar grupo ${item.name}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/15">
        <Text className="font-sans-bold text-base text-primary">
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-sans-semibold text-base text-foreground mb-0.5">{item.name}</Text>
        <Text className="font-sans text-[11px] text-muted-foreground">Código: {item.invite_code}</Text>
      </View>
      {item.my_role ? (
        <View className="rounded-full bg-primary/15 px-2.5 py-0.5">
          <Text className="font-sans-medium text-[11px] text-primary">
            {ROLE_LABELS[item.my_role] ?? item.my_role}
          </Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  ), [selectGroup, colors.muted]);

  return (
    <View className="flex-1 bg-background px-5">
      <View className="items-center pt-10 pb-6">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 mb-4">
          <Ionicons name="people-circle-outline" size={30} color={colors.primary} />
        </View>
        <Text className="font-sans-bold text-[22px] text-foreground mb-1">
          Selecciona un grupo
        </Text>
        <Text className="font-sans text-sm text-muted-foreground text-center">
          Elige un grupo existente o crea uno nuevo.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 16 }} />
      ) : null}

      {error ? (
        <View className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
          <Text className="font-sans-medium text-center text-sm text-destructive">{error}</Text>
        </View>
      ) : null}

      {!isLoading && !error && groups.length === 0 ? (
        <View className="items-center py-8">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
            <Ionicons name="folder-open-outline" size={28} color={colors.muted} />
          </View>
          <Text className="font-sans text-sm text-muted-foreground text-center">
            Aún no perteneces a ningún grupo.
          </Text>
        </View>
      ) : null}

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        scrollEnabled={groups.length > 4}
        renderItem={renderGroupItem}
        showsVerticalScrollIndicator={false}
      />

      <View className="h-px bg-border my-2" />
      <Text className="font-sans-medium text-[11px] text-muted-foreground uppercase tracking-widest text-center mb-3">
        Más opciones
      </Text>

      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Button
            label="Crear grupo"
            onPress={() => navigation.navigate("CreateGroup")}
            variant="primary"
            size="md"
            fullWidth
            iconLeft={<Ionicons name="add" size={16} color={colors.primaryText} />}
          />
        </View>
        <View className="flex-1">
          <Button
            label="Unirse"
            onPress={() => navigation.navigate("JoinGroup")}
            variant="outline"
            size="md"
            fullWidth
            iconLeft={<Ionicons name="enter-outline" size={16} color={colors.text} />}
          />
        </View>
      </View>

      <Button
        label="Recargar"
        variant="ghost"
        size="sm"
        onPress={reload}
        iconLeft={<Ionicons name="refresh-outline" size={14} color={colors.muted} />}
      />
    </View>
  );
}
