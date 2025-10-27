import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
    Button,
    HelperText,
    IconButton,
    Surface,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';

import { useLoginMutation } from '@/hooks/useAuthApi';
import type { AuthStackScreenProps } from '@/types/navigation';

const LoginScreen: React.FC<AuthStackScreenProps<'Login'>> = ({ navigation }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('demo@friendly.chart');
  const [password, setPassword] = useState('password');
  const [secure, setSecure] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const { mutate: authenticate, loading, error, reset } = useLoginMutation();

  const errors = useMemo(() => {
    const emailError = submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordError = submitted && password.length < 6;
    return { email: emailError, password: passwordError };
  }, [email, password, submitted]);

  const handleLogin = async () => {
    setSubmitted(true);
    if (errors.email || errors.password) {
      return;
    }
    try {
      await authenticate({ email, password });
      navigation.replace('AppTabs');
    } catch {
      // Error state handled via hook; no further action needed here.
    }
  };

  const handleEmailChange = (value: string) => {
    if (error) {
      reset();
    }
    setEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    if (error) {
      reset();
    }
    setPassword(value);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Surface style={styles.card} mode="flat">
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          Welcome back
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Sign in with your credentials to continue.
        </Text>

        <View style={styles.fieldGroup}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            error={errors.email}
            left={<TextInput.Icon icon="email" />}
          />
          <HelperText type="error" visible={errors.email}>
            Please enter a valid email address.
          </HelperText>
        </View>

        <View style={styles.fieldGroup}>
          <TextInput
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={secure}
            mode="outlined"
            error={errors.password}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={secure ? 'eye-off' : 'eye'}
                onPress={() => setSecure((prev) => !prev)}
                forceTextInputFocus={false}
              />
            }
          />
          <HelperText type="error" visible={errors.password}>
            Password must be at least 6 characters.
          </HelperText>
        </View>

        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          loading={loading}
          disabled={loading}
        >
          Continue
        </Button>

        <HelperText type="error" visible={Boolean(error)}>
          {error?.message ?? ''}
        </HelperText>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Register')}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
        >
          New here? Create an account
        </Button>
      </Surface>

      <IconButton
        icon="help-circle"
        size={20}
        onPress={() => navigation.replace('AppTabs')}
        style={styles.skipIcon}
        iconColor={theme.colors.onBackground}
        accessibilityLabel="Skip to demo"
      />
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

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
  fieldGroup: {
    gap: 4,
  },
  subtitle: {
    lineHeight: 22,
  },
  secondaryButton: {
    borderRadius: 12,
  },
  primaryButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  skipIcon: {
    alignSelf: 'center',
    marginTop: 16,
  },
});
