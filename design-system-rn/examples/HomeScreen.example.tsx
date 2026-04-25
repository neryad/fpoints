import React from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import {
  GameBadge,
  RewardCard,
  StatCard,
  TaskCard,
  XpProgress,
} from "../components";

/**
 * QuestHome — pantalla "Inicio" de ejemplo.
 * Demuestra el uso conjunto de los componentes del design system.
 */
export default function HomeScreenExample() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-sans text-sm text-muted-foreground">Hola,</Text>
            <Text className="font-sans-bold text-2xl text-foreground">
              María 👋
            </Text>
          </View>
          <View className="flex-row gap-2">
            <GameBadge type="streak" value={7} label="días" />
            <GameBadge type="points" value={1240} />
          </View>
        </View>

        {/* XP */}
        <View className="rounded-2xl border border-border bg-card p-4">
          <XpProgress
            level={4}
            currentXp={320}
            requiredXp={500}
            label="Progreso semanal"
          />
        </View>

        {/* Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCard
              icon={<Text>✅</Text>}
              label="Completadas"
              value={12}
              trend="up"
              colorClass="text-success"
            />
          </View>
          <View className="flex-1">
            <StatCard
              icon={<Text>⏳</Text>}
              label="Pendientes"
              value={3}
              trend="neutral"
              colorClass="text-warning"
            />
          </View>
        </View>

        {/* Tareas */}
        <View className="gap-3">
          <Text className="font-sans-semibold text-base text-foreground">
            Tareas de hoy
          </Text>
          <TaskCard
            title="Sacar la basura"
            points={20}
            assignee="María"
            status="pending"
            category="Casa"
            dueLabel="Hoy 19:00"
          />
          <TaskCard
            title="Hacer la tarea de matemáticas"
            points={50}
            assignee="Lucas"
            status="submitted"
            category="Estudio"
          />
          <TaskCard
            title="Ordenar la habitación"
            points={30}
            status="approved"
            category="Casa"
          />
        </View>

        {/* Recompensas */}
        <View className="gap-3">
          <Text className="font-sans-semibold text-base text-foreground">
            Recompensas destacadas
          </Text>
          <RewardCard
            title="1 hora extra de pantalla"
            description="Disfruta de tiempo libre extra"
            cost={500}
            userPoints={1240}
          />
          <RewardCard
            title="Salida al cine"
            description="Elige tú la película"
            cost={2000}
            userPoints={1240}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}