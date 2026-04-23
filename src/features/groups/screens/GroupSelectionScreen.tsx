import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { GroupStackParamList } from "../../../app/navigation/types";
import { useGroups } from "../hooks/useGroups";
import { Button } from "../../../components/ui/Button";

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
      className="bg-card border border-border rounded-xl p-4 mb-3 flex-row items-center gap-3 active:opacity-75"
      onPress={() => selectGroup(item.id, item.name)}
    >
      <View className="w-[42px] h-[42px] rounded-full bg-primary/15 items-center justify-center">
        <Text className="text-base font-sans-bold text-primary">
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-sans-semibold text-foreground mb-[2px]">{item.name}</Text>
        <Text className="text-[11px] text-muted-foreground">Código: {item.invite_code}</Text>
      </View>
      {item.my_role ? (
        <View className="bg-primary/15 rounded-full px-2" style={{ paddingVertical: 2 }}>
          <Text className="text-[11px] font-sans-medium text-primary">
            {ROLE_LABELS[item.my_role] ?? item.my_role}
          </Text>
        </View>
      ) : null}
    </Pressable>
  ), [selectGroup]);

  return (
    <View className="flex-1 bg-background px-6">
      <View className="items-center pt-10 pb-6">
        <Text className="text-[22px] font-sans-bold text-foreground mb-1">
          Selecciona un grupo
        </Text>
        <Text className="text-sm font-sans text-muted-foreground text-center">
          Elige un grupo existente o crea uno nuevo.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 16 }} />
      ) : null}
      {error ? (
        <Text className="text-destructive text-xs text-center mb-3 font-sans">{error}</Text>
      ) : null}
      {!isLoading && !error && groups.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center mb-4">
          Aún no perteneces a ningún grupo.
        </Text>
      ) : null}

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        scrollEnabled={groups.length > 4}
        renderItem={renderGroupItem}
      />

      <View className="h-px bg-border my-4" />
      <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] text-center mb-3">
        Más opciones
      </Text>

      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Button
            label="Crear grupo"
            onPress={() => navigation.navigate("CreateGroup")}
            variant="primary"
            size="md"
          />
        </View>
        <View className="flex-1">
          <Button
            label="Unirse"
            onPress={() => navigation.navigate("JoinGroup")}
            variant="secondary"
            size="md"
          />
        </View>
      </View>

      <Pressable
        className="self-center py-2 px-4 active:opacity-60"
        onPress={reload}
      >
        <Text className="text-xs text-muted-foreground underline">Recargar grupos</Text>
      </Pressable>
    </View>
  );
}
