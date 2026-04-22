import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";

export type CelebrationData = {
  memberName: string;
  taskTitle: string;
  pointsEarned: number;
  newBalance: number;
};

type Props = {
  visible: boolean;
  data: CelebrationData | null;
  onClose: () => void;
};

const STAR_COUNT = 8;
const STAR_CHARS = ["⭐", "✨", "🌟", "💫"];

type StarConfig = {
  x: number;      // random horizontal offset from center (-1 to 1)
  delay: number;  // ms
  char: string;
};

const STARS: StarConfig[] = Array.from({ length: STAR_COUNT }, (_, i) => ({
  x: (Math.random() - 0.5) * 2,
  delay: i * 80,
  char: STAR_CHARS[i % STAR_CHARS.length],
}));

function Star({ config, trigger }: { config: StarConfig; trigger: Animated.Value }) {
  const translateY = trigger.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -180 - Math.random() * 80],
  });
  const translateX = trigger.interpolate({
    inputRange: [0, 1],
    outputRange: [0, config.x * 100],
  });
  const opacity = trigger.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 1, 0],
  });
  const scale = trigger.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1.4, 0.6],
  });

  return (
    <Animated.Text
      style={[
        styles.star,
        { opacity, transform: [{ translateY }, { translateX }, { scale }] },
      ]}
    >
      {config.char}
    </Animated.Text>
  );
}

export function CelebrationOverlay({ visible, data, onClose }: Props) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontWeight, radius } = theme;

  const backdropAnim  = useRef(new Animated.Value(0)).current;
  const cardAnim      = useRef(new Animated.Value(0)).current;
  const pointsAnim    = useRef(new Animated.Value(0)).current;
  const starTriggersRef = useRef(STARS.map(() => new Animated.Value(0)));
  const starTriggers = starTriggersRef.current;

  const runAnimation = useCallback(() => {
    // Reset
    backdropAnim.setValue(0);
    cardAnim.setValue(0);
    pointsAnim.setValue(0);
    starTriggers.forEach((a) => a.setValue(0));

    Animated.sequence([
      // 1. Backdrop fades in
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      // 2. Card bounces in
      Animated.spring(cardAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      // 3. Points pop + stars burst (parallel)
      Animated.parallel([
        Animated.spring(pointsAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        ...starTriggers.map((a, i) =>
          Animated.sequence([
            Animated.delay(STARS[i].delay),
            Animated.timing(a, {
              toValue: 1,
              duration: 900,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();
  }, [backdropAnim, cardAnim, pointsAnim, starTriggers]);

  useEffect(() => {
    if (visible && data) {
      runAnimation();
    }
  }, [visible, data, runAnimation]);

  if (!data) return null;

  const cardScale = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  const pointsScale = pointsAnim.interpolate({
    inputRange: [0, 0.6, 0.8, 1],
    outputRange: [0, 1.3, 0.95, 1],
  });
  const initial = (data.memberName ?? "?").charAt(0).toUpperCase();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              padding: spacing[6],
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Stars burst origin */}
          <View style={styles.starsContainer} pointerEvents="none">
            {STARS.map((cfg, i) => (
              <Star key={i} config={cfg} trigger={starTriggers[i]} />
            ))}
          </View>

          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ fontSize: 36, fontWeight: fontWeight.bold, color: colors.primary }}>
              {initial}
            </Text>
          </View>

          {/* Name + message */}
          <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textStrong, textAlign: "center", marginTop: spacing[3] }}>
            ¡{data.memberName}, lo lograste!
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.muted, textAlign: "center", marginTop: spacing[1], marginBottom: spacing[4] }} numberOfLines={2}>
            {data.taskTitle}
          </Text>

          {/* Points earned */}
          <Animated.View style={{ alignItems: "center", transform: [{ scale: pointsScale }] }}>
            <Text style={{ fontSize: 56, fontWeight: fontWeight.bold, color: colors.success, lineHeight: 64 }}>
              +{data.pointsEarned}
            </Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.success }}>
              puntos ganados
            </Text>
          </Animated.View>

          {/* Total balance */}
          <View style={[styles.balanceRow, { backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing[3], marginTop: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.sm, color: colors.primary }}>Total de puntos</Text>
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary }}>
              {data.newBalance}
            </Text>
          </View>

          {/* Close button */}
          <Pressable
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: colors.primary, borderRadius: radius.lg, marginTop: spacing[4], opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={onClose}
          >
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.primaryText }}>
              ¡Genial!
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  starsContainer: {
    position: "absolute",
    top: "40%",
    left: "50%",
    width: 0,
    height: 0,
  } as ViewStyle,
  star: {
    position: "absolute",
    fontSize: 28,
    textAlign: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
  },
});
