import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RewardsStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { listMyRewardRedemptions } from "../services/rewards.service";
import type { RewardRedemption } from "../types";

type Props = NativeStackScreenProps<RewardsStackParamList, "MyRedemptions">;

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

type StatusKey = "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; dotColor: string; textColor: string }
> = {
  pending: {
    label: "Pendiente",
    dotColor: "#F0872F",   // warning[400]
    textColor: "#E5730A",  // warning[500]
  },
  approved: {
    label: "Aprobado",
    dotColor: "#4CCB86",   // success[400]
    textColor: "#26B765",  // success[500]
  },
  rejected: {
    label: "Rechazado",
    dotColor: "#D94A42",   // error[400]
    textColor: "#B3261E",  // error[500]
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as StatusKey] ?? {
    label: status,
    dotColor: "#8A8791",
    textColor: "#8A8791",
  };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;

  return StyleSheet.create({
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

    // ── Meta ─────────────────────────────────────────────────────────────────
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
      width: 48,
    },
    metaValue: {
      flex: 1,
      fontSize: fontSize.xs,           // 12
      color: colors.text,
    },

    // ── Status ───────────────────────────────────────────────────────────────
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],                 // 4
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: radius.full,
    },
    statusText: {
      fontSize: fontSize.xs,           // 12
      fontWeight: fontWeight.semibold, // "600"
    },

    // ── Feedback ─────────────────────────────────────────────────────────────
    infoText: {
      marginTop: spacing[6],           // 24
      textAlign: "center",
      fontSize: fontSize.sm,           // 14
      color: colors.muted,
    },
    errorText: {
      marginBottom: spacing[3],        // 12
      textAlign: "center",
      fontSize: fontSize.xs,           // 12
      color: colors.error,
    },
  });
}

// ---------------------------------------------------------------------------
// MyRedemptionsScreen
// ---------------------------------------------------------------------------

export function MyRedemptionsScreen({ navigation }: Props) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { activeGroupId } = useAppSession();

  const [items, setItems] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!activeGroupId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    try {
      setError("");
      setIsLoading(true);
      const data = await listMyRewardRedemptions(activeGroupId);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar tus canjes.");
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {error ? <Text style={s.errorText}>{error}</Text> : null}

      {items.length === 0 ? (
        <Text style={s.infoText}>Aún no tienes solicitudes de canje.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => {
            const status = getStatusConfig(item.status);
            const date = new Date(item.createdAt).toLocaleString();

            return (
              <View style={s.card}>
                {/* Título + costo */}
                <View style={s.cardHeader}>
                  <Text style={s.rewardTitle}>{item.rewardTitle}</Text>
                  <View style={s.costPill}>
                    <Text style={s.costPillText}>{item.rewardCostPoints} pts</Text>
                  </View>
                </View>

                {/* Estado */}
                <View style={[s.metaRow, { marginBottom: spacing[2] }]}>
                  <Text style={s.metaLabel}>Estado</Text>
                  <View style={s.statusRow}>
                    <View
                      style={[
                        s.statusDot,
                        { backgroundColor: status.dotColor } as ViewStyle,
                      ]}
                    />
                    <Text
                      style={[
                        s.statusText,
                        { color: status.textColor } as TextStyle,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                {/* Fecha */}
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Fecha</Text>
                  <Text style={s.metaValue}>{date}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// spacing helper usado inline
const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  7: 32,
} as const;