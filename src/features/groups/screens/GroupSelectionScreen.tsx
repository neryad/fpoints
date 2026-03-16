import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSession } from '../../../app/providers/AppSessionProvider';
import { colors } from '../../../core/theme/colors';
import { GroupStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<GroupStackParamList, 'GroupSelection'>;

export function GroupSelectionScreen({ navigation }: Props) {
  const { selectGroup } = useAppSession();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Group</Text>
      <Text style={styles.subtitle}>Choose an existing group or create a new one.</Text>
      <Button title="Use Demo Group" onPress={selectGroup} />
      <View style={styles.spacer} />
      <Button title="Create Group" onPress={() => navigation.navigate('CreateGroup')} />
      <View style={styles.spacer} />
      <Button title="Join Group" onPress={() => navigation.navigate('JoinGroup')} />
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
  spacer: {
    height: 12,
  },
});
