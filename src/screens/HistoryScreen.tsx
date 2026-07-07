import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, gradients } from '../theme';
import BottomNav, { NavKey } from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { ServiceKey } from '../data/services';

const FILTER_KEYS = ['all', 'thisMonth', 'fullDetail'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

type Booking = {
  id: string;
  service_key: ServiceKey;
  price: number;
  booking_date: string;
  status: string;
  cars: { name: string } | null;
};

function localeFor(lang: string) {
  return lang === 'ar' ? 'ar-EG' : 'en-GB';
}

export default function HistoryScreen({
  onNavigate,
  onOpenBooking,
}: {
  onNavigate: (k: NavKey) => void;
  onOpenBooking: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = localeFor(i18n.language);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select('id, service_key, price, booking_date, status, cars(name)')
        .order('booking_date', { ascending: false })
        .returns<Booking[]>();
      if (data) setBookings(data);
    })();
  }, []);

  const filtered = bookings.filter((b) => {
    if (filter === 'fullDetail') return b.service_key === 'full';
    if (filter === 'thisMonth') {
      const now = new Date();
      const d = new Date(b.booking_date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return true;
  });

  const totalWashes = bookings.length;
  const totalSpent = bookings.reduce((sum, b) => sum + Number(b.price), 0);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>{t('history.title')}</Text>

          <View style={styles.statsCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statValue}>{totalWashes}</Text>
              <Text style={styles.statLabel}>{t('history.totalWashes')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statValue, { color: colors.gold }]}>{t('common.egp', { price: totalSpent })}</Text>
              <Text style={styles.statLabel}>{t('history.spentWithUs')}</Text>
            </View>
          </View>

          <View style={styles.filters}>
            {FILTER_KEYS.map((f) => {
              const isSel = f === filter;
              const label = t(`history.filters.${f}`);
              if (isSel) {
                return (
                  <LinearGradient key={f} colors={gradients.goldSoft} locations={gradients.goldSoftLocations} style={styles.filterChipActive}>
                    <Text style={styles.filterTextActive}>{label}</Text>
                  </LinearGradient>
                );
              }
              return (
                <TouchableOpacity key={f} style={styles.filterChip} onPress={() => setFilter(f)}>
                  <Text style={styles.filterText}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View>
            {filtered.length === 0 && <Text style={styles.empty}>{t('history.noBookings')}</Text>}
            {filtered.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.row, i === filtered.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => onOpenBooking(item.id)}
              >
                <View style={styles.rowIcon}>
                  <Feather name="truck" size={20} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{t(`common.services.${item.service_key}.name`)}</Text>
                  <Text style={styles.rowMeta}>{formatDate(item.booking_date)} · {item.cars?.name ?? 'Car'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.rowPrice}>{t('common.egp', { price: item.price })}</Text>
                  <Text style={styles.rowStatus}>{t(`common.status.${item.status}`)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="History" onNavigate={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 110 },
  title: { fontFamily: fonts.extrabold, fontSize: 27, color: colors.text, letterSpacing: -0.3 },
  statsCard: {
    marginTop: 14, flexDirection: 'row', gap: 18, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 16, padding: 15,
  },
  statValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.textFaint, marginTop: 2 },
  divider: { width: 1, backgroundColor: colors.border },
  filters: { marginTop: 16, flexDirection: 'row', gap: 8 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: radius.pill },
  filterText: { fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(243,241,234,0.6)' },
  filterTextActive: { fontFamily: fonts.bold, fontSize: 12, color: colors.goldOnGoldText },
  empty: { marginTop: 30, textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: colors.textFaint },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft, marginTop: 14,
  },
  rowIcon: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceGoldTint,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  rowMeta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textFaint, marginTop: 2 },
  rowPrice: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  rowStatus: { fontFamily: fonts.semibold, fontSize: 11, color: colors.success, marginTop: 2 },
});
