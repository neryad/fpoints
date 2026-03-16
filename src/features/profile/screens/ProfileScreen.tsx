import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useAppSession } from '../../../app/providers/AppSessionProvider';
import { colors } from '../../../core/theme/colors';
import { signOut } from '../../auth/services/auth.service';

export function ProfileScreen() {
  const { clearGroup } = useAppSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    try {
      setError('');
      setIsLoading(true);
      await signOut();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ocurrió un error al cerrar sesión.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Stage 1 placeholder for stats and group settings.</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button title="Switch Group" onPress={clearGroup} />

      <View style={styles.spacer} />

      <Button
        title={isLoading ? 'Closing session...' : 'Logout'}
        onPress={handleLogout}
        disabled={isLoading}
      />
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
  errorText: {
    width: '100%',
    color: '#B42318',
    marginBottom: 12,
    textAlign: 'center',
  },
  spacer: {
    height: 12,
  },
});