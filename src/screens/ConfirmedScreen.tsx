import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, gradients, shadow } from '../theme';
import GoldButton from '../components/GoldButton';

export default function ConfirmedScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();

  const STEPS = [
    { title: t('confirmed.steps.booked'), meta: 'Today · 14:23', done: true },
    { title: t('confirmed.steps.vehiclePrep'), meta: 'Tue · ~14:25', done: false },
    { title: t('confirmed.steps.inProgress'), meta: 'Est. 45 min', done: false },
    { title: t('confirmed.steps.readyForPickup'), meta: null, done: false },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <LinearGradient colors={gradients.goldSoft} locations={gradients.goldSoftLocations} style={[styles.checkCircle, shadow.cta]}>
            <Feather name="check" size={36} color={colors.goldOnGoldText} />
          </LinearGradient>
          <Text style={styles.title}>{t('confirmed.title')}</Text>
          <Text style={styles.subtitle}>{t('confirmed.subtitle')}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryTitle}>Full Detail</Text>
              <Text style={styles.summaryMeta}>Mercedes C300 · 234 ABC</Text>
            </View>
            <Text style={styles.summaryPrice}>EGP 300</Text>
          </View>
          <View style={styles.summaryRow}>
            <View><Text style={styles.summaryLabel}>{t('confirmed.date')}</Text><Text style={styles.summaryValue}>Tue, 1 Jul</Text></View>
            <View><Text style={styles.summaryLabel}>{t('confirmed.time')}</Text><Text style={styles.summaryValue}>14:30</Text></View>
            <View><Text style={styles.summaryLabel}>{t('confirmed.ref')}</Text><Text style={styles.summaryValue}>#BB2471</Text></View>
          </View>
        </View>

        <View style={styles.timeline}>
          {STEPS.map((step, i) => (
            <View key={step.title} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.dot, step.done && styles.dotDone]} />
                {i < STEPS.length - 1 && <View style={[styles.line, step.done && styles.lineDone]} />}
              </View>
              <View style={{ paddingBottom: 20 }}>
                <Text style={[styles.stepTitle, step.done && styles.stepTitleDone]}>{step.title}</Text>
                {step.meta && <Text style={styles.stepMeta}>{step.meta}</Text>}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="map-pin" size={22} color={colors.gold} />
          </TouchableOpacity>
          <GoldButton title={t('confirmed.done')} onPress={onDone} style={{ flex: 1 }} height={56} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: 26, paddingTop: 10, paddingBottom: 20 },
  center: { alignItems: 'center', textAlign: 'center' },
  checkCircle: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 22, fontFamily: fonts.extrabold, fontSize: 27, color: colors.text, letterSpacing: -0.3 },
  subtitle: { marginTop: 9, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textDim, textAlign: 'center', maxWidth: 260 },
  summaryCard: { marginTop: 26, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.xl, padding: 18 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  summaryMeta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textFaint, marginTop: 3 },
  summaryPrice: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.gold },
  summaryRow: { flexDirection: 'row', gap: 24, paddingTop: 14 },
  summaryLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.textFainter },
  summaryValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginTop: 4 },
  timeline: { marginTop: 22, paddingLeft: 4 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.surface, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)' },
  dotDone: { backgroundColor: '#c9a24b', borderWidth: 0 },
  line: { width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 3 },
  lineDone: { backgroundColor: '#d4af37' },
  stepTitle: { fontFamily: fonts.bold, fontSize: 14, color: 'rgba(243,241,234,0.55)' },
  stepTitleDone: { color: colors.text },
  stepMeta: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(243,241,234,0.4)', marginTop: 2 },
  footer: { marginTop: 'auto', flexDirection: 'row', gap: 12 },
  iconBtn: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
});
