import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '../theme/ThemeContext';
import useAuthStore from '../store/useAuthStore';
import { playLoginSound, playClickSound } from '../utils/feedback';
import { AuthSchema, AuthFormValues } from '../schemas';

import ForgotPasswordModal from '../components/shared/ForgotPasswordModal';

export interface AuthScreenProps {
  onLoginSuccess?: () => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  // Input refs for automatic focus navigation
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const login = useAuthStore((s) => s.login);

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(AuthSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  // Auto-fill demo credentials helper
  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    playClickSound();
    setValue('email', demoEmail, { shouldValidate: true });
    setValue('password', demoPass, { shouldValidate: true });
    clearErrors('root');
  };

  const handleLoginSubmit = handleSubmit(async (data) => {
    clearErrors('root');
    setLoading(true);

    const res = await login(data.email, data.password);
    setLoading(false);

    if (res.success && res.user) {
      playLoginSound();
      Toast.show({
        type: 'success',
        text1: `Welcome back, ${res.user.name}`,
        text2: 'Session token stored persistently',
        position: 'bottom',
      });
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError('root', { message: res.message || 'Login failed.' });
    }
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 24, 36), paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Clinic Branding Header */}
        <View style={styles.brandHeader}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.brandTitle, { color: colors.text }]}>Dr. Paul's Clinic</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
            Receptionist & Staff Management Console
          </Text>
        </View>

        {/* Clean Sign In Form Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sign In</Text>

          {errors.root?.message ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={[styles.errorBannerText, { color: colors.danger }]}>{errors.root.message}</Text>
            </View>
          ) : null}

          {/* Email / Username */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Email / Username</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.surface,
                      borderColor: errors.email
                        ? colors.danger
                        : focusedInput === 'email'
                        ? colors.primary
                        : colors.border,
                      borderWidth: errors.email || focusedInput === 'email' ? 2 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={
                      errors.email
                        ? colors.danger
                        : focusedInput === 'email'
                        ? colors.primary
                        : colors.textMuted
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={(instance) => {
                      ref(instance);
                      (emailInputRef as any).current = instance;
                    }}
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. anita.reception@drpauls.com"
                    placeholderTextColor={colors.textMuted}
                    value={value}
                    onChangeText={(val) => {
                      onChange(val);
                      if (errors.root) clearErrors('root');
                    }}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => {
                      onBlur();
                      setFocusedInput(null);
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
              )}
            />
            {errors.email?.message ? (
              <Text style={[styles.inlineErrorText, { color: colors.danger }]}>
                {errors.email.message}
              </Text>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.surface,
                      borderColor: errors.password
                        ? colors.danger
                        : focusedInput === 'password'
                        ? colors.primary
                        : colors.border,
                      borderWidth: errors.password || focusedInput === 'password' ? 2 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={
                      errors.password
                        ? colors.danger
                        : focusedInput === 'password'
                        ? colors.primary
                        : colors.textMuted
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={(instance) => {
                      ref(instance);
                      (passwordInputRef as any).current = instance;
                    }}
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    value={value}
                    onChangeText={(val) => {
                      onChange(val);
                      if (errors.root) clearErrors('root');
                    }}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => {
                      onBlur();
                      setFocusedInput(null);
                    }}
                    secureTextEntry={!showPassword}
                    keyboardType="default"
                    autoCorrect={false}
                    autoComplete="off"
                    spellCheck={false}
                    textContentType="password"
                    importantForAutofill="no"
                    returnKeyType="done"
                    onSubmitEditing={handleLoginSubmit}
                  />
                  <TouchableOpacity onPress={() => { playClickSound(); setShowPassword(!showPassword); }} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password?.message ? (
              <Text style={[styles.inlineErrorText, { color: colors.danger }]}>
                {errors.password.message}
              </Text>
            ) : null}
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.rowBetween}>
            <Controller
              control={control}
              name="rememberMe"
              render={({ field: { value, onChange } }) => (
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => onChange(!value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={value ? 'checkbox' : 'square-outline'}
                    size={18}
                    color={value ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>Remember me</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity onPress={() => { playClickSound(); setShowForgotModal(true); }}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleLoginSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Accounts Selector */}
          <View style={styles.demoSection}>
            <Text style={[styles.demoSectionTitle, { color: colors.textMuted }]}>
              Quick Demo Accounts:
            </Text>
            <View style={styles.demoPillsRow}>
              <TouchableOpacity
                style={[styles.demoPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleQuickLogin('anita.reception@drpauls.com', 'reception123')}
              >
                <Text style={[styles.demoPillText, { color: colors.primary }]}>Receptionist (Anita)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleQuickLogin('sarah.paul@drpauls.com', 'password123')}
              >
                <Text style={[styles.demoPillText, { color: colors.primary }]}>Doctor (Dr. Sarah)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleQuickLogin('admin@drpauls.com', 'adminpassword')}
              >
                <Text style={[styles.demoPillText, { color: colors.primary }]}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Branding Note */}
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Dr. Paul's Multispeciality Clinic
        </Text>
      </ScrollView>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal visible={showForgotModal} onClose={() => setShowForgotModal(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inlineErrorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB33',
    paddingTop: 14,
  },
  demoSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  demoPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  demoPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 11,
    marginTop: 24,
    textAlign: 'center',
  },
});
