import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRegisterMutation } from '@/hooks/useAuthApi';
import { borderRadius, spacing } from '@/theme';
import type { AuthStackScreenProps } from '@/types/navigation';

const RegisterScreen: React.FC<AuthStackScreenProps<'Register'>> = ({ navigation }) => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const { mutate: createAccount, loading, error, reset } = useRegisterMutation();

  const errors = useMemo(() => {
    const nameError = submitted && name.trim().length < 2;
    const emailError = submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordError = submitted && password.length < 6;
    const confirmError = submitted && password !== confirmPassword;
    return { name: nameError, email: emailError, password: passwordError, confirm: confirmError };
  }, [name, email, password, confirmPassword, submitted]);

  const handleRegister = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitted(true);
    if (errors.name || errors.email || errors.password || errors.confirm) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    try {
      await createAccount({ name, email, password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('AppTabs');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleFieldChange = (setter: (value: string) => void) => (value: string) => {
    if (error) {
      reset();
    }
    setter(value);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* FriendlyChat Logo */}
          <View style={styles.logoContainer}>
            {/* Emoji Logo */}
            <View style={[styles.logoCircle, { backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)', borderColor: theme.colors.primary }]}>
              <Text style={styles.logoEmoji}>💬</Text>
            </View>
            <Text
              style={[
                styles.logoText,
                {
                  color: theme.colors.onBackground,
                  fontFamily: Platform.select({
                    ios: 'System',
                    android: 'Roboto',
                    default: 'sans-serif',
                  }),
                },
              ]}
            >
              FriendlyChat
            </Text>
          </View>

          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center',
              marginBottom: spacing.xl,
              paddingHorizontal: spacing.xl,
            }}
          >
            Sign up to chat and connect with your friends.
          </Text>

          {/* Sign Up Form */}
          <View style={styles.formContainer}>
            <TextInput
              mode="outlined"
              placeholder="Full name"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={name}
              onChangeText={handleFieldChange(setName)}
              autoCapitalize="words"
              style={[styles.input, { backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }]}
              outlineStyle={{
                borderColor: theme.colors.outline,
                borderWidth: 1,
                borderRadius: borderRadius.sm,
              }}
              textColor={theme.colors.onBackground}
              error={errors.name}
              dense
            />

            <TextInput
              mode="outlined"
              placeholder="Email"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={email}
              onChangeText={handleFieldChange(setEmail)}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }]}
              outlineStyle={{
                borderColor: theme.colors.outline,
                borderWidth: 1,
                borderRadius: borderRadius.sm,
              }}
              textColor={theme.colors.onBackground}
              error={errors.email}
              dense
            />

            <TextInput
              mode="outlined"
              placeholder="Password"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={password}
              onChangeText={handleFieldChange(setPassword)}
              secureTextEntry={securePassword}
              style={[styles.input, { backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }]}
              outlineStyle={{
                borderColor: theme.colors.outline,
                borderWidth: 1,
                borderRadius: borderRadius.sm,
              }}
              textColor={theme.colors.onBackground}
              error={errors.password}
              dense
              right={
                <TextInput.Icon
                  icon={securePassword ? 'eye-off' : 'eye'}
                  onPress={() => setSecurePassword(!securePassword)}
                  forceTextInputFocus={false}
                />
              }
            />

            <TextInput
              mode="outlined"
              placeholder="Confirm password"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={confirmPassword}
              onChangeText={handleFieldChange(setConfirmPassword)}
              secureTextEntry={secureConfirm}
              style={[styles.input, { backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }]}
              outlineStyle={{
                borderColor: theme.colors.outline,
                borderWidth: 1,
                borderRadius: borderRadius.sm,
              }}
              textColor={theme.colors.onBackground}
              error={errors.confirm}
              dense
              right={
                <TextInput.Icon
                  icon={secureConfirm ? 'eye-off' : 'eye'}
                  onPress={() => setSecureConfirm(!secureConfirm)}
                  forceTextInputFocus={false}
                />
              }
              onSubmitEditing={handleRegister}
              returnKeyType="go"
            />

            {/* Sign Up Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={[styles.signUpButton, { backgroundColor: theme.colors.primary }]}
              labelStyle={styles.signUpButtonText}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text variant="bodySmall" style={{ color: theme.colors.error, textAlign: 'center' }}>
                  {error.message}
                </Text>
              </View>
            )}

            {/* Terms */}
            <Text
              variant="labelSmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: spacing.lg,
                lineHeight: 16,
              }}
            >
              By signing up, you agree to our Terms, Data Policy and Cookies Policy.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Section */}
        <View
          style={[
            styles.bottomContainer,
            { borderTopColor: theme.colors.outline, backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.loginContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Have an account?{' '}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Login');
              }}
            >
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                Log in.
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoEmoji: {
    fontSize: 50,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  formContainer: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  input: {
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  signUpButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.sm,
  },
  signUpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  bottomContainer: {
    borderTopWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
