import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../theme';
import GoldButton from '../components/GoldButton';
import LanguageModal from '../components/LanguageModal';
import { changeLanguageAndReload, LanguageCode } from '../i18n';

export default function SplashScreen({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  const { t, i18n } = useTranslation();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const handleSelectLanguage = async (lang: LanguageCode) => {
    setLanguageModalVisible(false);
    await changeLanguageAndReload(lang);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.langBtn} onPress={() => setLanguageModalVisible(true)}>
          <Feather name="globe" size={18} color="#cfcdc6" />
        </TouchableOpacity>

        {/* decorative floating rings */}
        <View style={[styles.ring, { width: 50, height: 50, top: 118, right: 24 }]} />
        <View style={[styles.ring, { width: 22, height: 22, top: 182, right: 66 }]} />
        <View style={[styles.ring, { width: 13, height: 13, top: 98, right: 76 }]} />

        <View style={styles.center}>
          <View style={styles.logoShadowWrap}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.tagline}>{t('splash.tagline')}</Text>
        </View>

        <View style={styles.footer}>
          <GoldButton title={t('splash.getStarted')} onPress={onGetStarted} />
          <Text style={styles.signInRow}>
            {t('splash.alreadyMember')} <Text style={styles.signInLink} onPress={onSignIn}>{t('splash.signIn')}</Text>
          </Text>
        </View>
      </SafeAreaView>
      <LanguageModal
        visible={languageModalVisible}
        currentLanguage={i18n.language as LanguageCode}
        onSelect={handleSelectLanguage}
        onClose={() => setLanguageModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: 32, paddingTop: 24, paddingBottom: 32 },
  langBtn: {
    position: 'absolute',
    top: 60,
    right: 32,
    zIndex: 1,
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.18)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoShadowWrap: {
    width: 221,
    height: 221,
    borderRadius: 110.5,
    shadowColor: '#d4af37',
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  logoCircle: {
    width: 221,
    height: 221,
    borderRadius: 110.5,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.borderGoldStrong,
  },
  logoImage: { width: 210, height: 210 },
  tagline: {
    marginTop: 22,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textDim,
    maxWidth: 272,
  },
  footer: { gap: 15 },
  signInRow: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: colors.textDim },
  signInLink: { color: colors.gold, fontFamily: fonts.bold },
});
