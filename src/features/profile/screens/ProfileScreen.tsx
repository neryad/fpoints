import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../app/navigation/types";
import { useAppSession } from "../../../app/providers/AppSessionProvider";
import { useTheme } from "../../../core/theme/ThemeProvider";
import { StatCard } from "../../../components/ui/StatCard";
import { signOut } from "../../auth/services/auth.service";
import { getMyProfile, saveMyProfile } from "../services/profile.service";
import { getMyRoleInGroup } from "../../tasks/services/tasks.service";
import { getMyPointsBalance } from "../../home/services/points.service";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  sub_owner: "Sub-propietario",
  member: "Miembro",
};

const sectionLabel = "text-[11px] font-sans-medium text-muted-foreground uppercase tracking-[0.8px] mb-3";

export function ProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { activeGroupId, activeGroupName, clearGroup, logout } = useAppSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const profile = await getMyProfile();
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");

      if (activeGroupId) {
        const [r, p] = await Promise.all([
          getMyRoleInGroup(activeGroupId),
          getMyPointsBalance(activeGroupId),
        ]);
        setRole(r);
        setPoints(p);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el perfil.");
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadProfile);
    return unsubscribe;
  }, [navigation, loadProfile]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");
      await saveMyProfile({ name, avatarUrl });
      setSuccessMessage("Perfil guardado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  }, [name, avatarUrl]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar sesión.");
      setIsLoggingOut(false);
    }
  }, [logout]);

  const handleChangeGroup = useCallback(() => {
    clearGroup();
  }, [clearGroup]);

  const handleGroupSettings = useCallback(() => {
    navigation.navigate("GroupSettings");
  }, [navigation]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initial = (name || email || "?").charAt(0).toUpperCase();
  const isOwnerOrSubOwner = role === "owner" || role === "sub_owner";

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + nombre */}
          <View className="items-center pt-4 pb-5">
            <View className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary items-center justify-center mb-3">
              <Text className="text-3xl font-sans-bold text-primary">{initial}</Text>
            </View>
            <Text className="text-xl font-sans-bold text-foreground">
              {name || "Sin nombre"}
            </Text>
            <Text className="text-xs font-sans text-muted-foreground mt-0.5">
              {email}
            </Text>
            {activeGroupName && role ? (
              <View className="mt-2 flex-row items-center bg-primary/15 rounded-full px-3 py-1">
                <Text className="text-xs font-sans-semibold text-primary">
                  {activeGroupName} · {ROLE_LABELS[role] ?? role}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Stats */}
          {activeGroupId && points !== null ? (
            <View className="flex-row gap-2 mb-4">
              <View className="flex-1">
                <StatCard
                  icon="star"
                  label="Puntos"
                  value={points}
                  color="points"
                />
              </View>
              {role ? (
                <View className="flex-1">
                  <StatCard
                    icon="shield-checkmark"
                    label="Rol"
                    value={ROLE_LABELS[role] ?? role}
                    color="tasks"
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Editar perfil */}
          <View className="bg-card border border-border rounded-xl p-4 mb-3">
            <Text className={sectionLabel}>Editar perfil</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-3 text-sm text-foreground font-sans mb-2"
              placeholder="Nombre"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              editable={!isSaving}
            />
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-3 text-sm text-foreground font-sans mb-2 opacity-50"
              placeholder="Email"
              placeholderTextColor={colors.muted}
              value={email}
              editable={false}
            />
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-3 text-sm text-foreground font-sans mb-3"
              placeholder="URL de avatar (opcional)"
              placeholderTextColor={colors.muted}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
            />
            {error ? (
              <Text className="text-destructive text-xs font-sans mb-2">{error}</Text>
            ) : null}
            {successMessage ? (
              <Text className="text-success text-xs font-sans mb-2">{successMessage}</Text>
            ) : null}
            <Pressable
              className={`bg-primary rounded-xl py-4 items-center active:opacity-80 ${isSaving ? "opacity-40" : ""}`}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text className="text-sm font-sans-bold text-primary-foreground">
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Text>
            </Pressable>
          </View>

          {/* Grupo */}
          {activeGroupId ? (
            <View className="bg-card border border-border rounded-xl p-4 mb-3">
              <Text className={sectionLabel}>Grupo</Text>
              <Pressable
                className="bg-card border border-border rounded-xl py-3 items-center active:opacity-70 mb-2"
                onPress={handleChangeGroup}
              >
                <Text className="text-sm font-sans-medium text-foreground">Cambiar de grupo</Text>
              </Pressable>
              {isOwnerOrSubOwner ? (
                <Pressable
                  className="bg-card border border-primary rounded-xl py-3 items-center active:opacity-70"
                  onPress={handleGroupSettings}
                >
                  <Text className="text-sm font-sans-medium text-primary">Configuración del grupo</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Apariencia */}
          <View className="bg-card border border-border rounded-xl p-4 mb-3">
            <Text className={sectionLabel}>Apariencia</Text>
            <ThemeModeSelector />
          </View>

          {/* Sesión */}
          <View className="bg-card border border-border rounded-xl p-4">
            <Pressable
              className={`bg-destructive/15 border border-destructive rounded-xl py-4 items-center active:opacity-80 ${isLoggingOut ? "opacity-40" : ""}`}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <Text className="text-sm font-sans-bold text-destructive">
                {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ThemeModeSelector() {
  const { mode, setMode } = useTheme();

  const options = [
    { label: "Sistema", val: "system" as const },
    { label: "Claro", val: "light" as const },
    { label: "Oscuro", val: "dark" as const },
  ];

  return (
    <View className="flex-row gap-1 rounded-xl border border-border bg-muted p-1">
      {options.map(({ label, val }) => {
        const isActive = mode === val;
        return (
          <Pressable
            key={val}
            className={`flex-1 items-center py-2 rounded-lg active:opacity-80 ${isActive ? "bg-primary" : ""}`}
            onPress={() => setMode(val)}
          >
            <Text className={`text-xs font-sans-medium ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default ProfileScreen;
