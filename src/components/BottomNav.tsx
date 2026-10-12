import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, gradients, shadow } from '../theme';

export type NavKey = 'Home' | 'History' | 'Book' | 'Packages' | 'Profile';

const ITEMS: { key: NavKey; labelKey: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'Home', labelKey: 'common.nav.home', icon: 'home' },
  { key: 'History', labelKey: 'common.nav.bookings', icon: 'calendar' },
  { key: 'Book', labelKey: 'common.nav.book', icon: 'plus' },
  { key: 'Packages', labelKey: 'common.nav.packages', icon: 'gift' },
  { key: 'Profile', labelKey: 'common.nav.profile', icon: 'user' },
];

// 5 tabs; "Book" is the raised gold button in the middle.
export default function BottomNav({ active, onNavigate }: { active: NavKey; onNavigate: (k: NavKey) => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { height: 74 + insets.bottom, paddingBottom: insets.bottom }]}>
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        if (item.key === 'Book') {
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.item}
              onPress={() => onNavigate(item.key)}
              accessibilityRole="button"
              accessibilityLabel={t(item.labelKey)}
            >
              <LinearGradient colors={gradients.goldSoft} locations={gradients.goldSoftLocations} style={[styles.bookBtn, shadow.cta]}>
                <Feather name="plus" size={26} color={colors.goldOnGoldText} />
              </LinearGradient>
              <Text style={[styles.label, { color: colors.gold, fontFamily: fonts.bold }]}>{t(item.labelKey)}</Text>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            onPress={() => onNavigate(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Feather name={item.icon} size={22} color={isActive ? colors.gold : colors.navInactive} />
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.gold : colors.navInactive, fontFamily: isActive ? fonts.bold : fonts.semibold },
              ]}
            >
              {t(item.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(11,11,12,0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  item: { flex: 1, alignItems: 'center', gap: 5 },
  bookBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginTop: -28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.bg,
  },
  label: { fontSize: 11, letterSpacing: 0.2 },
});
