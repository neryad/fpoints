import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../../core/theme/colors';
import { AuthStackParamList } from '../../../app/navigation/types';
import { signUpWithEmail } from '../services/auth.service';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleRegister() {
    try {
      setError('');
      setSuccessMessage('');
      setIsLoading(true);

      await signUpWithEmail(email, password);
      setSuccessMessage('Cuenta creada correctamente. Ahora puedes iniciar sesión.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ocurrió un error al registrarse.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Regístrate para empezar</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        editable={!isLoading}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        textContentType="password"
        editable={!isLoading}
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={handleRegister}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <Button
        title={isLoading ? 'Creando cuenta...' : 'Register'}
        onPress={handleRegister}
        disabled={isLoading}
      />

      <View style={styles.spacer} />

      <Button title="Back to Login" onPress={() => navigation.goBack()} />
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
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: colors.text,
  },
  errorText: {
    width: '100%',
    color: '#B42318',
    marginBottom: 12,
  },
  successText: {
    width: '100%',
    color: '#0B6E4F',
    marginBottom: 12,
  },
  spacer: {
    height: 12,
  },
});