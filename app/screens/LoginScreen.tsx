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
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginTop: spacing.xs,
                  marginBottom: spacing.md,
                  lineHeight: 22,
                }}
              >
                Sign in with your credentials to continue
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
                />
                {errors.password && (
                  <HelperText type="error" visible={errors.password}>
                    Password must be at least 6 characters
                  </HelperText>
                )}
              </View>

              <View style={{ marginTop: spacing.lg, width: '100%', alignItems: 'center' }}>
                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    {
                      backgroundColor: loading ? '#A5D6A7' : '#2E7D32',
                      opacity: pressed ? 0.9 : 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4.65,
                      elevation: 8,
                      width: '100%',
                      borderWidth: 1,
                      borderColor: '#1B5E20',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: 18,
                      letterSpacing: 0.5,
                      textAlign: 'center',
                    }}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Text>
                </Pressable>
              </View>

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

              <View style={{ marginTop: spacing.sm, width: '100%', alignItems: 'center' }}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Register');
                  }}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: '#FFFFFF',
                      borderWidth: 2,
                      borderColor: '#4CAF50',
                      opacity: pressed ? 0.7 : 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.15,
                      shadowRadius: 2,
                      elevation: 2,
                      width: '100%',
                    },
                  ]}
                >
                  <Text
                    variant="labelLarge"
                    style={{
                      color: '#4CAF50',
                      fontWeight: '600',
                      fontSize: 17,
                      letterSpacing: 0.5,
                    }}
                  >
                    New here? Create an account
                  </Text>
                </Pressable>
              </View>
            </Surface>
          </MotiView>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.replace('AppTabs');
            }}
            style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <IconButton icon="arrow-right-circle" size={24} iconColor={theme.colors.primary} />
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                fontWeight: '500',
              }}
            >
              Skip to demo
            </Text>
          </Pressable>
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  primaryButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
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
    marginVertical: spacing.lg,
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
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
  },
});
