
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  unstable_batchedUpdates,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { signOut } from "../../auth/services/auth.service";
import { getMyRoleInGroup } from "../../tasks/services/tasks.service";
import { getMyProfile, saveMyProfile } from "../services/profile.service";
import { getMyXpSummary, type XpSummary } from "../../gamification/services/xp.service";
import { getMyStreakSummary, type StreakSummary } from "../../gamification/services/streak.service";
import { Theme } from "src/core/theme";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

// ---------------------------------------------------------------------------
// Avatar pixel — 192 imágenes, sin roles
// React Native requiere require() estático, así que los listamos todos.
// ---------------------------------------------------------------------------

const PIXEL_PORTRAITS: ImageSourcePropType[] = [
  require("../../../../assets/avatars/pixel/portrait-with-border1.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border2.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border3.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border4.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border5.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border6.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border7.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border8.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border9.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border10.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border11.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border12.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border13.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border14.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border15.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border16.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border17.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border18.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border19.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border20.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border21.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border22.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border23.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border24.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border25.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border26.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border27.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border28.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border29.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border30.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border31.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border32.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border33.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border34.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border35.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border36.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border37.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border38.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border39.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border40.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border41.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border42.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border43.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border44.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border45.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border46.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border47.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border48.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border49.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border50.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border51.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border52.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border53.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border54.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border55.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border56.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border57.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border58.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border59.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border60.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border61.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border62.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border63.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border64.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border65.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border66.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border67.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border68.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border69.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border70.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border71.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border72.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border73.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border74.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border75.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border76.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border77.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border78.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border79.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border80.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border81.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border82.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border83.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border84.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border85.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border86.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border87.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border88.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border89.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border90.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border91.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border92.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border93.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border94.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border95.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border96.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border97.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border98.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border99.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border100.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border101.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border102.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border103.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border104.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border105.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border106.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border107.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border108.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border109.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border110.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border111.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border112.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border113.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border114.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border115.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border116.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border117.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border118.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border119.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border120.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border121.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border122.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border123.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border124.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border125.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border126.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border127.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border128.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border129.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border130.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border131.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border132.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border133.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border134.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border135.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border136.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border137.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border138.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border139.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border140.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border141.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border142.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border143.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border144.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border145.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border146.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border147.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border148.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border149.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border150.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border151.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border152.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border153.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border154.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border155.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border156.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border157.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border158.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border159.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border160.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border161.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border162.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border163.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border164.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border165.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border166.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border167.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border168.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border169.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border170.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border171.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border172.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border173.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border174.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border175.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border176.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border177.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border178.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border179.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border180.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border181.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border182.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border183.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border184.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border185.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border186.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border187.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border188.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border189.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border190.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border191.png"),
  require("../../../../assets/avatars/pixel/portrait-with-border192.png"),
];

const TOTAL_PORTRAITS = PIXEL_PORTRAITS.length; // 192

// ---------------------------------------------------------------------------
// Token helpers — formato: "pixel-avatar://42"
// ---------------------------------------------------------------------------

const PIXEL_TOKEN_PREFIX = "pixel-avatar://";

function isPixelToken(value: string) {
  return value.startsWith(PIXEL_TOKEN_PREFIX);
}

function buildPixelToken(index: number) {
  return `${PIXEL_TOKEN_PREFIX}${index}`;
}

function parsePixelToken(value: string): number | null {
  if (!isPixelToken(value)) return null;
  const n = Number(value.replace(PIXEL_TOKEN_PREFIX, ""));
  if (!Number.isInteger(n) || n < 0 || n >= TOTAL_PORTRAITS) return null;
  return n;
}

/** Hash estable del seed → índice entre 0 y TOTAL_PORTRAITS-1 */
function stableIndex(seed: string): number {
  if (!seed) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % TOTAL_PORTRAITS;
}

/**
 * Devuelve la imagen activa y su índice.
 * - Si avatarUrl es un pixel-token → usa ese índice.
 * - Si avatarUrl está vacío o es inválido → índice estable por seed.
 * - Si avatarUrl es una URL remota válida → se maneja por separado (remoteAvatar).
 */
