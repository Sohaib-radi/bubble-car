import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, gradients } from '../theme';
import BottomNav, { NavKey } from '../components/BottomNav';
import usePullToRefresh from '../components/usePullToRefresh';
import { supabase } from '../lib/supabase';
import { ACTIVE_STATUSES, Car, carLabel, localized } from '../lib/catalog';
import { isPeriodKey, isoDate } from '../lib/settings';

const FILTER_KEYS = ['upcoming', 'past'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

type Booking = {
  id: string;
  pack_name_en: string | null;
  pack_name_ar: string | null;
  price: number;
  booking_date: string;
  booking_time: string | null;
  user_package_id: string | null;
  status: string;
  cars: Pick<Car, 'plate' | 'custom_label' | 'car_makes' | 'car_models'> | null;
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
  const [filter, setFilter] = useState<FilterKey>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);

  const formatDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

  const load = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('id, pack_name_en, pack_name_ar, price, booking_date, booking_time, user_package_id, status, cars(plate, custom_label, car_makes(name), car_models(name))')
      .order('booking_date', { ascending: false })
      .returns<Booking[]>();
    if (data) setBookings(data);
  };

  useEffect(() => {
    load();
  }, []);

  const refreshControl = usePullToRefresh(load);

  const today = isoDate(new Date());
  const isUpcoming = (b: Booking) => b.booking_date >= today && ACTIVE_STATUSES.includes(b.status);
  const filtered = bookings
    .filter((b) => (filter === 'upcoming' ? isUpcoming(b) : !isUpcoming(b)))
    // Upcoming: soonest first. Past: most recent first (query order).
    .sort((a, b) => (filter === 'upcoming' ? a.booking_date.localeCompare(b.booking_date) : 0));

  const totalWashes = bookings.length;
  const totalSpent = bookings.reduce((sum, b) => sum + Number(b.price), 0);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={refreshControl}>
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
            {filtered.length === 0 && (
              <Text style={styles.empty}>{filter === 'upcoming' ? t('history.noUpcoming') : t('history.noBookings')}</Text>
            )}
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
                  <Text style={styles.rowTitle}>{localized(i18n.language, item.pack_name_en, item.pack_name_ar)}</Text>
                  <Text style={styles.rowMeta}>
                    {formatDate(item.booking_date)}
                    {item.booking_time ? ` · ${isPeriodKey(item.booking_time) ? t(`book.periods.${item.booking_time}`) : item.booking_time}` : ''}
                    {' · '}
                    {carLabel(item.cars)}
                  </Text>
                  {item.user_package_id && (
                    <View style={styles.planTag}>
                      <Feather name="gift" size={11} color={colors.gold} />
                      <Text style={styles.planTagText}>{t('history.planTag')}</Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.rowPrice, item.user_package_id && { color: colors.success }]}>
                    {item.user_package_id ? t('book.included') : t('common.egp', { price: item.price })}
                  </Text>
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
  filterChip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: radius.pill },
  filterText: { fontFamily: fonts.semibold, fontSize: 14, color: 'rgba(243,241,234,0.6)' },
  filterTextActive: { fontFamily: fonts.bold, fontSize: 14, color: colors.goldOnGoldText },
  planTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 5,
    paddingVertical: 2, paddingHorizontal: 7, borderRadius: 999, backgroundColor: colors.surfaceGoldTint,
  },
  planTagText: { fontFamily: fonts.bold, fontSize: 11, color: colors.gold },
  empty: { marginTop: 30, textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: colors.textFaint },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft, marginTop: 14,
  },
  rowIcon: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceGoldTint,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  rowMeta: { fontFamily: fonts.medium, fontSize: 13, color: colors.textFaint, marginTop: 2 },
  rowPrice: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  rowStatus: { fontFamily: fonts.semibold, fontSize: 11, color: colors.success, marginTop: 2 },
});
