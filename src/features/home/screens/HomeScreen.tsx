import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../core/theme/colors';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Dashboard</Text>
      <Text style={styles.subtitle}>Stage 1 placeholder for summary widgets.</Text>
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
