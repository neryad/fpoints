import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import {
  canManageRewards,
  createReward,
  listGroupRewards,
  setRewardActive,
  updateReward,
} from "../services/rewards.service";
import type { Reward } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "ManageRewards">;

export function ManageRewardsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { activeGroupId } = useAppSession();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [title, setTitle] = useState("");
  const [costPoints, setCostPoints] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCostPoints, setEditCostPoints] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!activeGroupId) {
      setRewards([]);
      setCanManage(false);
      setIsLoading(false);
      return;
    }
    try {
      setError("");
      setSuccessMessage("");
      setIsLoading(true);
      const manager = await canManageRewards(activeGroupId);
      setCanManage(manager);
      if (!manager) { setRewards([]); return; }
      const data = await listGroupRewards(activeGroupId, true);
      setRewards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la gestión de premios.");
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const handleCreate = useCallback(async () => {
    if (!activeGroupId) return;
    const trimmed = title.trim();
    if (!trimmed) { setError("El nombre del premio es obligatorio."); return; }
    const parsed = Number(costPoints);
    if (!Number.isInteger(parsed) || parsed < 1) { setError("El costo debe ser un número entero mayor a 0."); return; }
    try {
      setError("");
      setSuccessMessage("");
      setIsSaving(true);
      await createReward(activeGroupId, { title: trimmed, costPoints: parsed });
      setTitle("");
      setCostPoints("");
      setSuccessMessage("Premio creado correctamente.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el premio.");
    } finally {
      setIsSaving(false);
    }
  }, [activeGroupId, title, costPoints, loadData]);

  const handleToggle = useCallback(async (item: Reward) => {
    if (!activeGroupId) return;
    try {
      setError("");
      setSuccessMessage("");
      await setRewardActive(activeGroupId, item.id, !item.active);
      setSuccessMessage(!item.active ? "Premio activado." : "Premio desactivado.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el premio.");
    }
  }, [activeGroupId, loadData]);

  const startEditing = useCallback((item: Reward) => {
    setError("");
    setSuccessMessage("");
    setEditingRewardId(item.id);
    setEditTitle(item.title);
    setEditCostPoints(String(item.costPoints));
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingRewardId(null);
    setEditTitle("");
    setEditCostPoints("");
  }, []);

  const handleSaveEdit = useCallback(async (item: Reward) => {
    if (!activeGroupId) return;
    const trimmed = editTitle.trim();
    if (!trimmed) { setError("El nombre del premio es obligatorio."); return; }
    const parsed = Number(editCostPoints);
    if (!Number.isInteger(parsed) || parsed < 1) { setError("El costo debe ser un número entero mayor a 0."); return; }
    try {
      setError("");
      setSuccessMessage("");
      setIsSaving(true);
      await updateReward(activeGroupId, item.id, { title: trimmed, costPoints: parsed });
      setSuccessMessage("Premio actualizado correctamente.");
      cancelEditing();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el premio.");
    } finally {
      setIsSaving(false);
    }
  }, [activeGroupId, editTitle, editCostPoints, cancelEditing, loadData]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!canManage) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-sm text-muted-foreground text-center">
          Solo owner o sub_owner puede gestionar el catálogo de premios.
        </Text>
      </View>
    );
  }

  const inputClass = "bg-background border border-border rounded-lg px-3 py-3 mb-2 text-sm text-foreground";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-3">
              Crear premio
            </Text>
            <View className="bg-card border border-border rounded-xl p-4 mb-2">
              <TextInput
                value={title}
                onChangeText={setTitle}
                className={inputClass}
                placeholder="Nombre del premio"
                placeholderTextColor={colors.muted}
                editable={!isSaving}
              />
              <TextInput
                value={costPoints}
                onChangeText={setCostPoints}
                className={inputClass}
                keyboardType="numeric"
                placeholder="Costo en puntos"
                placeholderTextColor={colors.muted}
                editable={!isSaving}
              />
              <Pressable
                className={`bg-primary rounded-xl py-3 items-center mt-1 active:opacity-80 ${isSaving ? "opacity-40" : ""}`}
                onPress={handleCreate}
                disabled={isSaving}
              >
                <Text className="text-sm font-sans-bold text-primary-foreground">
                  {isSaving ? "Guardando..." : "Crear premio"}
                </Text>
              </Pressable>
            </View>

            {(error || successMessage) ? (
              <View className="mt-3">
                {error ? <Text className="text-destructive text-xs text-center font-sans">{error}</Text> : null}
                {successMessage ? <Text className="text-success text-xs text-center font-sans">{successMessage}</Text> : null}
              </View>
            ) : null}

            <Text className="text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-3 mt-5">
              Catálogo actual
            </Text>
            {rewards.length === 0 ? (
              <Text className="text-sm text-muted-foreground">Aún no hay premios creados.</Text>
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const isEditing = editingRewardId === item.id;

          if (isEditing) {
            return (
              <View className="bg-card border border-border rounded-xl p-4 mb-3">
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  className={inputClass}
                  placeholder="Nombre del premio"
                  placeholderTextColor={colors.muted}
                  editable={!isSaving}
                />
                <TextInput
                  value={editCostPoints}
                  onChangeText={setEditCostPoints}
                  className={inputClass}
                  keyboardType="numeric"
                  placeholder="Costo en puntos"
                  placeholderTextColor={colors.muted}
                  editable={!isSaving}
                />
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    className={`flex-1 bg-primary rounded-xl py-3 items-center active:opacity-80 ${isSaving ? "opacity-40" : ""}`}
                    onPress={() => handleSaveEdit(item)}
                    disabled={isSaving}
                  >
                    <Text className="text-sm font-sans-bold text-primary-foreground">
                      {isSaving ? "Guardando..." : "Guardar"}
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 bg-muted border border-border rounded-xl py-3 items-center active:opacity-70 ${isSaving ? "opacity-40" : ""}`}
                    onPress={cancelEditing}
                    disabled={isSaving}
                  >
                    <Text className="text-sm font-sans-semibold text-foreground">Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          return (
            <View className={`bg-card border border-border rounded-xl p-4 mb-3 ${!item.active ? "opacity-55" : ""}`}>
              <View className="flex-row justify-between items-start gap-2 mb-2">
                <Text className="flex-1 text-base font-sans-semibold text-foreground">{item.title}</Text>
                <View className="bg-points/15 rounded-full px-2" style={{ paddingVertical: 3 }}>
                  <Text className="text-xs font-sans-bold text-points">{item.costPoints} pts</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1">
                <View className={`w-[6px] h-[6px] rounded-full ${item.active ? "bg-success" : "bg-muted-foreground"}`} />
                <Text className="text-[11px] font-sans-medium text-muted-foreground">
                  {item.active ? "Activo" : "Inactivo"}
                </Text>
              </View>

              <View className="flex-row gap-2 mt-3">
                <Pressable
                  className="flex-1 bg-muted border border-border rounded-xl py-3 items-center active:opacity-70"
                  onPress={() => startEditing(item)}
                >
                  <Text className="text-sm font-sans-semibold text-foreground">Editar</Text>
                </Pressable>
                <Pressable
                  className={`flex-1 border rounded-xl py-3 items-center active:opacity-80 ${
                    item.active
                      ? "bg-destructive/15 border-destructive"
                      : "bg-success/15 border-success"
                  }`}
                  onPress={() => handleToggle(item)}
                >
                  <Text className={`text-sm font-sans-semibold ${item.active ? "text-destructive" : "text-success"}`}>
                    {item.active ? "Desactivar" : "Activar"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}
