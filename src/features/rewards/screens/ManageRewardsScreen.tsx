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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;

  return StyleSheet.create({
    // ── Screen ──────────────────────────────────────────────────────────────
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      padding: spacing[6],             // 24
    },
    infoText: {
      fontSize: fontSize.sm,           // 14
      color: colors.muted,
      textAlign: "center",
    },
    scrollContent: {
      padding: spacing[4],             // 16
      paddingBottom: spacing[8],       // 40
    },

    // ── Section label ────────────────────────────────────────────────────────
    sectionLabel: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: spacing[3],        // 12
      marginTop: spacing[5],           // 20
    },

    // ── Create card ──────────────────────────────────────────────────────────
    createCard: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,         // 16
      padding: spacing[4],             // 16
      marginBottom: spacing[2],        // 8
    },

    // ── Inputs ───────────────────────────────────────────────────────────────
    input: {
      backgroundColor: colors.background,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.sm,         // 8
      paddingHorizontal: spacing[3],   // 12
      paddingVertical: spacing[3],     // 12
      marginBottom: spacing[2],        // 8
      color: colors.text,
      fontSize: fontSize.sm,           // 14
    },
    inputDisabled: {
      opacity: 0.5,
    },

    // ── Buttons ──────────────────────────────────────────────────────────────
    btnPrimary: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
      marginTop: spacing[1],           // 4
    },
    btnPrimaryText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },
    btnSecondary: {
      flex: 1,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },
    btnSecondaryText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.semibold, // "600"
      color: colors.text,
    },
    btnSave: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },
    btnSaveText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },
    btnToggleActive: {
      flex: 1,
      backgroundColor: colors.errorSoft,
      borderWidth: 0.5,
      borderColor: colors.error,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },
    btnToggleActiveText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.semibold, // "600"
      color: colors.error,
    },
    btnToggleInactive: {
      flex: 1,
      backgroundColor: colors.successSoft,
      borderWidth: 0.5,
      borderColor: colors.success,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },
    btnToggleInactiveText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.semibold, // "600"
      color: colors.success,
    },
    btnDisabled: {
      opacity: 0.4,
    },
    actionsRow: {
      flexDirection: "row",
      gap: spacing[2],                 // 8
      marginTop: spacing[3],           // 12
    },

    // ── Reward card ──────────────────────────────────────────────────────────
    card: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,         // 16
      padding: spacing[4],             // 16
      marginBottom: spacing[3],        // 12
    },
    cardInactive: {
      opacity: 0.55,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing[2],                 // 8
      marginBottom: spacing[2],        // 8
    },
    rewardTitle: {
      flex: 1,
      fontSize: fontSize.base,         // 16
      fontWeight: fontWeight.semibold, // "600"
      color: colors.textStrong,
    },
    costPill: {
      backgroundColor: colors.rewardSoft,
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],   // 8
      paddingVertical: 3,
    },
    costPillText: {
      fontSize: fontSize.xs,           // 12
      fontWeight: fontWeight.bold,     // "700"
      color: colors.reward,
    },
    statusDot: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],                 // 4
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radius.full,
    },
    statusText: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.muted,
    },

    // ── Feedback ─────────────────────────────────────────────────────────────
    feedbackWrap: {
      marginTop: spacing[3],           // 12
    },
    errorText: {
      fontSize: fontSize.xs,           // 12
      color: colors.error,
      textAlign: "center",
    },
    successText: {
      fontSize: fontSize.xs,           // 12
      color: colors.success,
      textAlign: "center",
    },
    listContent: {
      paddingBottom: spacing[2],       // 8
    },
  });
}

// ---------------------------------------------------------------------------
// ManageRewardsScreen
// ---------------------------------------------------------------------------

