import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../../core/theme/colors';
import { TasksStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<TasksStackParamList, 'TaskDetail'>;

export function TaskDetailScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Detail</Text>
      <Text style={styles.subtitle}>Task id: {route.params.taskId}</Text>
      <Text style={styles.subtitle}>Completion and proof flow will be added in Weeks 4-5.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    color: colors.muted,
    textAlign: 'center',
  },
});
