import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, gradients, shadow } from '../theme';
import GoldButton from '../components/GoldButton';
import type { BookingSummary } from './BookScreen';

function localeFor(lang: string) {
  return lang === 'ar' ? 'ar-EG' : 'en-GB';
}

export default function ConfirmedScreen({
  summary,
  onDone,
  onViewBookings,
}: {
  summary: BookingSummary;
  onDone: () => void;
  onViewBookings: () => void;
}) {
  const { t, i18n } = useTranslation();
  const date = new Date(`${summary.date}T00:00:00`).toLocaleDateString(localeFor(i18n.language), {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const STEPS = [
    { title: t('confirmed.steps.received'), done: true },
    { title: t('confirmed.steps.reviewed'), done: false },
    { title: t('confirmed.steps.washed'), done: false },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <LinearGradient colors={gradients.goldSoft} locations={gradients.goldSoftLocations} style={[styles.checkCircle, shadow.cta]}>
            <Feather name="check" size={38} color={colors.goldOnGoldText} />
          </LinearGradient>
          <Text style={styles.title}>{t('confirmed.title')}</Text>
          <Text style={styles.subtitle}>{t('confirmed.subtitle')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.service}>{summary.serviceName}</Text>
              <Text style={styles.meta}>{summary.carText}</Text>
            </View>
            <Text style={[styles.price, summary.viaPackage && { color: colors.success }]}>
              {summary.viaPackage ? t('book.included') : t('common.egp', { price: summary.price })}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('confirmed.date')}</Text>
              <Text style={styles.value}>{date}</Text>
            </View>
            <View>
              <Text style={styles.label}>{t('confirmed.time')}</Text>
              <Text style={styles.value}>{summary.period ? t(`book.periods.${summary.period}`) : t('book.anyTime')}</Text>
            </View>
            <View>
              <Text style={styles.label}>{t('confirmed.ref')}</Text>
              <Text style={styles.value}>#{summary.ref}</Text>
            </View>
          </View>
          {summary.viaPackage && summary.remainingAfter !== null && (
            <View style={styles.planNote}>
              <Feather name="gift" size={16} color={colors.success} />
              <Text style={styles.planNoteText}>{t('confirmed.planNote', { count: summary.remainingAfter })}</Text>
            </View>
          )}
        </View>

        <View style={styles.timeline}>
          {STEPS.map((step, i) => (
            <View key={step.title} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.dot, step.done && styles.dotDone]} />
                {i < STEPS.length - 1 && <View style={[styles.line, step.done && styles.lineDone]} />}
              </View>
              <Text style={[styles.stepTitle, step.done && styles.stepTitleDone]}>{step.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondary} onPress={onViewBookings}>
            <Text style={styles.secondaryText}>{t('confirmed.viewBookings')}</Text>
          </TouchableOpacity>
          <GoldButton title={t('confirmed.done')} onPress={onDone} style={{ flex: 1 }} height={56} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 20 },
  center: { alignItems: 'center' },
  checkCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 22, fontFamily: fonts.extrabold, fontSize: 26, color: colors.text, textAlign: 'center' },
  subtitle: { marginTop: 8, fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.textDim, textAlign: 'center', maxWidth: 290 },
  card: { marginTop: 28, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.xl, padding: 18 },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  service: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  meta: { fontFamily: fonts.medium, fontSize: 13, color: colors.textFaint, marginTop: 3 },
  price: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.gold },
  cardRow: { flexDirection: 'row', gap: 18, paddingTop: 14 },
  label: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.textFainter },
  value: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginTop: 4 },
  planNote: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 12, borderRadius: 12,
    backgroundColor: 'rgba(122,209,154,0.1)',
  },
  planNoteText: { flex: 1, fontFamily: fonts.bold, fontSize: 13, color: colors.success },
  timeline: { marginTop: 24, paddingStart: 4 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.surface, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)' },
  dotDone: { backgroundColor: '#c9a24b', borderWidth: 0 },
  line: { width: 2, height: 22, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 3 },
  lineDone: { backgroundColor: '#d4af37' },
  stepTitle: { fontFamily: fonts.bold, fontSize: 14, color: 'rgba(243,241,234,0.5)', marginTop: -2 },
  stepTitleDone: { color: colors.text },
  footer: { marginTop: 'auto', flexDirection: 'row', gap: 12 },
  secondary: {
    height: 56, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
});
