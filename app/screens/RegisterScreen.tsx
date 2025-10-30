import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import React, { useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Image as RNImage,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { HelperText, IconButton, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRegisterMutation } from '@/hooks/useAuthApi';
import { borderRadius, shadows, spacing } from '@/theme';
import type { AuthStackScreenProps } from '@/types/navigation';

const RegisterScreen: React.FC<AuthStackScreenProps<'Register'>> = ({ navigation }) => {
  const theme = useTheme();
  const [name, setName] = useState('Demo User');
  const [email, setEmail] = useState('demo@friendly.chart');
  const [password, setPassword] = useState('password');
  const [confirmPassword, setConfirmPassword] = useState('password');
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
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600 }}
            style={styles.logoContainer}
          >
            <RNImage
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text
              variant="displaySmall"
              style={{
                color: theme.colors.primary,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              FriendlyChart
            </Text>
            <Text
              variant="bodyLarge"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: spacing.sm,
              }}
            >
              Join the conversation
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
          >
            <Surface
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
                shadows.lg,
              ]}
              elevation={2}
            >
              <Text
                variant="headlineMedium"
                style={{
                  color: theme.colors.onSurface,
                  fontWeight: '600',
                }}
              >
                Create account
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginTop: spacing.xs,
                  marginBottom: spacing.sm,
                }}
              >
                Fill in your details
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
                  style={{ backgroundColor: theme.colors.surface }}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                />
                {errors.name && (
                  <HelperText type="error" visible={errors.name}>
                    Please provide your name
                  </HelperText>
                )}
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
                  style={{ backgroundColor: theme.colors.surface }}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                />
                {errors.email && (
                  <HelperText type="error" visible={errors.email}>
                    Enter a valid email address
                  </HelperText>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={handleFieldChange(setPassword)}
                  secureTextEntry={securePassword}
                  mode="outlined"
                  error={errors.password}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={securePassword ? 'eye-off' : 'eye'}
                      onPress={() => {
                        setSecurePassword((prev) => !prev);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      forceTextInputFocus={false}
                    />
                  }
                  style={{ backgroundColor: theme.colors.surface }}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                />
                {errors.password && (
                  <HelperText type="error" visible={errors.password}>
                    Password must be at least 6 characters
                  </HelperText>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <TextInput
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={handleFieldChange(setConfirmPassword)}
                  secureTextEntry={secureConfirm}
                  mode="outlined"
                  error={errors.confirm}
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon
                      icon={secureConfirm ? 'eye-off' : 'eye'}
                      onPress={() => {
                        setSecureConfirm((prev) => !prev);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      forceTextInputFocus={false}
                    />
                  }
                  style={{ backgroundColor: theme.colors.surface }}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                  onSubmitEditing={handleRegister}
                  returnKeyType="go"
                />
                {errors.confirm && (
                  <HelperText type="error" visible={errors.confirm}>
                    Passwords must match
                  </HelperText>
                )}
              </View>

              {/* Create Account Button - Always visible */}
              <Pressable
                onPress={handleRegister}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: loading ? '#66BB6A' : '#4CAF50',
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                accessible={true}
                accessibilityLabel="Create account button"
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Text>
              </Pressable>

              {error && (
                <MotiView
                  from={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300 }}
                >
                  <Surface
                    style={[
                      styles.errorContainer,
                      { backgroundColor: theme.colors.errorContainer },
                    ]}
                  >
                    <IconButton
                      icon="alert-circle"
                      size={20}
                      iconColor={theme.colors.error}
                      style={{ margin: 0 }}
                    />
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: theme.colors.onErrorContainer,
                        flex: 1,
                      }}
                    >
                      {error.message}
                    </Text>
                  </Surface>
                </MotiView>
              )}

              <View style={styles.divider}>
                <View
                  style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]}
                />
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    paddingHorizontal: spacing.sm,
                  }}
                >
                  or
                </Text>
                <View
                  style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]}
                />
              </View>

              {/* Secondary Button - Sign In */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('Login');
                }}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderWidth: 2,
                    borderColor: '#4CAF50',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessible={true}
                accessibilityLabel="Sign in button"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.dark ? '#66BB6A' : '#2E7D32' },
                  ]}
                >
                  Already have an account? Sign in
                </Text>
              </Pressable>
            </Surface>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
  },
  fieldGroup: {
    marginBottom: spacing.sm,
  },
  primaryButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    marginTop: spacing.sm,
    // Shadows for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#388E3C',
  },
  primaryButtonText: {
    color: '#000000ff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  secondaryButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    marginTop: spacing.sm,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
