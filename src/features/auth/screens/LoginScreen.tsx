import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSession } from '../../../app/providers/AppSessionProvider';
import { colors } from '../../../core/theme/colors';
import { AuthStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAppSession();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>fpoints</Text>
      <Text style={styles.subtitle}>Stage 1 Foundation: Login screen stub</Text>
      <Button title="Simulate Login" onPress={login} />
      <View style={styles.spacer} />
      <Button title="Go to Register" onPress={() => navigation.navigate('Register')} />
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
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.muted,
  },
  spacer: {
    height: 12,
  },
});
