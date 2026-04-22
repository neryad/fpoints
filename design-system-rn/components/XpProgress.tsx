import React from "react";
import { Text, View, ViewStyle } from "react-native";
import { hsl, light } from "../tokens/colors";

export interface XpProgressProps {
  level: number;
  currentXp: number;
  requiredXp: number;
  label?: string;
  style?: ViewStyle;
}

/**
 * Progress bar para XP. La barra usa un color sólido (primary).
 * Para gradiente xp→primary, instala `expo-linear-gradient` y reemplaza
 * el <View> interno por <LinearGradient colors={[hsl(light.xp), hsl(light.primary)]} />.
 */
export function XpProgress({
  level,
  currentXp,
  requiredXp,
  label,
  style,
}: XpProgressProps) {
  const pct = Math.min((currentXp / Math.max(requiredXp, 1)) * 100, 100);

  return (
    <View style={style} className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-xp bg-xp/15">
        <Text
          className="font-mono-bold text-sm text-xp"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {level}
        </Text>
      </View>

      <View className="flex-1">
        {label ? (
          <Text className="mb-1 font-sans text-xs text-muted-foreground">{label}</Text>
        ) : null}

        <View className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <View
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: hsl(light.primary) }}
          />
        </View>

        <View className="mt-1 flex-row justify-between">
          <Text
            className="font-mono text-[10px] text-muted-foreground"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {currentXp} / {requiredXp} XP
          </Text>
          <Text
            className="font-mono text-[10px] text-muted-foreground"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            Nivel {level + 1}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default XpProgress;