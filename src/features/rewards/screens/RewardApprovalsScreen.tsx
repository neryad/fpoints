import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { getUserDisplayNames } from "../../tasks/services/tasks.service";
import {
  canManageRewards,
  listPendingRewardRedemptions,
  reviewRewardRedemption,
} from "../services/rewards.service";
import type { RewardRedemption } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "RewardApprovals">;

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
      padding: spacing[4],             // 16
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

    // ── Feedback ─────────────────────────────────────────────────────────────
    errorText: {
      fontSize: fontSize.xs,           // 12
      color: colors.error,
      textAlign: "center",
      marginBottom: spacing[3],        // 12
    },
    successText: {
      fontSize: fontSize.xs,           // 12
      color: colors.success,
      textAlign: "center",
      marginBottom: spacing[3],        // 12
    },

    // ── List ─────────────────────────────────────────────────────────────────
    listContent: {
      paddingBottom: spacing[7],       // 32
    },

    // ── Card ─────────────────────────────────────────────────────────────────
    card: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,         // 16
      padding: spacing[4],             // 16
      marginBottom: spacing[3],        // 12
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing[2],                 // 8
      marginBottom: spacing[3],        // 12
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

    // ── Meta rows ────────────────────────────────────────────────────────────
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],                 // 8
      marginBottom: spacing[1],        // 4
    },
    metaLabel: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.muted,
      width: 72,
    },
    metaValue: {
      flex: 1,
      fontSize: fontSize.xs,           // 12
      color: colors.text,
    },

    // ── Action buttons ───────────────────────────────────────────────────────
    actionsRow: {
      flexDirection: "row",
      gap: spacing[2],                 // 8
      marginTop: spacing[4],           // 16
    },
    btnApprove: {
      flex: 1,
      backgroundColor: colors.success,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },
    btnApproveText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },
    btnReject: {
      flex: 1,
      backgroundColor: colors.errorSoft,
      borderWidth: 0.5,
      borderColor: colors.error,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },
    btnRejectText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.error,
    },
    btnDisabled: {
      opacity: 0.4,
    },
  });
}

// ---------------------------------------------------------------------------
// RewardApprovalsScreen
// ---------------------------------------------------------------------------

export function RewardApprovalsScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { activeGroupId } = useAppSession();

  const [items, setItems] = useState<RewardRedemption[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!activeGroupId) {
      setItems([]);
      setCanReview(false);
      setIsLoading(false);
      return;
    }
    try {
      setError("");
      setSuccessMessage("");
      setIsLoading(true);

      const manager = await canManageRewards(activeGroupId);
      setCanReview(manager);

      if (!manager) {
        setItems([]);
        return;
      }

      const data = await listPendingRewardRedemptions(activeGroupId);
      setItems(data);

      const labels = await getUserDisplayNames(
        data.map((item) => item.userId),
        activeGroupId,
      );
      setUserDisplayNames(labels);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los canjes pendientes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  const handleReview = useCallback(
    (item: RewardRedemption, status: "approved" | "rejected") => {
      const label = status === "approved" ? "aprobar" : "rechazar";
      Alert.alert(
        "Confirmar",
        `¿Seguro que quieres ${label} este canje?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: status === "approved" ? "Aprobar" : "Rechazar",
            style: status === "rejected" ? "destructive" : "default",
            onPress: async () => {
              try {
                setError("");
                setSuccessMessage("");
                setReviewingId(item.id);
                await reviewRewardRedemption(item.id, status);
                setSuccessMessage(
                  status === "approved"
                    ? "Canje aprobado y puntos descontados."
                    : "Canje rechazado.",
                );
                await loadData();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "No se pudo revisar el canje.",
                );
              } finally {
                setReviewingId(null);
              }
            },
          },
        ],
      );
    },
    [loadData],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!canReview) {
    return (
      <View style={s.centered}>
        <Text style={s.infoText}>
          Solo owner o sub_owner puede aprobar o rechazar canjes.
        </Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.container}>
      {error ? <Text style={s.errorText}>{error}</Text> : null}
      {successMessage ? <Text style={s.successText}>{successMessage}</Text> : null}

      {items.length === 0 ? (
        <Text style={s.infoText}>No hay canjes pendientes.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => {
            const isBusy = reviewingId === item.id;
            const displayName = userDisplayNames[item.userId] ?? item.userId;
            const date = new Date(item.createdAt).toLocaleString();

            return (
              <View style={s.card}>
                {/* Header: título + costo */}
                <View style={s.cardHeader}>
                  <Text style={s.rewardTitle}>{item.rewardTitle}</Text>
                  <View style={s.costPill}>
                    <Text style={s.costPillText}>{item.rewardCostPoints} pts</Text>
                  </View>
                </View>

                {/* Meta */}
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Solicitado</Text>
                  <Text style={s.metaValue}>{displayName}</Text>
                </View>
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Fecha</Text>
                  <Text style={s.metaValue}>{date}</Text>
                </View>

                {/* Acciones */}
                <View style={s.actionsRow}>
                  <Pressable
                    style={({ pressed }) => [
                      s.btnApprove,
                      isBusy && s.btnDisabled,
                      pressed && !isBusy && { opacity: 0.8 },
                    ]}
                    onPress={() => handleReview(item, "approved")}
                    disabled={isBusy}
                  >
                    <Text style={s.btnApproveText}>
                      {isBusy ? "..." : "Aprobar"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      s.btnReject,
                      isBusy && s.btnDisabled,
                      pressed && !isBusy && { opacity: 0.8 },
                    ]}
                    onPress={() => handleReview(item, "rejected")}
                    disabled={isBusy}
                  >
                    <Text style={s.btnRejectText}>
                      {isBusy ? "..." : "Rechazar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}