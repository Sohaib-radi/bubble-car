import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius } from '../theme';
import GoldButton from '../components/GoldButton';
import { supabase } from '../lib/supabase';

export default function RegisterScreen({ onBack, onCreateAccount, onSignIn }: { onBack: () => void; onCreateAccount: () => void; onSignIn: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    setError('');
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), phone: phone.trim(), address: address.trim() },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (!data.session) {
      setError(t('auth.register.checkEmailMessage'));
      return;
    }
    onCreateAccount();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Feather name="arrow-left" size={18} color={colors.gold} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.title}>{t('auth.register.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>

          <View style={styles.form}>
            <View>
              <Text style={styles.fieldLabel}>{t('auth.register.fullName')}</Text>
              <View style={styles.fieldRowActive}>
                <Feather name="user" size={18} color={colors.textFaint} />
                <TextInput
                  style={styles.inlineInput}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('auth.register.fullNamePlaceholder')}
                  placeholderTextColor={colors.textFaint}
                />
              </View>
            </View>

            <View>
              <Text style={styles.fieldLabel}>{t('auth.register.email')}</Text>
              <View style={styles.fieldRow}>
                <Feather name="mail" size={18} color={colors.textFaint} />
                <TextInput
                  style={styles.inlineInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={t('auth.register.emailPlaceholder')}
                  placeholderTextColor={colors.textFaint}
                />
              </View>
            </View>

            <View>
              <Text style={styles.fieldLabel}>{t('auth.register.phone')}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={styles.countryPicker}>
                  <Text style={styles.countryText}>EG</Text>
                  <Feather name="chevron-down" size={12} color={colors.textDim} />
                  <Text style={styles.countryCode}>+20</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder={t('auth.register.phonePlaceholder')}
                  placeholderTextColor={colors.textFaint}
                />
              </View>
            </View>

            <View>
              <Text style={styles.fieldLabel}>{t('auth.register.address')}</Text>
              <View style={styles.fieldRow}>
                <Feather name="map-pin" size={18} color={colors.textFaint} />
                <TextInput
                  style={styles.inlineInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder={t('auth.register.addressPlaceholder')}
                  placeholderTextColor={colors.textFaint}
                  multiline
                />
              </View>
            </View>

            <View>
              <Text style={styles.fieldLabel}>{t('auth.register.password')}</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.inlineInputFlexOnly}
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
            </View>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.footer}>
            <GoldButton
              title={loading ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}
              onPress={handleCreateAccount}
              disabled={loading}
            />
            <Text style={styles.bottomRow}>
              {t('auth.register.alreadyHaveAccount')} <Text style={styles.link} onPress={onSignIn}>{t('auth.register.signIn')}</Text>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: 28, paddingTop: 14, paddingBottom: 16 },
  backBtn: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text, letterSpacing: -0.4 },
  subtitle: { marginTop: 9, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textDim },
  form: { marginTop: 26, gap: 15 },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.label, marginBottom: 9 },
  fieldRow: {
    minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  fieldRowActive: {
    height: 54, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderGold, borderRadius: radius.md,
  },
  inlineInput: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  inlineInputFlexOnly: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 15, letterSpacing: 2 },
  countryPicker: {
    height: 54, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 15,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  countryText: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  countryCode: { color: colors.textDim, fontFamily: fonts.semibold },
  input: {
    flex: 1, height: 54, paddingHorizontal: 16, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    color: colors.text, fontFamily: fonts.semibold, fontSize: 16, letterSpacing: 0.4,
  },
  error: { marginTop: 18, fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  footer: { marginTop: 24, gap: 14 },
  bottomRow: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: colors.textDim },
  link: { color: colors.gold, fontFamily: fonts.bold },
});
