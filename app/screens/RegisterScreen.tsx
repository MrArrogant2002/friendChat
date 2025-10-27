import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
    Button,
    HelperText,
    Surface,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';

import { useRegisterMutation } from '@/hooks/useAuthApi';
import type { AuthStackScreenProps } from '@/types/navigation';

const RegisterScreen: React.FC<AuthStackScreenProps<'Register'>> = ({ navigation }) => {
  const theme = useTheme();
  const [name, setName] = useState('Demo User');
  const [email, setEmail] = useState('demo@friendly.chart');
  const [password, setPassword] = useState('password');
  const [confirmPassword, setConfirmPassword] = useState('password');
  const [submitted, setSubmitted] = useState(false);
  const { mutate: createAccount, loading, error, reset } = useRegisterMutation();

  const errors = useMemo(() => {
    const nameError = submitted && name.trim().length < 2;
    const emailError = submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordError = submitted && password.length < 6;
    const confirmError = submitted && password !== confirmPassword;
    return { name: nameError, email: emailError, password: passwordError, confirm: confirmError };
  }, [name, email, password, confirmPassword, submitted]);

  const handleRegister = async () => {
    setSubmitted(true);
    if (errors.name || errors.email || errors.password || errors.confirm) {
      return;
    }
    try {
      await createAccount({ name, email, password });
      navigation.replace('AppTabs');
    } catch {
      // Error surfaced through helper text.
    }
  };

  const handleFieldChange = (setter: (value: string) => void) => (value: string) => {
    if (error) {
      reset();
    }
    setter(value);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Surface style={styles.card} mode="flat">
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          Join FriendChat
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Create an account to share insights and chat in real time.
        </Text>

        <View style={styles.fieldGroup}>
          <TextInput
            label="Display name"
            value={name}
            onChangeText={handleFieldChange(setName)}
            autoCapitalize="words"
            mode="outlined"
            error={errors.name}
            left={<TextInput.Icon icon="account" />}
          />
          <HelperText type="error" visible={errors.name}>
            Please provide your name.
          </HelperText>
        </View>

        <View style={styles.fieldGroup}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={handleFieldChange(setEmail)}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            error={errors.email}
            left={<TextInput.Icon icon="email" />}
          />
          <HelperText type="error" visible={errors.email}>
            Enter a valid email address.
          </HelperText>
        </View>

        <View style={styles.fieldGroup}>
          <TextInput
            label="Password"
            value={password}
            onChangeText={handleFieldChange(setPassword)}
            secureTextEntry
            mode="outlined"
            error={errors.password}
            left={<TextInput.Icon icon="lock" />}
          />
          <HelperText type="error" visible={errors.password}>
            Password must be at least 6 characters.
          </HelperText>
        </View>

        <View style={styles.fieldGroup}>
          <TextInput
            label="Confirm password"
            value={confirmPassword}
            onChangeText={handleFieldChange(setConfirmPassword)}
            secureTextEntry
            mode="outlined"
            error={errors.confirm}
            left={<TextInput.Icon icon="lock-check" />}
          />
          <HelperText type="error" visible={errors.confirm}>
            Passwords must match.
          </HelperText>
        </View>

        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          loading={loading}
          disabled={loading}
        >
          Create account
        </Button>

        <HelperText type="error" visible={Boolean(error)}>
          {error?.message ?? ''}
        </HelperText>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
        >
          Already have an account? Sign in
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    gap: 20,
    elevation: 2,
  },
  subtitle: {
    lineHeight: 22,
  },
  fieldGroup: {
    gap: 4,
  },
  primaryButton: {
    borderRadius: 12,
  },
  secondaryButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 10,
  },
});
