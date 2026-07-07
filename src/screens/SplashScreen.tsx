import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../theme';
import GoldButton from '../components/GoldButton';

export default function SplashScreen({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        {/* soft glow + rings, decorative */}
        <View style={styles.glow} />
        <View style={[styles.ring, { width: 50, height: 50, top: 118, right: 24 }]} />
        <View style={[styles.ring, { width: 22, height: 22, top: 182, right: 66 }]} />
        <View style={[styles.ring, { width: 13, height: 13, top: 98, right: 76 }]} />

        <View style={styles.center}>
          {/* Replace with your logo asset */}
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>{t('splash.tagline')}</Text>
        </View>

        <View style={styles.footer}>
          <GoldButton title={t('splash.getStarted')} onPress={onGetStarted} />
          <Text style={styles.signInRow}>
            {t('splash.alreadyMember')} <Text style={styles.signInLink} onPress={onSignIn}>{t('splash.signIn')}</Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: 32, paddingTop: 24, paddingBottom: 32 },
  glow: {
    position: 'absolute',
    top: 150,
    alignSelf: 'center',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(201,162,75,0.10)',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(201,162,75,0.18)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 220, height: 90 },
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
