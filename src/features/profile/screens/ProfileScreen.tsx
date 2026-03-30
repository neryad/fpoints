import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  type ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { colors } from "../../../core/theme/colors";
import { signOut } from "../../auth/services/auth.service";
import { getMyRoleInGroup } from "../../tasks/services/tasks.service";
import { getMyProfile, saveMyProfile } from "../services/profile.service";
import {
  getMyXpSummary,
  type XpSummary,
} from "../../gamification/services/xp.service";
import {
  getMyStreakSummary,
  type StreakSummary,
} from "../../gamification/services/streak.service";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

export function ProfileScreen({ navigation }: Props) {
  const { clearGroup, activeGroupId, activeGroupName } = useAppSession();
  const [profileId, setProfileId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [canConfigureGroup, setCanConfigureGroup] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [xp, setXp] = useState<XpSummary | null>(null);
  const [streak, setStreak] = useState<StreakSummary | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setError("");
      setIsLoadingProfile(true);
      const profile = await getMyProfile();
      setProfileId(profile.id);
      setName(profile.name ?? "");
      setEmail(profile.email);
      setAvatarUrl(profile.avatarUrl ?? "");
      setAvatarImageFailed(false);

      if (activeGroupId) {
        const role = await getMyRoleInGroup(activeGroupId);
        setRole(role);
        setCanConfigureGroup(role === "owner" || role === "sub_owner");
        const [myXp, myStreak] = await Promise.all([
          getMyXpSummary(activeGroupId),
          getMyStreakSummary(activeGroupId),
        ]);
        setXp(myXp);
        setStreak(myStreak);
      } else {
        setCanConfigureGroup(false);
        setRole(null);
        setXp(null);
        setStreak(null);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrio un error al cargar perfil.";
      setError(message);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSaveProfile() {
    try {
      setError("");
      setSuccessMessage("");
      setIsSaving(true);
      const profile = await saveMyProfile({ name, avatarUrl });
      setProfileId(profile.id);
      setName(profile.name ?? "");
      setEmail(profile.email);
      setAvatarUrl(profile.avatarUrl ?? "");
      setAvatarImageFailed(false);
      setSuccessMessage("Perfil guardado correctamente.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrio un error al guardar perfil.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      setError("");
      setIsLoading(true);
      await signOut();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cerrar sesión.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNextLocalAvatar() {
    const roleKey = toRoleKey(role);
    const options = LOCAL_AVATARS_BY_ROLE[roleKey];
    const current = getLocalAvatarSelection(
      role,
      profileId || email || name,
      avatarUrl,
    );
    const nextIndex = (current.index + 1) % options.length;
    setAvatarUrl(buildLocalAvatarToken(roleKey, nextIndex));
    setAvatarImageFailed(false);
    setSuccessMessage("Avatar local seleccionado. Guarda para confirmar.");
  }

  const trimmedAvatarUrl = avatarUrl.trim();
  const localAvatar = getLocalAvatarSelection(
    role,
    profileId || email || name,
    trimmedAvatarUrl,
  );
  const shouldUseRemoteAvatar =
    trimmedAvatarUrl.length > 0 &&
    !avatarImageFailed &&
    !isLocalAvatarToken(trimmedAvatarUrl);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ── Avatar + nombre ── */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          {shouldUseRemoteAvatar ? (
            <Image
              source={{ uri: trimmedAvatarUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() => setAvatarImageFailed(true)}
            />
          ) : (
            <Image
              source={localAvatar.source}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          )}
        </View>
        <View style={styles.avatarActionsRow}>
          <Button title="Cambiar avatar" onPress={handleNextLocalAvatar} />
        </View>
        <Text style={styles.avatarMetaText}>
          Avatar local {localAvatar.index + 1} de {localAvatar.total}
        </Text>
        <Text style={styles.profileName}>{name || "Sin nombre"}</Text>
        <Text style={styles.profileEmail}>{email}</Text>
        {activeGroupName ? (
          <Text style={styles.groupLabel}>
            {activeGroupName}
            {role ? ` · ${ROLE_LABELS[role] ?? role}` : ""}
          </Text>
        ) : null}
      </View>

      {/* ── Stats strip ── */}
      {isLoadingProfile ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loader}
        />
      ) : xp && streak ? (
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{xp.levelName}</Text>
            <Text style={styles.statLabel}>Rango</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{xp.totalXp}</Text>
            <Text style={styles.statLabel}>XP total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{streak.currentStreak}</Text>
            <Text style={styles.statLabel}>
              {streak.currentStreak === 1 ? "dia racha" : "dias racha"}
            </Text>
          </View>
        </View>
      ) : null}

      {/* ── Editar perfil ── */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Editar perfil</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
          editable={!isSaving && !isLoading}
        />
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          editable={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Avatar URL (opcional)"
          placeholderTextColor={colors.muted}
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          autoCapitalize="none"
          editable={!isSaving && !isLoading}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}
        <Button
          title={isSaving ? "Guardando..." : "Guardar cambios"}
          onPress={handleSaveProfile}
          disabled={isSaving || isLoading}
        />
      </View>

      {/* ── Acciones ── */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Grupo</Text>
        <Button title="Cambiar de grupo" onPress={clearGroup} />
        {canConfigureGroup ? (
          <View style={styles.actionSpacer}>
            <Button
              title="Configuracion del grupo"
              onPress={() => navigation.navigate("GroupSettings")}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Button
          title={isLoading ? "Cerrando sesion..." : "Cerrar sesion"}
          onPress={handleLogout}
          disabled={isLoading}
          color="#B42318"
        />
      </View>
    </ScrollView>
  );
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  sub_owner: "Sub-propietario",
  member: "Miembro",
};

type RoleKey = "member" | "owner" | "sub_owner";
const LOCAL_AVATAR_TOKEN_PREFIX = "local-avatar://";

const LOCAL_AVATARS_BY_ROLE: Record<RoleKey, ImageSourcePropType[]> = {
  member: [
    require("../../../../assets/avatars/members/splitanimage-r1-c1.png"),
    require("../../../../assets/avatars/members/splitanimage-r1-c2.png"),
    require("../../../../assets/avatars/members/splitanimage-r1-c3.png"),
  ],
  owner: [
    require("../../../../assets/avatars/ownner/splitanimage-r4-c3.png"),
    require("../../../../assets/avatars/ownner/splitanimage-r4-c4.png"),
    require("../../../../assets/avatars/ownner/splitanimage-r4-c5.png"),
  ],
  sub_owner: [
    require("../../../../assets/avatars/sub-owner/splitanimage-r3-c1.png"),
    require("../../../../assets/avatars/sub-owner/splitanimage-r3-c2.png"),
    require("../../../../assets/avatars/sub-owner/splitanimage-r3-c3.png"),
  ],
};

function toRoleKey(role: string | null): RoleKey {
  if (role === "owner") return "owner";
  if (role === "sub_owner") return "sub_owner";
  return "member";
}

function stableHash(seed: string) {
  if (!seed) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function isLocalAvatarToken(value: string) {
  return value.startsWith(LOCAL_AVATAR_TOKEN_PREFIX);
}

function parseLocalAvatarToken(value: string): { index: number } | null {
  if (!isLocalAvatarToken(value)) return null;
  const parts = value.replace(LOCAL_AVATAR_TOKEN_PREFIX, "").split("/");
  if (parts.length !== 2) return null;
  const index = Number(parts[1]);
  if (!Number.isInteger(index) || index < 0) return null;
  return { index };
}

function buildLocalAvatarToken(roleKey: RoleKey, index: number) {
  return `${LOCAL_AVATAR_TOKEN_PREFIX}${roleKey}/${index}`;
}

function getLocalAvatarSelection(
  role: string | null,
  userSeed: string,
  avatarUrl: string,
): { source: ImageSourcePropType; index: number; total: number } {
  const roleKey = toRoleKey(role);
  const options = LOCAL_AVATARS_BY_ROLE[roleKey];
  const parsed = parseLocalAvatarToken(avatarUrl);
  const index =
    parsed !== null
      ? parsed.index % options.length
      : stableHash(userSeed) % options.length;
  return {
    source: options[index],
    index,
    total: options.length,
  };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: 24,
    paddingBottom: 48,
  },
  loader: {
    marginVertical: 16,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarActionsRow: {
    marginBottom: 6,
  },
  avatarMetaText: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  profileEmail: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },
  groupLabel: {
    marginTop: 6,
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 14,
    overflow: "hidden",
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.muted,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
    color: colors.text,
    fontSize: 14,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: "#B42318",
    marginBottom: 10,
    fontSize: 13,
  },
  successText: {
    color: "#0B6E4F",
    marginBottom: 10,
    fontSize: 13,
  },
  actionSpacer: {
    marginTop: 10,
  },
});
