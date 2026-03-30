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

// minXp values are cumulative totals to reach that rank.
// Gaps: F→E 50, E→D 150, D→C 400, C→B 900, B→A 2000, A→S 4000
// At ~35 XP/task avg & 3 tasks/day:
//   E ≈ day 1  |  D ≈ day 3  |  C ≈ week 2  |  B ≈ month 1  |  A ≈ month 2-3  |  S ≈ 6 months
const LEVELS: Level[] = [
  { level: 1, name: "F", minXp: 0 },
  { level: 2, name: "E", minXp: 50 },
  { level: 3, name: "D", minXp: 200 },
  { level: 4, name: "C", minXp: 600 },
  { level: 5, name: "B", minXp: 1500 },
  { level: 6, name: "A", minXp: 3500 },
  { level: 7, name: "S", minXp: 7500 },
];

function buildXpSummary(totalXp: number): XpSummary {
  const clampedXp = Math.max(0, totalXp);

  // Find highest tier reached using the array index — safe regardless of level numbering.
  let currentIndex = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (clampedXp >= LEVELS[i].minXp) {
      currentIndex = i;
    } else {
      break;
    }
  }

  const current = LEVELS[currentIndex];
  const isMaxLevel = currentIndex === LEVELS.length - 1;

  if (isMaxLevel) {
    return {
      totalXp: clampedXp,
      currentLevel: current.level,
      levelName: current.name,
      xpInCurrentLevel: clampedXp - current.minXp,
      xpNeededForNextLevel: 0,
      progressPercent: 100,
      isMaxLevel: true,
    };
  }

  // Safe: currentIndex + 1 is always within bounds here (not at max level).
  const next = LEVELS[currentIndex + 1];
  const xpInLevel = clampedXp - current.minXp;
  const xpSpan = next.minXp - current.minXp;
  const progressPercent = Math.min(100, Math.round((xpInLevel / xpSpan) * 100));

  return {
    totalXp: clampedXp,
    currentLevel: current.level,
    levelName: current.name,
    xpInCurrentLevel: xpInLevel,
    xpNeededForNextLevel: xpSpan,
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