function resolvePixelAvatar(
  seed: string,
  avatarUrl: string,
): { source: ImageSourcePropType; index: number } {
  const parsed = parsePixelToken(avatarUrl);
  const index = parsed !== null ? parsed : stableIndex(seed);
  return { source: PIXEL_PORTRAITS[index]!, index };
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  sub_owner: "Sub-propietario",
  member: "Miembro",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const { colors, spacing, fontSize, fontWeight, radius } = theme;

  return StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing[4],   // 16
      paddingBottom: spacing[8],       // 40
    },

    // ── Hero / avatar ────────────────────────────────────────────────────────
    hero: {
      alignItems: "center",
      paddingTop: spacing[6],          // 24
      paddingBottom: spacing[5],       // 20
    },
    avatarWrap: {
      position: "relative",
      marginBottom: spacing[3],        // 12
    },
    avatarCircle: {
      width: 96,
      height: 96,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      borderWidth: 2,
      borderColor: colors.primary,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    avatarChangeBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarChangeBadgeText: {
      fontSize: fontSize.xs,           // 12
      color: colors.primaryText,
    },
    avatarIndexText: {
      fontSize: fontSize.xxs,          // 11
      color: colors.muted,
      marginBottom: spacing[2],        // 8
    },
    profileName: {
      fontSize: fontSize.xl,           // 22
      fontWeight: fontWeight.bold,     // "700"
      color: colors.textStrong,
      marginBottom: 2,
    },
    profileEmail: {
      fontSize: fontSize.xs,           // 12
      color: colors.muted,
      marginBottom: spacing[1],        // 4
    },
    groupChip: {
      marginTop: spacing[1],           // 4
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      paddingHorizontal: spacing[3],   // 12
      paddingVertical: spacing[1],     // 4
      borderRadius: radius.full,
    },
    groupChipText: {
      fontSize: fontSize.xs,           // 12
      fontWeight: fontWeight.semibold, // "600"
      color: colors.primary,
    },

    // ── Stats strip ──────────────────────────────────────────────────────────
    statsCard: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,         // 16
      marginBottom: spacing[3],        // 12
      overflow: "hidden",
    },
    statChip: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing[4],     // 16
    },
    statValue: {
      fontSize: fontSize.lg,           // 18
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primary,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: fontSize.xxs,          // 11
      color: colors.muted,
      fontWeight: fontWeight.medium,   // "500"
    },
    statDivider: {
      width: 0.5,
      backgroundColor: colors.border,
      marginVertical: spacing[3],      // 12
    },

    // ── Card ────────────────────────────────────────────────────────────────
    card: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.lg,         // 16
      padding: spacing[4],             // 16
      marginBottom: spacing[3],        // 12
    },
    cardLabel: {
      fontSize: fontSize.xxs,          // 11
      fontWeight: fontWeight.medium,   // "500"
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: spacing[3],        // 12
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
    inputFocused: {
      borderColor: colors.primary,
    },

    // ── Buttons ──────────────────────────────────────────────────────────────
    btnPrimary: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing[2],           // 8
    },
    btnPrimaryText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.primaryText,
    },
    btnSecondary: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 0.5,
      borderColor: colors.border,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing[2],           // 8
    },
    btnSecondaryText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.semibold, // "600"
      color: colors.text,
    },
    btnDanger: {
      backgroundColor: colors.errorSoft,
      borderWidth: 0.5,
      borderColor: colors.error,
      borderRadius: radius.md,         // 12
      paddingVertical: spacing[3],     // 12
      alignItems: "center",
      justifyContent: "center",
    },
    btnDangerText: {
      fontSize: fontSize.sm,           // 14
      fontWeight: fontWeight.bold,     // "700"
      color: colors.error,
    },
    btnDisabled: {
      opacity: 0.5,
    },

    // ── Feedback ─────────────────────────────────────────────────────────────
    errorText: {
      fontSize: fontSize.xs,           // 12
      color: colors.error,
      marginBottom: spacing[2],        // 8
    },
    successText: {
      fontSize: fontSize.xs,           // 12
      color: colors.success,
      marginBottom: spacing[2],        // 8
    },
    loaderWrap: {
      paddingVertical: spacing[4],     // 16
      alignItems: "center",
    },
    itemGap: {
      marginTop: spacing[2],           // 8
    },
  });
}

// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { themeOverride, setThemeOverride } = theme;
  const s = makeStyles(theme);
  const { clearGroup, activeGroupId, activeGroupName } = useAppSession();

  const [profileId, setProfileId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [canConfigureGroup, setCanConfigureGroup] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [xp, setXp] = useState<XpSummary | null>(null);
  const [streak, setStreak] = useState<StreakSummary | null>(null);

  // ── Derived avatar state ──────────────────────────────────────────────────

  const trimmedUrl = useMemo(() => avatarUrl.trim(), [avatarUrl]);

  const isRemoteAvatar = useMemo(
    () => trimmedUrl.length > 0 && !avatarImageFailed && !isPixelToken(trimmedUrl),
    [trimmedUrl, avatarImageFailed],
  );

  /** Seed estable: preferimos profileId, luego email, luego name */
  const userSeed = profileId || email || name;

  const pixelAvatar = useMemo(
    () => resolvePixelAvatar(userSeed, trimmedUrl),
    [userSeed, trimmedUrl],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    try {
      setError("");
      setIsLoadingProfile(true);
      const profile = await getMyProfile();
      unstable_batchedUpdates(() => {
        setProfileId(profile.id);
        setName(profile.name ?? "");
        setEmail(profile.email);
        setAvatarUrl(profile.avatarUrl ?? "");
        setAvatarImageFailed(false);
      });

      if (activeGroupId) {
        try {
          const myRole = await getMyRoleInGroup(activeGroupId);
          const [myXp, myStreak] = await Promise.all([
            getMyXpSummary(activeGroupId),
            getMyStreakSummary(activeGroupId),
          ]);
          unstable_batchedUpdates(() => {
            setRole(myRole);
            setCanConfigureGroup(myRole === "owner" || myRole === "sub_owner");
            setXp(myXp);
            setStreak(myStreak);
          });
        } catch (err) {
          unstable_batchedUpdates(() => {
            setRole(null);
            setCanConfigureGroup(false);
            setXp(null);
            setStreak(null);
          });
          throw err;
        }
      } else {
        unstable_batchedUpdates(() => {
          setRole(null);
          setCanConfigureGroup(false);
          setXp(null);
          setStreak(null);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el perfil.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = useCallback(async () => {
    try {
      setError("");
      setSuccessMessage("");
      setIsSaving(true);
      const profile = await saveMyProfile({ name, avatarUrl });
      unstable_batchedUpdates(() => {
        setProfileId(profile.id);
        setName(profile.name ?? "");
        setEmail(profile.email);
        setAvatarUrl(profile.avatarUrl ?? "");
        setAvatarImageFailed(false);
        setSuccessMessage("Perfil guardado correctamente.");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  }, [name, avatarUrl]);

  const handleLogout = useCallback(async () => {
    try {
      setError("");
      setIsLoggingOut(true);
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar sesión.");
      setIsLoggingOut(false);
    }
  }, []);

  /** Cicla al siguiente avatar pixel y guarda el token en avatarUrl */
  const handleNextAvatar = useCallback(() => {
    const nextIndex = (pixelAvatar.index + 1) % TOTAL_PORTRAITS;
    setAvatarUrl(buildPixelToken(nextIndex));
    setAvatarImageFailed(false);
    setSuccessMessage("Avatar actualizado. Guarda para confirmar.");
  }, [pixelAvatar.index]);

  const handleAvatarError = useCallback(() => {
    setAvatarImageFailed(true);
  }, []);

  const handleGoToGroupSettings = useCallback(() => {
    navigation.navigate("GroupSettings");
  }, [navigation]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView contentContainerStyle={s.container}>

      {/* ── Hero ── */}
      <View style={s.hero}>
        <View style={s.avatarWrap}>
          <View style={s.avatarCircle}>
            {isRemoteAvatar ? (
              <Image
                source={{ uri: trimmedUrl }}
                style={s.avatarImage}
                resizeMode="cover"
                onError={handleAvatarError}
              />
            ) : (
              <Image
                source={pixelAvatar.source}
                style={s.avatarImage}
                resizeMode="cover"
              />
            )}
          </View>
          {/* Badge de cambio rápido */}
          <Pressable
            style={({ pressed }) => [
              s.avatarChangeBadge,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleNextAvatar}
            accessibilityLabel="Cambiar avatar"
          >
            <Text style={s.avatarChangeBadgeText}>↻</Text>
          </Pressable>
        </View>

        {/* Índice del pixel avatar (solo cuando no es remoto) */}
        {!isRemoteAvatar && (
          <Text style={s.avatarIndexText}>
            Avatar {pixelAvatar.index + 1} de {TOTAL_PORTRAITS}
          </Text>
        )}

        <Text style={s.profileName}>{name || "Sin nombre"}</Text>
        <Text style={s.profileEmail}>{email}</Text>

        {activeGroupName ? (
          <View style={s.groupChip}>
            <Text style={s.groupChipText}>
              {activeGroupName}
              {role ? `  ·  ${ROLE_LABELS[role] ?? role}` : ""}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Stats strip ── */}
      {isLoadingProfile ? (
        <View style={s.loaderWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : xp && streak ? (
        <View style={s.statsCard}>
          <View style={s.statChip}>
            <Text style={s.statValue}>{xp.levelName}</Text>
            <Text style={s.statLabel}>Rango</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statChip}>
            <Text style={s.statValue}>{xp.totalXp}</Text>
            <Text style={s.statLabel}>XP total</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statChip}>
            <Text style={s.statValue}>{streak.currentStreak}</Text>
            <Text style={s.statLabel}>
              {streak.currentStreak === 1 ? "día racha" : "días racha"}
            </Text>
          </View>
        </View>
      ) : null}

      {/* ── Editar perfil ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Editar perfil</Text>

        <TextInput
          style={s.input}
          placeholder="Nombre"
          placeholderTextColor={theme.colors.muted}
          value={name}
          onChangeText={setName}
          editable={!isSaving}
        />
        <TextInput
          style={[s.input, s.inputDisabled]}
          placeholder="Email"
          placeholderTextColor={theme.colors.muted}
          value={email}
          editable={false}
        />
        <TextInput
          style={s.input}
          placeholder="URL de avatar remoto (opcional)"
          placeholderTextColor={theme.colors.muted}
          value={isPixelToken(avatarUrl) ? "" : avatarUrl}
          onChangeText={(val) => {
            setAvatarUrl(val);
            setAvatarImageFailed(false);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSaving}
        />

        {error ? <Text style={s.errorText}>{error}</Text> : null}
        {successMessage ? <Text style={s.successText}>{successMessage}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            s.btnPrimary,
            (isSaving) && s.btnDisabled,
            pressed && !isSaving && { opacity: 0.8 },
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={s.btnPrimaryText}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>
      </View>

      {/* ── Grupo ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Grupo</Text>
        <Pressable
          style={({ pressed }) => [s.btnSecondary, pressed && { opacity: 0.7 }]}
          onPress={clearGroup}
        >
          <Text style={s.btnSecondaryText}>Cambiar de grupo</Text>
        </Pressable>

        {canConfigureGroup ? (
          <Pressable
            style={({ pressed }) => [
              s.btnSecondary,
              s.itemGap,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleGoToGroupSettings}
          >
            <Text style={s.btnSecondaryText}>Configuración del grupo</Text>
          </Pressable>
        ) : null}
      </View>

      {/* ── Apariencia ── */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Apariencia</Text>
        <View style={{ flexDirection: "row", gap: theme.spacing[2] }}>
          {(["Sistema", "Claro", "Oscuro"] as const).map((label) => {
            const val: "light" | "dark" | null =
              label === "Sistema" ? null : label === "Claro" ? "light" : "dark";
            const isActive = themeOverride === val;
            return (
              <Pressable
                key={label}
                style={({ pressed }) => [
                  s.btnSecondary,
                  { flex: 1, justifyContent: "center" },
                  isActive && {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setThemeOverride(val)}
              >
                <Text
                  style={[
                    s.btnSecondaryText,
                    isActive && { color: theme.colors.primaryText },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Sesión ── */}
      <View style={s.card}>
        <Pressable
          style={({ pressed }) => [
            s.btnDanger,
            isLoggingOut && s.btnDisabled,
            pressed && !isLoggingOut && { opacity: 0.8 },
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={s.btnDangerText}>
            {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </Text>
        </Pressable>
      </View>

    </ScrollView>
  );
}