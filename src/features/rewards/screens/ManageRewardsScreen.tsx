import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
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
          : "No se pudo cargar la gestion de premios.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  async function handleCreateReward() {
    if (!activeGroupId) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("El nombre del premio es obligatorio.");
      return;
    }
    const parsedCost = Number(costPoints);
    if (!Number.isInteger(parsedCost) || parsedCost < 1) {
      setError("El costo debe ser un número entero mayor a 0.");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setIsSaving(true);
      await createReward(activeGroupId, {
        title: trimmedTitle,
        costPoints: parsedCost,
      });
      setTitle("");
      setCostPoints("");
      setSuccessMessage("Premio creado correctamente.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear premio.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleReward(item: Reward) {
    if (!activeGroupId) return;

    try {
      setError("");
      setSuccessMessage("");
      await setRewardActive(activeGroupId, item.id, !item.active);
      setSuccessMessage(
        !item.active ? "Premio activado." : "Premio desactivado.",
      );
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar premio.",
      );
    }
  }

  function startEditingReward(item: Reward) {
    setError("");
    setSuccessMessage("");
    setEditingRewardId(item.id);
    setEditTitle(item.title);
    setEditCostPoints(String(item.costPoints));
  }

  function cancelEditingReward() {
    setEditingRewardId(null);
    setEditTitle("");
    setEditCostPoints("");
  }

  async function handleSaveReward(item: Reward) {
    if (!activeGroupId) return;

    const trimmedEditTitle = editTitle.trim();
    if (!trimmedEditTitle) {
      setError("El nombre del premio es obligatorio.");
      return;
    }
    const parsedCost = Number(editCostPoints);
    if (!Number.isInteger(parsedCost) || parsedCost < 1) {
      setError("El costo debe ser un número entero mayor a 0.");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setIsSaving(true);

      await updateReward(activeGroupId, item.id, {
        title: trimmedEditTitle,
        costPoints: parsedCost,
      });

      setSuccessMessage("Premio actualizado correctamente.");
      cancelEditingReward();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar premio.",
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

  if (!canManage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>
          Solo owner/sub_owner puede gestionar el catalogo de premios.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Crear premio</Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="Nombre del premio"
      />
      <TextInput
        value={costPoints}
        onChangeText={setCostPoints}
        style={styles.input}
        keyboardType="numeric"
        placeholder="Costo en puntos"
      />

      <Pressable
        style={[styles.primaryButton, isSaving && styles.primaryDisabled]}
        onPress={handleCreateReward}
        disabled={isSaving}
      >
        <Text style={styles.primaryButtonText}>
          {isSaving ? "Guardando..." : "Crear premio"}
        </Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Catalogo actual</Text>
      {rewards.length === 0 ? (
        <Text style={styles.infoText}>Aun no hay premios creados.</Text>
      ) : null}

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isEditing = editingRewardId === item.id;

          return (
            <View style={styles.card}>
              {isEditing ? (
                <>
                  <TextInput
                    value={editTitle}
                    onChangeText={setEditTitle}
                    style={styles.input}
                    placeholder="Nombre del premio"
                    editable={!isSaving}
                  />
                  <TextInput
                    value={editCostPoints}
                    onChangeText={setEditCostPoints}
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Costo en puntos"
                    editable={!isSaving}
                  />

                  <View style={styles.inlineActionsRow}>
                    <Pressable
                      style={[
                        styles.inlineActionButton,
                        styles.inlineSaveButton,
                        isSaving && styles.primaryDisabled,
                      ]}
                      onPress={() => handleSaveReward(item)}
                      disabled={isSaving}
                    >
                      <Text style={styles.inlineSaveButtonText}>
                        {isSaving ? "Guardando..." : "Guardar"}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.inlineActionButton,
                        styles.inlineCancelButton,
                      ]}
                      onPress={cancelEditingReward}
                      disabled={isSaving}
                    >
                      <Text style={styles.inlineCancelButtonText}>
                        Cancelar
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.row}>
                    <Text style={styles.rewardTitle}>{item.title}</Text>
                    <Text style={styles.rewardPoints}>
                      {item.costPoints} pts
                    </Text>
                  </View>
                  <Text style={styles.metaText}>
                    Estado: {item.active ? "Activo" : "Inactivo"}
                  </Text>

                  <View style={styles.inlineActionsRow}>
                    <Pressable
                      style={styles.inlineActionButton}
                      onPress={() => startEditingReward(item)}
                    >
                      <Text style={styles.secondaryButtonText}>Editar</Text>
                    </Pressable>

                    <Pressable
                      style={styles.inlineActionButton}
                      onPress={() => handleToggleReward(item)}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {item.active ? "Desactivar" : "Activar"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 30,
    paddingTop: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
  },
  rewardPoints: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 10,
  },
  metaText: {
    marginTop: 6,
    color: colors.muted,
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  inlineActionsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  inlineActionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  inlineSaveButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inlineSaveButtonText: {
    color: colors.primaryText,
    fontWeight: "700",
  },
  inlineCancelButton: {
    backgroundColor: colors.surface,
  },
  inlineCancelButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  infoText: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 12,
  },
  errorText: {
    marginTop: 8,
    color: "#B42318",
    textAlign: "center",
  },
  successText: {
    marginTop: 8,
    color: "#0B6E4F",
    textAlign: "center",
  },
});
