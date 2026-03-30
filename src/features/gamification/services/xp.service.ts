import { supabase } from "../../../core/supabase/client";

export type XpSummary = {
  totalXp: number;
  currentLevel: number;
  levelName: string;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
  isMaxLevel: boolean;
};

type Level = {
  level: number;
  name: string;
  minXp: number;
};

const LEVELS: Level[] = [
  { level: 1, name: "F", minXp: 0 },
  { level: 2, name: "E", minXp: 100 },
  { level: 3, name: "D", minXp: 250 },
  { level: 4, name: "C", minXp: 500 },
  { level: 5, name: "B", minXp: 1000 },
  { level: 6, name: "A", minXp: 2000 },
  { level: 7, name: "S", minXp: 3500 },
];

function buildXpSummary(totalXp: number): XpSummary {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.minXp) {
      current = lvl;
    } else {
      break;
    }
  }

  const isMaxLevel = current.level === LEVELS[LEVELS.length - 1].level;

  if (isMaxLevel) {
    return {
      totalXp,
      currentLevel: current.level,
      levelName: current.name,
      xpInCurrentLevel: totalXp - current.minXp,
      xpNeededForNextLevel: 0,
      progressPercent: 100,
      isMaxLevel: true,
    };
  }

  const nextLevel = LEVELS[current.level]; // levels are 1-indexed; index = current.level
  const xpInLevel = totalXp - current.minXp;
  const xpNeeded = nextLevel.minXp - current.minXp;
  const progressPercent = Math.min(
    100,
    Math.round((xpInLevel / xpNeeded) * 100),
  );

  return {
    totalXp,
    currentLevel: current.level,
    levelName: current.name,
    xpInCurrentLevel: xpInLevel,
    xpNeededForNextLevel: xpNeeded,
    progressPercent,
    isMaxLevel: false,
  };
}

export async function getMyXpSummary(groupId: string): Promise<XpSummary> {
  if (!supabase) {
    throw new Error(
      "Supabase no esta configurado. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No se pudo obtener el usuario actual.");
  }

  const { data, error } = await supabase
    .from("point_transactions")
    .select("amount")
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .gt("amount", 0);

  if (error) {
    throw new Error(error.message);
  }

  const totalXp = (data ?? []).reduce((sum, row) => sum + row.amount, 0);
  return buildXpSummary(totalXp);
}
