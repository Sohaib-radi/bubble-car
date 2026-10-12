import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, gradients } from '../theme';
import { localized, UserPackage } from '../lib/catalog';

function localeFor(lang: string) {
  return lang === 'ar' ? 'ar-EG' : 'en-GB';
}

// The customer's own package: big "washes left" numbers + validity.
// Gold when active, outlined while waiting for payment review.
export default function PackageCard({
  userPackage,
  carText,
  actionLabel,
  onAction,
  compact = false,
}: {
  userPackage: UserPackage;
  carText?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const name = localized(lang, userPackage.package_name_en, userPackage.package_name_ar);

  if (userPackage.status === 'pending_review') {
    return (
      <View style={styles.pending}>
        <View style={styles.pendingIcon}>
          <Feather name="clock" size={18} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pendingTitle}>{name}</Text>
          <Text style={styles.pendingText}>{t('packages.pendingNote')}</Text>
        </View>
      </View>
    );
  }

  const total = userPackage.balances.reduce((s, b) => s + b.quantity, 0);
  const used = userPackage.balances.reduce((s, b) => s + b.used, 0);
  const progress = total ? Math.min(1, used / total) : 0;
  const validUntil = userPackage.expires_at
    ? new Date(userPackage.expires_at).toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short' })
    : '';

  return (
    <LinearGradient
      colors={gradients.goldCard}
      locations={gradients.goldCardLocations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('packages.myPackage')}</Text>
          <Text style={styles.name}>{name}</Text>
          {!!carText && <Text style={styles.car}>{carText}</Text>}
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>{t('packages.status.active')}</Text>
        </View>
      </View>

      <View style={styles.numbers}>
        {userPackage.balances.map((b) => (
          <View key={b.pack_id} style={styles.numberBox}>
            <Text style={styles.number}>{b.remaining}</Text>
            <Text style={styles.numberLabel} numberOfLines={1}>
              {localized(lang, b.pack_name_en, b.pack_name_ar)}
            </Text>
            <Text style={styles.numberSub}>{t('packages.ofTotal', { total: b.quantity })}</Text>
          </View>
        ))}
      </View>

      {!compact && (
        <>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.valid}>{t('packages.validUntil', { date: validUntil })}</Text>
        </>
      )}
      {compact && <Text style={[styles.valid, { marginTop: 8 }]}>{t('packages.validUntil', { date: validUntil })}</Text>}

      {!!actionLabel && !!onAction && (
        <TouchableOpacity style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Feather name="arrow-right" size={16} color={colors.goldOnGoldText} />
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const dark = colors.goldOnGoldText;

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  label: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 2, color: 'rgba(26,20,7,0.6)' },
  name: { fontFamily: fonts.extrabold, fontSize: 16, color: dark, marginTop: 2 },
  car: { fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(26,20,7,0.7)', marginTop: 2 },
  activeBadge: { borderWidth: 1, borderColor: 'rgba(26,20,7,0.3)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  activeText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, color: 'rgba(26,20,7,0.65)', textTransform: 'uppercase' },
  numbers: { flexDirection: 'row', gap: 8, marginTop: 10 },
  numberBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(26,20,7,0.12)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  number: { fontFamily: fonts.extrabold, fontSize: 20, color: dark, lineHeight: 24 },
  numberLabel: { fontFamily: fonts.bold, fontSize: 11, color: dark },
  numberSub: { fontFamily: fonts.semibold, fontSize: 10, color: 'rgba(26,20,7,0.6)' },
  track: { marginTop: 10, height: 5, borderRadius: 4, backgroundColor: 'rgba(26,20,7,0.2)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: dark, borderRadius: 4 },
  valid: { marginTop: 6, fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(26,20,7,0.75)' },
  action: {
    marginTop: 10,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(26,20,7,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: { fontFamily: fonts.extrabold, fontSize: 14, color: dark },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceGoldTint,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  pendingText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.textDim, marginTop: 2 },
});
