import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, gradients } from '../theme';
import BottomNav, { NavKey } from '../components/BottomNav';
import LanguageModal from '../components/LanguageModal';
import PackageCard from '../components/PackageCard';
import { supabase } from '../lib/supabase';
import {
  ACTIVE_STATUSES,
  Car,
  CAR_SELECT,
  carLabel,
  fetchMyPackages,
  fetchPackages,
  localized,
  UserPackage,
} from '../lib/catalog';
import { isPeriodKey, isoDate } from '../lib/settings';
import { changeLanguageAndReload, LanguageCode } from '../i18n';

type Upcoming = {
  id: string;
  pack_name_en: string | null;
  pack_name_ar: string | null;
  booking_date: string;
  booking_time: string | null;
  status: string;
  user_package_id: string | null;
  cars: Pick<Car, 'plate' | 'custom_label' | 'car_makes' | 'car_models'> | null;
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
  onOpenPackages,
  onOpenBooking,
}: {
  onNavigate: (k: NavKey) => void;
  onBookWash: () => void;
  onOpenPackages: () => void;
  onOpenBooking: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const locale = localeFor(lang);
  const [fullName, setFullName] = useState('');
  const [upcoming, setUpcoming] = useState<Upcoming | null>(null);
  const [myPackages, setMyPackages] = useState<UserPackage[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [cheapestPackage, setCheapestPackage] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const handleSelectLanguage = async (code: LanguageCode) => {
    setLanguageModalVisible(false);
    await changeLanguageAndReload(code);
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

      const [profileRes, bookingsRes, myPackagesRes, carsRes, packagesRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase
          .from('bookings')
          .select(
            'id, pack_name_en, pack_name_ar, booking_date, booking_time, status, user_package_id, cars(plate, custom_label, car_makes(name), car_models(name))'
          )
          .eq('user_id', user.id)
          .gte('booking_date', isoDate(new Date()))
          .in('status', ACTIVE_STATUSES)
          .order('booking_date', { ascending: true })
          .limit(1)
          .returns<Upcoming[]>(),
        fetchMyPackages(user.id),
        supabase.from('cars').select(CAR_SELECT).eq('owner_id', user.id).returns<Car[]>(),
        fetchPackages(),
      ]);

      if (profileRes.data) setFullName(profileRes.data.full_name);
      setUpcoming(bookingsRes.data?.[0] ?? null);
      setMyPackages(myPackagesRes.userPackages);
      setCars(carsRes.data ?? []);
      const prices = packagesRes.packages.flatMap((p) => Object.values(p.prices)).filter((p): p is number => typeof p === 'number');
      setCheapestPackage(prices.length ? Math.min(...prices) : null);
      setLoaded(true);
    })();
  }, []);

  const shownPackages = myPackages.filter((up) => up.status === 'active' || up.status === 'pending_review');
  const carText = (carId: string) => {
    const car = cars.find((c) => c.id === carId);
    return car ? `${carLabel(car)} · ${car.plate}` : undefined;
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greetingForNow()}</Text>
              <Text style={styles.name}>{fullName || ' '}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setLanguageModalVisible(true)} accessibilityLabel={t('profile.menu.language')}>
              <Feather name="globe" size={20} color="#cfcdc6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={() => onNavigate('Profile')}>
              <Text style={styles.avatarText}>{fullName ? initialsOf(fullName) : ''}</Text>
            </TouchableOpacity>
          </View>

          {/* My package — or an invitation to get one */}
          {shownPackages.length > 0
            ? shownPackages.map((up) => (
                <PackageCard
                  key={up.id}
                  userPackage={up}
                  carText={carText(up.car_id)}
                  actionLabel={up.status === 'active' ? t('home.usePackageWash') : undefined}
                  onAction={onBookWash}
                />
              ))
            : loaded && (
                <TouchableOpacity activeOpacity={0.9} onPress={onOpenPackages}>
                  <LinearGradient
                    colors={gradients.goldCard}
                    locations={gradients.goldCardLocations}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.promo}
                  >
                    <Feather name="gift" size={26} color={colors.goldOnGoldText} />
                    <Text style={styles.promoTitle}>{t('home.promoTitle')}</Text>
                    <Text style={styles.promoText}>
                      {cheapestPackage !== null
                        ? t('home.promoFrom', { price: t('common.egp', { price: cheapestPackage }) })
                        : t('home.promoText')}
                    </Text>
                    <View style={styles.promoBtn}>
                      <Text style={styles.promoBtnText}>{t('home.seePackages')}</Text>
                      <Feather name="arrow-right" size={16} color={colors.goldOnGoldText} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}

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
              <Text style={styles.seeAll} onPress={() => onNavigate('History')}>
                {t('home.seeAll')}
              </Text>
            </View>
            {upcoming ? (
              <TouchableOpacity style={styles.upcomingCard} onPress={() => onOpenBooking(upcoming.id)}>
                <View style={styles.dateTile}>
                  <Text style={styles.dateDay}>{new Date(`${upcoming.booking_date}T00:00:00`).getDate()}</Text>
                  <Text style={styles.dateMonth}>
                    {new Date(`${upcoming.booking_date}T00:00:00`).toLocaleDateString(locale, { month: 'short' }).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingTitle}>{localized(lang, upcoming.pack_name_en, upcoming.pack_name_ar)}</Text>
                  <Text style={styles.upcomingMeta}>
                    {new Date(`${upcoming.booking_date}T00:00:00`).toLocaleDateString(locale, { weekday: 'short' })}
                    {' · '}
                    {isPeriodKey(upcoming.booking_time) ? t(`book.periods.${upcoming.booking_time}`) : upcoming.booking_time || t('book.anyTime')}
                    {' · '}
                    {carLabel(upcoming.cars)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 7 }}>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{t(`common.status.${upcoming.status}`)}</Text>
                    </View>
                    {upcoming.user_package_id && (
                      <View style={[styles.statusPill, styles.planPill]}>
                        <Text style={[styles.statusPillText, { color: colors.gold }]}>{t('history.planTag')}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textFaint} />
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyCard}>
                <Feather name="calendar" size={22} color={colors.textFaint} />
                <Text style={styles.emptyText}>{t('home.noUpcoming')}</Text>
                <Text style={styles.emptyLink} onPress={onBookWash}>
                  {t('home.bookAWash')}
                </Text>
              </View>
            )}
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
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  greeting: { fontFamily: fonts.medium, fontSize: 14, color: colors.textFaint },
  name: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, marginTop: 2 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: colors.borderGold,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#1c1c20',
  },
  avatarText: { color: colors.gold, fontFamily: fonts.bold, fontSize: 15 },
  promo: { borderRadius: 22, padding: 20, gap: 6 },
  promoTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.goldOnGoldText, marginTop: 6 },
  promoText: { fontFamily: fonts.semibold, fontSize: 14, color: 'rgba(26,20,7,0.75)' },
  promoBtn: {
    marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(26,20,7,0.14)',
  },
  promoBtnText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.goldOnGoldText },
  bookRow: {
    height: 64, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderGoldStrong,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18,
  },
  plusIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bookText: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.label },
  seeAll: { fontFamily: fonts.semibold, fontSize: 13, color: colors.gold, padding: 4 },
  upcomingCard: {
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 18,
    padding: 15, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  dateTile: { width: 54, height: 58, borderRadius: 14, backgroundColor: '#c9a24b', alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.goldOnGoldText, lineHeight: 23 },
  dateMonth: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1, color: colors.goldOnGoldText },
  upcomingTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  upcomingMeta: { fontFamily: fonts.medium, fontSize: 13, color: colors.textFaint, marginTop: 3 },
  statusPill: { backgroundColor: 'rgba(122,209,154,0.12)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 },
  planPill: { backgroundColor: colors.surfaceGoldTint },
  statusPillText: { fontFamily: fonts.bold, fontSize: 11, color: colors.success },
  emptyCard: {
    alignItems: 'center', gap: 8, paddingVertical: 24, borderRadius: 18,
    borderWidth: 1, borderColor: colors.borderSoft, borderStyle: 'dashed',
  },
  emptyText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textFaint },
  emptyLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.gold, padding: 4 },
});
