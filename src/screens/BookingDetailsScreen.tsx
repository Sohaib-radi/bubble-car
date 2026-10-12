import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius } from '../theme';
import { supabase } from '../lib/supabase';
import { Car, carLabel, localized } from '../lib/catalog';
import { isPeriodKey } from '../lib/settings';

type Booking = {
  id: string;
  pack_name_en: string | null;
  pack_name_ar: string | null;
  payment_method_label_en: string | null;
  payment_method_label_ar: string | null;
  price: number;
  booking_date: string;
  booking_time: string | null;
  status: string;
  user_package_id: string | null;
  user_packages: { package_name_en: string; package_name_ar: string } | null;
  cars: Pick<Car, 'plate' | 'custom_label' | 'car_makes' | 'car_models'> | null;
};

const STATUS_COLOR: Record<string, string> = {
  pending_review: colors.gold,
  awaiting_payment_proof: colors.gold,
  draft: colors.gold,
  confirmed: colors.success,
  arrived: colors.success,
  in_progress: colors.success,
  completed: colors.success,
  cancelled: colors.danger,
  rejected: colors.danger,
  no_show: colors.danger,
  expired: colors.danger,
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
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select(
          'id, pack_name_en, pack_name_ar, payment_method_label_en, payment_method_label_ar, price, booking_date, booking_time, status, user_package_id, user_packages(package_name_en, package_name_ar), cars(plate, custom_label, car_makes(name), car_models(name))'
        )
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
                <Text style={styles.summaryTitle}>{localized(i18n.language, booking.pack_name_en, booking.pack_name_ar)}</Text>
                <Text style={styles.summaryMeta}>
                  {carLabel(booking.cars)}{booking.cars?.plate ? ` · ${booking.cars.plate}` : ''}
                  {booking.user_packages
                    ? `\n${t('bookingDetails.paidWith', {
                        name: localized(i18n.language, booking.user_packages.package_name_en, booking.user_packages.package_name_ar),
                      })}`
                    : booking.payment_method_label_en
                      ? `\n${localized(i18n.language, booking.payment_method_label_en, booking.payment_method_label_ar)}`
                      : ''}
                </Text>
              </View>
              <Text style={[styles.summaryPrice, booking.user_package_id && { color: colors.success }]}>
                {booking.user_package_id ? t('book.included') : t('common.egp', { price: booking.price })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>{t('bookingDetails.date')}</Text>
                <Text style={styles.summaryValue}>{formatDate(booking.booking_date)}</Text>
              </View>
              <View>
                <Text style={styles.summaryLabel}>{t('bookingDetails.time')}</Text>
                <Text style={styles.summaryValue}>
                  {isPeriodKey(booking.booking_time)
                    ? t(`book.periods.${booking.booking_time}`)
                    : booking.booking_time || t('book.anyTime')}
                </Text>
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
