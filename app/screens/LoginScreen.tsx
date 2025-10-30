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

import { useLoginMutation } from '@/hooks/useAuthApi';
import { borderRadius, shadows, spacing } from '@/theme';
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitted(true);
    if (errors.email || errors.password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    try {
      await authenticate({ email, password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('AppTabs');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
              Connect with friends instantly
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
                Welcome back
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginTop: spacing.xs,
                  marginBottom: spacing.sm,
                }}
              >
                Sign in to continue
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
                  style={{ backgroundColor: theme.colors.surface }}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                />
                {errors.email && (
                  <HelperText type="error" visible={errors.email}>
                    Please enter a valid email address
                  </HelperText>
                )}
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
                      onPress={() => {
                        setSecure((prev) => !prev);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      forceTextInputFocus={false}
                    />
                  }
                  style={{ backgroundColor: theme.colors.surface }}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                  onSubmitEditing={handleLogin}
                  returnKeyType="go"
                />
                {errors.password && (
                  <HelperText type="error" visible={errors.password}>
                    Password must be at least 6 characters
                  </HelperText>
                )}
              </View>

              {/* Sign In Button - Always visible */}
              <Pressable
                onPress={handleLogin}
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
                accessibilityLabel="Sign in button"
                accessibilityRole="button"
              >
                <Text
                  style={styles.primaryButtonText}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
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

              {/* Secondary Button - Create Account */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('Register');
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
                accessibilityLabel="Create account button"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.dark ? '#66BB6A' : '#2E7D32' },
                  ]}
                >
                  New here? Create an account
                </Text>
              </Pressable>
            </Surface>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

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
