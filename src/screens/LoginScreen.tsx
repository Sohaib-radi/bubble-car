import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius } from '../theme';
import GoldButton from '../components/GoldButton';
import ErrorBanner from '../components/ErrorBanner';
import { supabase } from '../lib/supabase';
import { translateAuthError } from '../lib/authErrors';

export default function LoginScreen({ onBack, onSignIn, onCreateAccount }: { onBack: () => void; onSignIn: () => void; onCreateAccount: () => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (signInError) {
      setError(translateAuthError(signInError.message));
      return;
    }
    onSignIn();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={18} color={colors.gold} />
        </TouchableOpacity>

        <Text style={styles.title}>{t('auth.login.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.fieldLabel}>{t('auth.login.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t('auth.login.emailPlaceholder')}
              placeholderTextColor={colors.textFaint}
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>{t('auth.login.password')}</Text>
            <View style={styles.passwordField}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textFaint}
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textDim} />
              </TouchableOpacity>
            </View>
            <Text style={styles.forgot}>{t('auth.login.forgotPassword')}</Text>
          </View>

          {!!error && <ErrorBanner message={error} />}
        </View>

        <View style={styles.footer}>
          <GoldButton title={loading ? t('auth.login.signingIn') : t('auth.login.signIn')} onPress={handleSignIn} disabled={loading} />
          <Text style={styles.bottomRow}>
            {t('auth.login.newHere')} <Text style={styles.link} onPress={onCreateAccount}>{t('auth.login.createAccount')}</Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: 28, paddingTop: 14, paddingBottom: 24 },
  backBtn: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  title: { marginTop: 30, fontFamily: fonts.extrabold, fontSize: 30, color: colors.text, letterSpacing: -0.4 },
  subtitle: { marginTop: 11, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textDim },
  form: { marginTop: 34, gap: 18 },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.label, marginBottom: 11 },
  input: {
    height: 58, paddingHorizontal: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    color: colors.text, fontFamily: fonts.semibold, fontSize: 17, letterSpacing: 0.4,
  },
  passwordField: {
    height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderGold,
    borderRadius: radius.md,
  },
  passwordInput: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 16, letterSpacing: 3 },
  forgot: { textAlign: 'right', marginTop: 12, fontFamily: fonts.semibold, fontSize: 13, color: colors.gold },
  footer: { marginTop: 'auto', gap: 18 },
  bottomRow: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: colors.textDim },
  link: { color: colors.gold, fontFamily: fonts.bold },
});
