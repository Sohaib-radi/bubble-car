import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, gradients } from '../theme';
import BottomNav, { NavKey } from '../components/BottomNav';
import LanguageModal from '../components/LanguageModal';
import { supabase } from '../lib/supabase';
import { SERVICE_KEYS, SERVICE_PRICES } from '../data/services';
import { changeLanguageAndReload, LanguageCode } from '../i18n';

type Upcoming = {
  id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  cars: { name: string } | null;
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function localeFor(lang: string) {
  return lang === 'ar' ? 'ar-EG' : 'en-GB';
}

export default function HomeScreen({
  onNavigate,
  onBookWash,
  onOpenBooking,
}: {
  onNavigate: (k: NavKey) => void;
  onBookWash: () => void;
  onOpenBooking: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = localeFor(i18n.language);
  const [fullName, setFullName] = useState('');
  const [upcoming, setUpcoming] = useState<Upcoming | null>(null);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const handleSelectLanguage = async (lang: LanguageCode) => {
    setLanguageModalVisible(false);
    await changeLanguageAndReload(lang);
  };

  const greetingForNow = () => {
    const h = new Date().getHours();
    if (h < 12) return t('home.greeting.morning');
    if (h < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (profile) setFullName(profile.full_name);

      const today = new Date().toISOString().split('T')[0];
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, service_name, booking_date, booking_time, status, cars(name)')
        .eq('user_id', user.id)
        .gte('booking_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(1)
        .returns<Upcoming[]>();
      if (bookings && bookings.length > 0) setUpcoming(bookings[0]);
    })();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greetingForNow()}</Text>
              <Text style={styles.name}>{fullName || '...'}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setLanguageModalVisible(true)}>
              <Feather name="globe" size={20} color="#cfcdc6" />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{fullName ? initialsOf(fullName) : ''}</Text>
            </View>
          </View>

          <LinearGradient
            colors={gradients.goldCard}
            locations={gradients.goldCardLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vipCard}
          >
            <View style={styles.vipTop}>
              <View>
                <Text style={styles.vipLabel}>{t('home.vip.member')}</Text>
                <Text style={styles.vipPoints}>1,240 <Text style={styles.vipPointsUnit}>{t('home.vip.pts')}</Text></Text>
              </View>
              <View style={styles.goldBadge}><Text style={styles.goldBadgeText}>{t('home.vip.gold')}</Text></View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '72%' }]} />
            </View>
            <Text style={styles.progressCaption}>
              {t('home.vip.progressCaption', { points: 260, service: t('common.services.exterior.name') })}
            </Text>
          </LinearGradient>

          <TouchableOpacity style={styles.bookRow} onPress={onBookWash}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <LinearGradient colors={gradients.goldSoft} locations={gradients.goldSoftLocations} style={styles.plusIcon}>
                <Feather name="plus" size={20} color={colors.goldOnGoldText} />
              </LinearGradient>
              <Text style={styles.bookText}>{t('home.bookAWash')}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.gold} />
          </TouchableOpacity>

          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t('home.upcoming')}</Text>
              <Text style={styles.seeAll} onPress={() => onNavigate('History')}>{t('home.seeAll')}</Text>
            </View>
            {upcoming ? (
              <TouchableOpacity style={styles.upcomingCard} onPress={() => onOpenBooking(upcoming.id)}>
                <View style={styles.dateTile}>
                  <Text style={styles.dateDay}>{new Date(upcoming.booking_date).getDate()}</Text>
                  <Text style={styles.dateMonth}>
                    {new Date(upcoming.booking_date).toLocaleDateString(locale, { month: 'short' }).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingTitle}>{upcoming.service_name}</Text>
                  <Text style={styles.upcomingMeta}>
                    {t('home.upcomingMeta', {
                      weekday: new Date(upcoming.booking_date).toLocaleDateString(locale, { weekday: 'short' }),
                      time: upcoming.booking_time,
                      car: upcoming.cars?.name ?? 'Car',
                    })}
                  </Text>
                </View>
                <View style={styles.confirmedPill}>
                  <Text style={styles.confirmedPillText}>{t(`common.status.${upcoming.status}`)}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.upcomingCard}>
                <Text style={styles.upcomingMeta}>{t('home.noUpcoming')}</Text>
              </View>
            )}
          </View>

          <View>
            <Text style={[styles.sectionLabel, { marginBottom: 11 }]}>{t('home.ourServices')}</Text>
            <View style={styles.servicesGrid}>
              {SERVICE_KEYS.map((key) => (
                <View key={key} style={styles.serviceCard}>
                  <Text style={styles.serviceName}>{t(`common.services.${key}.name`)}</Text>
                  <Text style={styles.servicePrice}>
                    {key === 'accessories'
                      ? t('common.fromEgp', { price: SERVICE_PRICES[key] })
                      : t('common.egp', { price: SERVICE_PRICES[key] })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="Home" onNavigate={onNavigate} />
      <LanguageModal
        visible={languageModalVisible}
        currentLanguage={i18n.language as LanguageCode}
        onSelect={handleSelectLanguage}
        onClose={() => setLanguageModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 110, gap: 17 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  greeting: { fontFamily: fonts.medium, fontSize: 13, color: colors.textFaint },
  name: { fontFamily: fonts.bold, fontSize: 21, color: colors.text, marginTop: 2 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: colors.borderGold,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#1c1c20',
  },
  avatarText: { color: colors.gold, fontFamily: fonts.bold, fontSize: 15 },
  vipCard: { borderRadius: 22, padding: 20 },
  vipTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vipLabel: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 3, color: 'rgba(26,20,7,0.65)' },
  vipPoints: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.goldOnGoldText, marginTop: 8 },
  vipPointsUnit: { fontSize: 14, fontFamily: fonts.bold },
  goldBadge: { borderWidth: 1, borderColor: 'rgba(26,20,7,0.3)', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 9 },
  goldBadgeText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, color: 'rgba(26,20,7,0.55)' },
  progressTrack: { marginTop: 18, height: 7, borderRadius: 4, backgroundColor: 'rgba(26,20,7,0.22)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#1a1407', borderRadius: 4 },
  progressCaption: { marginTop: 9, fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(26,20,7,0.7)' },
  bookRow: {
    height: 62, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderGoldStrong,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20,
  },
  plusIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  bookText: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: colors.label },
  seeAll: { fontFamily: fonts.semibold, fontSize: 12, color: colors.gold },
  upcomingCard: {
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 18,
    padding: 15, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  dateTile: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#c9a24b', alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.goldOnGoldText, lineHeight: 20 },
  dateMonth: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1, color: colors.goldOnGoldText },
  upcomingTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  upcomingMeta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textFaint, marginTop: 3 },
  confirmedPill: { backgroundColor: 'rgba(122,209,154,0.12)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  confirmedPillText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.success },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard: { width: '48.5%', backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 15, padding: 14 },
  serviceName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  servicePrice: { fontFamily: fonts.bold, fontSize: 13, color: colors.gold, marginTop: 5 },
});
