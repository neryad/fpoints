import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { getMyPointsBalance } from "../../home/services/points.service";
import {
  canManageRewards,
  listGroupRewards,
  requestRewardRedemption,
} from "../services/rewards.service";
import type { Reward } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "RewardsList">;

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
    },

    // ── Balance card ─────────────────────────────────────────────────────────
    balanceCard: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,         // 16
      padding: spacing[4],             // 16
      marginBottom: spacing[3],        // 12
    },
    balanceLabel: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    balanceValue: {
      marginTop: spacing[1],           // 4
      fontSize: 40,
      fontWeight: fontWeight.bold,     // "700"
      color: colors.textStrong,
      lineHeight: 46,
    },
    balanceSub: {
      fontSize: fontSize.xxs,          // 11
      color: colors.muted,
      marginTop: 2,
    },

    // ── Actions row ──────────────────────────────────────────────────────────
    actionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],                 // 8
      marginBottom: spacing[3],        // 12
    },
    chipBtn: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.full,       // 999
      paddingHorizontal: spacing[3],   // 12
      paddingVertical: spacing[2],     // 8
    },
    chipBtnText: {
      fontSize: fontSize.xs,           // 12
      fontWeight: fontWeight.semibold, // "600"
      color: colors.text,
    },
    chipBtnManager: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    chipBtnManagerText: {
      color: colors.primary,
    },

    // ── Feedback ─────────────────────────────────────────────────────────────
    errorText: {
      fontSize: fontSize.xs,           // 12
      color: colors.error,
      textAlign: "center",
      marginBottom: spacing[2],        // 8
    },
    successText: {
      fontSize: fontSize.xs,           // 12
      color: colors.success,
      textAlign: "center",
      marginBottom: spacing[2],        // 8
    },
    emptyText: {
      marginTop: spacing[6],           // 24
      textAlign: "center",
      fontSize: fontSize.sm,           // 14
      color: colors.muted,
    },

    // ── List ─────────────────────────────────────────────────────────────────
    listContent: {
      paddingBottom: spacing[7],       // 32
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
      opacity: 0.5,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing[2],                 // 8
      marginBottom: spacing[2],        // 8
    },
    cardTitle: {
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
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],                 // 4
      marginBottom: spacing[3],        // 12
    },
    metaDot: {
      width: 6,
      height: 6,
      borderRadius: radius.full,
      backgroundColor: colors.muted,
    },
    metaDotSuccess: {
      backgroundColor: colors.success,
    },
    metaDotError: {
      backgroundColor: colors.error,
    },
    metaText: {
      fontSize: fontSize.xs,           // 12
      color: colors.muted,
    },
    metaTextSuccess: {
      color: colors.success,
    },
    metaTextError: {
      color: colors.error,
    },

    // ── Buttons ──────────────────────────────────────────────────────────────
    btnPrimary: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
    },
    btnPrimaryText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },
    btnDisabled: {
      opacity: 0.4,
    },
  });
}

// ---------------------------------------------------------------------------
// RewardsScreen
// ---------------------------------------------------------------------------

export function RewardsScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { activeGroupId } = useAppSession();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myPoints, setMyPoints] = useState(0);
  const [isManager, setIsManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!activeGroupId) {
      setRewards([]);
      setMyPoints(0);
      setIsManager(false);
      setIsLoading(false);
      return;
    }
    try {
      setError("");
      setSuccessMessage("");
      setIsLoading(true);
      const [canManage, balance] = await Promise.all([
        canManageRewards(activeGroupId),
        getMyPointsBalance(activeGroupId),
      ]);
      const rewardsData = await listGroupRewards(activeGroupId, canManage);
      setIsManager(canManage);
      setMyPoints(balance);
      setRewards(rewardsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los premios."
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const handleRedeem = useCallback(
    (reward: Reward) => {
      if (!activeGroupId) return;
      Alert.alert(
        "Confirmar canje",
        `¿Solicitar canje de "${reward.title}" por ${reward.costPoints} puntos?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Solicitar",
            onPress: async () => {
              try {
                setError("");
                setSuccessMessage("");
                setRedeemingId(reward.id);
                await requestRewardRedemption(activeGroupId, reward);
                setSuccessMessage("Solicitud enviada. Esperando aprobación.");
                await loadData();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "No se pudo solicitar el canje."
                );
              } finally {
                setRedeemingId(null);
              }
            },
          },
        ]
      );
    },
    [activeGroupId, loadData]
  );

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.container}>

      {/* Balance */}
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>Puntos disponibles</Text>
        <Text style={s.balanceValue}>{myPoints}</Text>
        <Text style={s.balanceSub}>
          {rewards.filter((r) => r.active && myPoints >= r.costPoints).length} premios
          al alcance
        </Text>
      </View>

      {/* Acciones */}
      <View style={s.actionsRow}>
        <Pressable
          style={({ pressed }) => [s.chipBtn, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.navigate("MyRedemptions")}
        >
          <Text style={s.chipBtnText}>Mis canjes</Text>
        </Pressable>

        {isManager && (
          <>
            <Pressable
              style={({ pressed }) => [
                s.chipBtn,
                s.chipBtnManager,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => navigation.navigate("ManageRewards")}
            >
              <Text style={[s.chipBtnText, s.chipBtnManagerText]}>
                Gestionar premios
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                s.chipBtn,
                s.chipBtnManager,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => navigation.navigate("RewardApprovals")}
            >
              <Text style={[s.chipBtnText, s.chipBtnManagerText]}>
                Aprobar canjes
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Feedback */}
      {error ? <Text style={s.errorText}>{error}</Text> : null}
      {successMessage ? <Text style={s.successText}>{successMessage}</Text> : null}

      {/* Lista */}
      {rewards.length === 0 ? (
        <Text style={s.emptyText}>Aún no hay premios disponibles.</Text>
      ) : (
        <FlatList
          data={rewards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => {
            const insufficient = myPoints < item.costPoints;
            const isRedeeming = redeemingId === item.id;
            const canRedeem = item.active && !insufficient;

            // Estado del indicador
            let dotStyle: ViewStyle = s.metaDot;
            let textStyle: TextStyle = s.metaText;
            let metaMsg = "Disponible para solicitar.";

            if (!item.active) {
              metaMsg = "Premio inactivo.";
            } else if (insufficient) {
              dotStyle = { ...s.metaDot, ...s.metaDotError };
              textStyle = { ...s.metaText, ...s.metaTextError };
              metaMsg = `Te faltan ${item.costPoints - myPoints} puntos.`;
            } else {
              dotStyle = { ...s.metaDot, ...s.metaDotSuccess };
              textStyle = { ...s.metaText, ...s.metaTextSuccess };
            }

            return (
              <View style={[s.card, !item.active && s.cardInactive]}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle}>{item.title}</Text>
                  <View style={s.costPill}>
                    <Text style={s.costPillText}>{item.costPoints} pts</Text>
                  </View>
                </View>

                <View style={s.metaRow}>
                  <View style={dotStyle} />
                  <Text style={textStyle}>{metaMsg}</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    s.btnPrimary,
                    (!canRedeem || isRedeeming) && s.btnDisabled,
                    pressed && canRedeem && !isRedeeming && { opacity: 0.8 },
                  ]}
                  onPress={() => handleRedeem(item)}
                  disabled={!canRedeem || isRedeeming}
                >
                  <Text style={s.btnPrimaryText}>
                    {isRedeeming ? "Enviando..." : "Solicitar canje"}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}