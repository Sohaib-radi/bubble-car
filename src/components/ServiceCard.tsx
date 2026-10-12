import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../theme';
import { localized, Pack } from '../lib/catalog';
import { serviceIcon } from '../lib/settings';

// One service in the 2-column grid. `includedLeft` set ⇒ the car's package covers it.
export default function ServiceCard({
  pack,
  price,
  includedLeft,
  selected,
  onPress,
}: {
  pack: Pack;
  price: number | null;
  includedLeft: number | null;
  selected: boolean;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const description = localized(i18n.language, pack.description_en, pack.description_ar);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {selected && (
        <View style={styles.check}>
          <Feather name="check" size={13} color={colors.goldOnGoldText} />
        </View>
      )}
      <View style={styles.icon}>
        <Feather name={serviceIcon(pack.icon, pack.key)} size={22} color={colors.gold} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {localized(i18n.language, pack.name_en, pack.name_ar)}
      </Text>
      {!!description && (
        <Text style={styles.desc} numberOfLines={2}>
          {description}
        </Text>
      )}
      <View style={{ flex: 1 }} />
      {includedLeft !== null ? (
        <View style={styles.includedBadge}>
          <Feather name="gift" size={14} color={colors.success} />
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.includedText} numberOfLines={1}>
              {t('book.included')}
            </Text>
            <Text style={styles.includedCount} numberOfLines={1}>
              {t('book.leftCount', { count: includedLeft })}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.price}>{price !== null ? t('common.egp', { price }) : t('book.noPriceForCar')}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 168,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
  },
  cardSelected: { borderColor: colors.gold, backgroundColor: colors.surfaceGoldTint },
  check: {
    position: 'absolute',
    top: 10,
    end: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.surfaceGoldTint,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  desc: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.textFaint, marginTop: 4 },
  price: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.gold, marginTop: 10 },
  includedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(122,209,154,0.12)',
  },
  includedText: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, color: colors.success },
  includedCount: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 15, color: 'rgba(134,214,163,0.8)' },
});
