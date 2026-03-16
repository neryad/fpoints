import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../core/theme/colors';

export function JoinGroupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Group</Text>
      <Text style={styles.subtitle}>Invite code flow will be added in Week 3.</Text>
      <Button title="Coming soon" onPress={() => {}} />
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
