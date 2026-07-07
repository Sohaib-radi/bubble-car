import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../theme';

export type NavKey = 'Home' | 'Book' | 'History' | 'Profile';

const ITEMS: { key: NavKey; labelKey: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'Home', labelKey: 'common.nav.home', icon: 'home' },
  { key: 'Book', labelKey: 'common.nav.book', icon: 'calendar' },
  { key: 'History', labelKey: 'common.nav.history', icon: 'clock' },
  { key: 'Profile', labelKey: 'common.nav.profile', icon: 'user' },
];

export default function BottomNav({ active, onNavigate }: { active: NavKey; onNavigate: (k: NavKey) => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { height: 74 + insets.bottom, paddingBottom: insets.bottom }]}>
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <View key={item.key} style={styles.item} onTouchEnd={() => onNavigate(item.key)}>
            <Feather name={item.icon} size={22} color={isActive ? colors.gold : colors.navInactive} />
            <Text style={[styles.label, { color: isActive ? colors.gold : colors.navInactive, fontFamily: isActive ? fonts.bold : fonts.semibold }]}>
              {t(item.labelKey)}
            </Text>
          </View>
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
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(11,11,12,0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  item: { alignItems: 'center', gap: 5 },
  label: { fontSize: 10, letterSpacing: 0.2 },
});
