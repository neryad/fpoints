import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";

type SkeletonBoxProps = {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
};

function SkeletonBox({ width, height, borderRadius = 8, style }: SkeletonBoxProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.border, opacity },
        style,
      ]}
    />
  );
}

export type SkeletonVariant = "card" | "list" | "profile" | "stats";

export type SkeletonLoaderProps = {
  variant: SkeletonVariant;
  count?: number;
};

function CardSkeleton() {
  const { spacing, radius } = useTheme();
  return (
    <View style={[styles.card, { padding: spacing[4], borderRadius: radius.lg }]}>
      <SkeletonBox width="60%" height={14} />
      <View style={{ height: spacing[2] }} />
      <SkeletonBox width="40%" height={11} />
    </View>
  );
}

function ListSkeleton() {
  const { spacing, radius } = useTheme();
  return (
    <View style={[styles.card, { padding: spacing[4], borderRadius: radius.lg }]}>
      <View style={styles.listRow}>
        <SkeletonBox width={36} height={36} borderRadius={18} />
        <View style={{ flex: 1, gap: spacing[2] }}>
          <SkeletonBox width="70%" height={13} />
          <SkeletonBox width="45%" height={11} />
        </View>
      </View>
    </View>
  );
}

function ProfileSkeleton() {
  const { spacing } = useTheme();
  return (
    <View style={[styles.profileWrap, { gap: spacing[3] }]}>
      <SkeletonBox width={80} height={80} borderRadius={40} style={styles.center} />
      <SkeletonBox width={140} height={16} style={styles.center} />
      <SkeletonBox width={100} height={12} style={styles.center} />
    </View>
  );
}

function StatsSkeleton() {
  const { spacing, radius } = useTheme();
  return (
    <View style={[styles.statsRow, { gap: spacing[3] }]}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.statCard, { padding: spacing[4], borderRadius: radius.lg, gap: spacing[2] }]}
        >
          <SkeletonBox width={36} height={36} borderRadius={8} />
          <SkeletonBox width="70%" height={18} />
          <SkeletonBox width="50%" height={11} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonLoader({ variant, count = 3 }: SkeletonLoaderProps) {
  const { spacing } = useTheme();

  if (variant === "profile") return <ProfileSkeleton />;
  if (variant === "stats")   return <StatsSkeleton />;

  const Component = variant === "list" ? ListSkeleton : CardSkeleton;

  return (
    <View style={{ gap: spacing[3] }}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileWrap: {
    alignItems: "center",
    paddingVertical: 16,
  },
  center: {
    alignSelf: "center",
  },
  statsRow: {
    flexDirection: "row",
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
});
