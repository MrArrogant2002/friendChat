import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Avatar, Button, Checkbox, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLoginMutation } from '@/hooks/useAuthApi';
import { borderRadius, spacing } from '@/theme';
import type { AuthStackScreenProps } from '@/types/navigation';

const LoginScreen: React.FC<AuthStackScreenProps<'Login'>> = ({ navigation }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { mutate: authenticate, loading, error, reset } = useLoginMutation();

  // Load saved credentials on mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await SecureStore.getItemAsync('saved_email');
      const savedPassword = await SecureStore.getItemAsync('saved_password');
      const savedTimestamp = await SecureStore.getItemAsync('saved_timestamp');

      if (savedEmail && savedPassword && savedTimestamp) {
        const timestamp = parseInt(savedTimestamp, 10);
        const daysPassed = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

        // Check if credentials are still valid (within 30 days)
        if (daysPassed <= 30) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        } else {
          // Clear expired credentials
          await clearSavedCredentials();
        }
      }
    } catch (error) {
      console.log('Error loading saved credentials:', error);
    }
  };

  const clearSavedCredentials = async () => {
    try {
      await SecureStore.deleteItemAsync('saved_email');
      await SecureStore.deleteItemAsync('saved_password');
      await SecureStore.deleteItemAsync('saved_timestamp');
    } catch (error) {
      console.log('Error clearing credentials:', error);
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await SecureStore.setItemAsync('saved_email', email);
        await SecureStore.setItemAsync('saved_password', password);
        await SecureStore.setItemAsync('saved_timestamp', Date.now().toString());
      } else {
        await clearSavedCredentials();
      }
    } catch (error) {
      console.log('Error saving credentials:', error);
    }
  };

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
      // Save credentials if remember me is checked
      await saveCredentials();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('AppTabs');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

          {/* Avatar (for saved account state) */}
          {rememberMe && email && (
            <View style={styles.avatarContainer}>
              <Avatar.Text
                size={90}
                label={email.slice(0, 2).toUpperCase()}
                style={{ backgroundColor: theme.colors.primary }}
                labelStyle={{ fontSize: 36, fontWeight: '600', color: '#FFFFFF' }}
              />
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.onBackground,
                  fontWeight: '600',
                  marginTop: spacing.md,
                }}
              >
                {email.split('@')[0]}
              </Text>
            </View>
          )}

          {/* Login Form */}
          <View style={styles.formContainer}>
            <TextInput
              mode="outlined"
              placeholder="Username or email"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={email}
              onChangeText={handleEmailChange}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                {
                  backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                },
              ]}
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
              onChangeText={handlePasswordChange}
              secureTextEntry={secure}
              style={[
                styles.input,
                {
                  backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                },
              ]}
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
                  icon={secure ? 'eye-off' : 'eye'}
                  onPress={() => setSecure(!secure)}
                  forceTextInputFocus={false}
                />
              }
            />

            {/* Remember Me Checkbox */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRememberMe(!rememberMe);
              }}
              style={styles.rememberMeContainer}
            >
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
                color={theme.colors.primary}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginLeft: spacing.xs }}
              >
                Remember me
              </Text>
            </Pressable>

            {/* Forgot Password */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.forgotPassword}
            >
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.primary, fontWeight: '600' }}
              >
                Forgot password?
              </Text>
            </Pressable>

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={[
                styles.loginButton,
                {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              labelStyle={styles.loginButtonText}
              contentStyle={styles.loginButtonContent}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </Button>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.error, textAlign: 'center' }}
                >
                  {error.message}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Section */}
        <View
          style={[
            styles.bottomContainer,
            { borderTopColor: theme.colors.outline, backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.signupContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Don't have an account?{' '}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Register');
              }}
            >
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.primary, fontWeight: '600' }}
              >
                Sign up.
              </Text>
            </Pressable>
          </View>

          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md }}
          >
            FriendlyChat © 2025
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

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
    paddingTop: spacing.xxxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  formContainer: {
    marginTop: spacing.lg,
  },
  input: {
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  loginButton: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  loginButtonContent: {
    paddingVertical: spacing.xs,
  },
  loginButtonText: {
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
