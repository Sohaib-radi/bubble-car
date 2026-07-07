import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius } from '../theme';
import { supabase } from '../lib/supabase';
import { ServiceKey } from '../data/services';

type Booking = {
  id: string;
  service_key: ServiceKey;
  price: number;
  booking_date: string;
  booking_time: string;
  status: string;
  cars: { name: string; plate: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  pending: colors.gold,
  confirmed: colors.success,
  completed: colors.success,
  cancelled: colors.danger,
};

function localeFor(lang: string) {
  return lang === 'ar' ? 'ar-EG' : 'en-GB';
}

export default function BookingDetailsScreen({ bookingId, onBack }: { bookingId: string; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const locale = localeFor(i18n.language);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select('id, service_key, price, booking_date, booking_time, status, cars(name, plate)')
        .eq('id', bookingId)
        .single();
      setBooking((data as unknown as Booking) ?? null);
      setLoading(false);
    })();
  }, [bookingId]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Feather name="arrow-left" size={18} color={colors.gold} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('bookingDetails.title')}</Text>
        </View>

        {loading && <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />}
        {!loading && !booking && <Text style={styles.notFound}>{t('bookingDetails.notFound')}</Text>}

        {booking && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryTitle}>{t(`common.services.${booking.service_key}.name`)}</Text>
                <Text style={styles.summaryMeta}>
                  {booking.cars?.name ?? 'Car'}{booking.cars?.plate ? ` · ${booking.cars.plate}` : ''}
                </Text>
              </View>
              <Text style={styles.summaryPrice}>{t('common.egp', { price: booking.price })}</Text>
            </View>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>{t('bookingDetails.date')}</Text>
                <Text style={styles.summaryValue}>{formatDate(booking.booking_date)}</Text>
              </View>
              <View>
                <Text style={styles.summaryLabel}>{t('bookingDetails.time')}</Text>
                <Text style={styles.summaryValue}>{booking.booking_time}</Text>
              </View>
              <View>
                <Text style={styles.summaryLabel}>{t('bookingDetails.status')}</Text>
                <Text style={[styles.summaryValue, { color: STATUS_COLOR[booking.status] ?? colors.text }]}>
                  {t(`common.status.${booking.status}`)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 6 },
  backBtn: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.extrabold, fontSize: 23, color: colors.text, letterSpacing: -0.3 },
  notFound: { marginTop: 40, textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: colors.textFaint },
  summaryCard: {
    marginTop: 22, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft,
    borderRadius: radius.xl, padding: 18,
  },
  summaryTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  summaryMeta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textFaint, marginTop: 3 },
  summaryPrice: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.gold },
  summaryRow: { flexDirection: 'row', gap: 24, paddingTop: 14 },
  summaryLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.textFainter },
  summaryValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginTop: 4 },
});
