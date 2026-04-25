import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import shadows from "../../../../design-system-rn/tokens/shadows";
import { Button, GameBadge } from "../../../../design-system-rn/components";
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
      if (!manager) {
        setRewards([]);
        return;
      }
      const data = await listGroupRewards(activeGroupId, true);
      setRewards(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la gestión de premios.",
      );
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
    if (!trimmed) {
      setError("El nombre del premio es obligatorio.");
      return;
    }
    const parsed = Number(costPoints);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setError("El costo debe ser un número entero mayor a 0.");
      return;
    }
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
      setError(
        err instanceof Error ? err.message : "No se pudo crear el premio.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [activeGroupId, title, costPoints, loadData]);

  const handleToggle = useCallback(
    async (item: Reward) => {
      if (!activeGroupId) return;
      try {
        setError("");
        setSuccessMessage("");
        await setRewardActive(activeGroupId, item.id, !item.active);
        setSuccessMessage(!item.active ? "Premio activado." : "Premio desactivado.");
        await loadData();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo actualizar el premio.",
        );
      }
    },
    [activeGroupId, loadData],
  );

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

  const handleSaveEdit = useCallback(
    async (item: Reward) => {
      if (!activeGroupId) return;
      const trimmed = editTitle.trim();
      if (!trimmed) {
        setError("El nombre del premio es obligatorio.");
        return;
      }
      const parsed = Number(editCostPoints);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setError("El costo debe ser un número entero mayor a 0.");
        return;
      }
      try {
        setError("");
        setSuccessMessage("");
        setIsSaving(true);
        await updateReward(activeGroupId, item.id, {
          title: trimmed,
          costPoints: parsed,
        });
        setSuccessMessage("Premio actualizado correctamente.");
        cancelEditing();
        await loadData();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo actualizar el premio.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [activeGroupId, editTitle, editCostPoints, cancelEditing, loadData],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!canManage) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Ionicons name="lock-closed-outline" size={26} color={colors.muted} />
        </View>
        <Text className="text-center font-sans text-sm text-muted-foreground">
          Solo owner o sub_owner puede gestionar el catálogo de premios.
        </Text>
      </View>
    );
  }

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
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Form crear */}
            <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Nuevo premio
            </Text>
            <View
              style={shadows.card}
              className="mb-2 rounded-2xl border border-border bg-card p-4"
            >
              <TextInput
                value={title}
                onChangeText={setTitle}
                className="mb-3 rounded-xl border border-border bg-background px-3 py-3 font-sans text-sm text-foreground"
                placeholder="Nombre del premio"
                placeholderTextColor={colors.muted}
                editable={!isSaving}
              />
              <TextInput
                value={costPoints}
                onChangeText={setCostPoints}
                className="mb-3 rounded-xl border border-border bg-background px-3 py-3 font-sans text-sm text-foreground"
                keyboardType="numeric"
                placeholder="Costo en puntos"
                placeholderTextColor={colors.muted}
                editable={!isSaving}
              />
              <Button
                label={isSaving ? "Guardando..." : "Crear premio"}
                variant="primary"
                size="md"
                fullWidth
                disabled={isSaving}
                onPress={handleCreate}
                iconLeft={
                  isSaving ? undefined : (
                    <Ionicons name="add" size={16} color={colors.primaryText} />
                  )
                }
              />
            </View>

            {error ? (
              <View className="mb-3 mt-1 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                <Text className="text-center font-sans-medium text-sm text-destructive">
                  {error}
                </Text>
              </View>
            ) : null}
            {successMessage ? (
              <View className="mb-3 mt-1 rounded-xl border border-success/30 bg-success/10 p-3">
                <Text className="text-center font-sans-medium text-sm text-success">
                  {successMessage}
                </Text>
              </View>
            ) : null}

            <Text className="mb-3 mt-5 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Catálogo actual
            </Text>
            {rewards.length === 0 ? (
              <Text className="font-sans text-sm text-muted-foreground">
                Aún no hay premios creados.
              </Text>
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const isEditing = editingRewardId === item.id;

          if (isEditing) {
            return (
              <View
                style={shadows.card}
                className="mb-3 rounded-2xl border border-border bg-card p-4"
              >
                <Text className="mb-3 font-sans-semibold text-sm text-foreground">
                  Editando premio
                </Text>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  className="mb-3 rounded-xl border border-border bg-background px-3 py-3 font-sans text-sm text-foreground"
                  placeholder="Nombre del premio"
                  placeholderTextColor={colors.muted}
                  editable={!isSaving}
                />
                <TextInput
                  value={editCostPoints}
                  onChangeText={setEditCostPoints}
                  className="mb-3 rounded-xl border border-border bg-background px-3 py-3 font-sans text-sm text-foreground"
                  keyboardType="numeric"
                  placeholder="Costo en puntos"
                  placeholderTextColor={colors.muted}
                  editable={!isSaving}
                />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      label={isSaving ? "Guardando..." : "Guardar"}
                      variant="primary"
                      size="md"
                      fullWidth
                      disabled={isSaving}
                      onPress={() => handleSaveEdit(item)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Cancelar"
                      variant="outline"
                      size="md"
                      fullWidth
                      disabled={isSaving}
                      onPress={cancelEditing}
                    />
                  </View>
                </View>
              </View>
            );
          }

          return (
            <View
              style={[shadows.card, !item.active && { opacity: 0.55 }]}
              className="mb-3 rounded-2xl border border-border bg-card p-4"
            >
              <View className="mb-3 flex-row items-start justify-between gap-2">
                <Text
                  className="flex-1 font-sans-semibold text-base text-foreground"
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <GameBadge type="points" value={`${item.costPoints} pts`} size="sm" />
              </View>

              <View className="mb-3 flex-row items-center gap-1.5">
                <View
                  className={`h-1.5 w-1.5 rounded-full ${item.active ? "bg-success" : "bg-muted-foreground"}`}
                />
                <Text className="font-sans-medium text-xs text-muted-foreground">
                  {item.active ? "Activo" : "Inactivo"}
                </Text>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label="Editar"
                    variant="outline"
                    size="sm"
                    fullWidth
                    onPress={() => startEditing(item)}
                    iconLeft={
                      <Ionicons
                        name="pencil-outline"
                        size={13}
                        color={colors.text}
                      />
                    }
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label={item.active ? "Desactivar" : "Activar"}
                    variant={item.active ? "destructive" : "secondary"}
                    size="sm"
                    fullWidth
                    onPress={() => handleToggle(item)}
                  />
                </View>
              </View>
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}