export function ManageRewardsScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
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

  // ── Data ───────────────────────────────────────────────────────────────────

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
        err instanceof Error ? err.message : "No se pudo cargar la gestión de premios."
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    if (!activeGroupId) return;
    const trimmed = title.trim();
    if (!trimmed) { setError("El nombre del premio es obligatorio."); return; }
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
    if (!Number.isInteger(parsed) || parsed < 1) {
      setError("El costo debe ser un número entero mayor a 0.");
      return;
    }
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

  // ── Guards ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!canManage) {
    return (
      <View style={s.centered}>
        <Text style={s.infoText}>
          Solo owner o sub_owner puede gestionar el catálogo de premios.
        </Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.container}>
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* ── Crear premio ── */}
            <Text style={[s.sectionLabel, { marginTop: 0 }]}>Crear premio</Text>
            <View style={s.createCard}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={s.input}
                placeholder="Nombre del premio"
                placeholderTextColor={theme.colors.muted}
                editable={!isSaving}
              />
              <TextInput
                value={costPoints}
                onChangeText={setCostPoints}
                style={s.input}
                keyboardType="numeric"
                placeholder="Costo en puntos"
                placeholderTextColor={theme.colors.muted}
                editable={!isSaving}
              />
              <Pressable
                style={({ pressed }) => [
                  s.btnPrimary,
                  isSaving && s.btnDisabled,
                  pressed && !isSaving && { opacity: 0.8 },
                ]}
                onPress={handleCreate}
                disabled={isSaving}
              >
                <Text style={s.btnPrimaryText}>
                  {isSaving ? "Guardando..." : "Crear premio"}
                </Text>
              </Pressable>
            </View>

            {/* Feedback */}
            {(error || successMessage) ? (
              <View style={s.feedbackWrap}>
                {error ? <Text style={s.errorText}>{error}</Text> : null}
                {successMessage ? <Text style={s.successText}>{successMessage}</Text> : null}
              </View>
            ) : null}

            {/* ── Catálogo ── */}
            <Text style={s.sectionLabel}>Catálogo actual</Text>
            {rewards.length === 0 ? (
              <Text style={s.infoText}>Aún no hay premios creados.</Text>
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const isEditing = editingRewardId === item.id;

          if (isEditing) {
            return (
              <View style={s.card}>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  style={s.input}
                  placeholder="Nombre del premio"
                  placeholderTextColor={theme.colors.muted}
                  editable={!isSaving}
                />
                <TextInput
                  value={editCostPoints}
                  onChangeText={setEditCostPoints}
                  style={s.input}
                  keyboardType="numeric"
                  placeholder="Costo en puntos"
                  placeholderTextColor={theme.colors.muted}
                  editable={!isSaving}
                />
                <View style={s.actionsRow}>
                  <Pressable
                    style={({ pressed }) => [
                      s.btnSave,
                      isSaving && s.btnDisabled,
                      pressed && !isSaving && { opacity: 0.8 },
                    ]}
                    onPress={() => handleSaveEdit(item)}
                    disabled={isSaving}
                  >
                    <Text style={s.btnSaveText}>
                      {isSaving ? "Guardando..." : "Guardar"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      s.btnSecondary,
                      isSaving && s.btnDisabled,
                      pressed && !isSaving && { opacity: 0.7 },
                    ]}
                    onPress={cancelEditing}
                    disabled={isSaving}
                  >
                    <Text style={s.btnSecondaryText}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          return (
            <View style={[s.card, !item.active && s.cardInactive]}>
              {/* Header */}
              <View style={s.cardHeader}>
                <Text style={s.rewardTitle}>{item.title}</Text>
                <View style={s.costPill}>
                  <Text style={s.costPillText}>{item.costPoints} pts</Text>
                </View>
              </View>

              {/* Estado */}
              <View style={s.statusDot}>
                <View
                  style={[
                    s.dot,
                    {
                      backgroundColor: item.active
                        ? theme.colors.success
                        : theme.colors.muted,
                    },
                  ]}
                />
                <Text style={s.statusText}>
                  {item.active ? "Activo" : "Inactivo"}
                </Text>
              </View>

              {/* Acciones */}
              <View style={s.actionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    s.btnSecondary,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => startEditing(item)}
                >
                  <Text style={s.btnSecondaryText}>Editar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    item.active ? s.btnToggleActive : s.btnToggleInactive,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => handleToggle(item)}
                >
                  <Text
                    style={
                      item.active ? s.btnToggleActiveText : s.btnToggleInactiveText
                    }
                  >
                    {item.active ? "Desactivar" : "Activar"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}