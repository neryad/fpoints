import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../../core/theme/colors';
import { TasksStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<TasksStackParamList, 'TasksList'>;

export function TasksScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks List</Text>
      <Text style={styles.subtitle}>Stage 1 placeholder for assigned, pending and completed filters.</Text>
      <Button title="Open Demo Task" onPress={() => navigation.navigate('TaskDetail', { taskId: 'demo-task-1' })} />
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
    marginBottom: 20,
    color: colors.muted,
    textAlign: 'center',
  },
});
