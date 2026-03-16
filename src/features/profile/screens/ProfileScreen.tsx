import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useAppSession } from '../../../app/providers/AppSessionProvider';
import { colors } from '../../../core/theme/colors';

export function ProfileScreen() {
  const { clearGroup, logout } = useAppSession();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Stage 1 placeholder for stats and group settings.</Text>
      <Button title="Switch Group" onPress={clearGroup} />
      <View style={styles.spacer} />
      <Button title="Logout" onPress={logout} />
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
