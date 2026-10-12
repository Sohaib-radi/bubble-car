import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius } from '../theme';
import GoldButton from '../components/GoldButton';
import ErrorBanner from '../components/ErrorBanner';
import BottomSheet from '../components/BottomSheet';
import PackageCard from '../components/PackageCard';
import BottomNav, { NavKey } from '../components/BottomNav';
import usePullToRefresh from '../components/usePullToRefresh';
import { supabase } from '../lib/supabase';
import { translateAuthError } from '../lib/authErrors';
import {
  Car,
  CAR_SELECT,
  carLabel,
  carWithPlate,
  fetchMyPackages,
  fetchPackages,
  fetchPacks,
  localized,
  Pack,
  Package,
  PaymentMethod,
  UserPackage,
} from '../lib/catalog';

export default function PackagesScreen({ onNavigate }: { onNavigate: (k: NavKey) => void }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [myPackages, setMyPackages] = useState<UserPackage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [error, setError] = useState('');

  // buy sheet
  const [buying, setBuying] = useState<Package | null>(null);
  const [carId, setCarId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [sent, setSent] = useState(false);

  const loadMine = async (uid: string) => {
    const res = await fetchMyPackages(uid);
    if (res.error) setError(translateAuthError(res.error));
    setMyPackages(res.userPackages);
  };

  const load = async () => {
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(t('common.notSignedIn'));
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const [carsRes, pkgRes, packsRes, paymentRes] = await Promise.all([
      supabase.from('cars').select(CAR_SELECT).eq('owner_id', user.id).order('created_at').returns<Car[]>(),
      fetchPackages(),
      fetchPacks(),
      supabase
        .from('payment_methods')
        .select('id, label_en, label_ar, account_info, instructions_en, instructions_ar')
        .eq('active', true)
        .order('created_at'),
      loadMine(user.id),
    ]);

    const loadError = carsRes.error?.message ?? pkgRes.error ?? packsRes.error ?? paymentRes.error?.message;
    if (loadError) setError(translateAuthError(loadError));

    setCars(carsRes.data ?? []);
    setPackages(pkgRes.packages);
    setPacks(packsRes.packs);
    setPaymentMethods(paymentRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const refreshControl = usePullToRefresh(load);

  const selectedCar = cars.find((c) => c.id === carId) ?? null;
  const selectedPayment = paymentMethods.find((m) => m.id === paymentId) ?? null;
  const price = buying && selectedCar ? buying.prices[selectedCar.car_type] ?? null : null;
  const needsReference = !!selectedPayment?.account_info;
  const mine = myPackages.filter((up) => up.status === 'active' || up.status === 'pending_review');

  // What the same washes would cost one by one, for a given car type.
  const regularPrice = (pkg: Package, carType: Car['car_type']): number | null => {
    let sum = 0;
    for (const item of pkg.items) {
      const p = packs.find((pk) => pk.id === item.pack_id)?.prices[carType];
      if (p === undefined) return null;
      sum += p * item.quantity;
    }
    return sum;
  };

  // Price shown on the card: for the user's first car if they have one, otherwise "from".
  const cardPrice = (pkg: Package) => {
    const car = cars[0];
    if (car && pkg.prices[car.car_type] !== undefined) {
      const p = pkg.prices[car.car_type]!;
      const reg = regularPrice(pkg, car.car_type);
      return { price: p, regular: reg !== null && reg > p ? reg : null, from: false };
    }
    const values = Object.values(pkg.prices).filter((v): v is number => typeof v === 'number');
    return { price: values.length ? Math.min(...values) : null, regular: null, from: true };
  };

  const openBuy = (pkg: Package) => {
    setBuying(pkg);
    setSent(false);
    setSheetError('');
    setPaymentReference('');
    const firstEligible = cars.find((c) => pkg.prices[c.car_type] !== undefined);
    setCarId(firstEligible?.id ?? null);
    setPaymentId(paymentMethods[0]?.id ?? null);
  };

  const handleBuy = async () => {
    if (!userId || !selectedCar || !buying || price === null) return;
    setSheetError('');
    setSubmitting(true);
    // Price, names and car type are filled in by the database from the package;
    // status always starts as pending_review.
    const { error: insertError } = await supabase.from('user_packages').insert({
      user_id: userId,
      car_id: selectedCar.id,
      package_id: buying.id,
      car_type: selectedCar.car_type,
      package_name_en: buying.name_en,
      package_name_ar: buying.name_ar,
      price,
      payment_method_id: selectedPayment?.id ?? null,
      payment_reference: paymentReference.trim() || null,
    });
    setSubmitting(false);
    if (insertError) {
      setSheetError(translateAuthError(insertError.message));
      return;
    }
    setSent(true);
    loadMine(userId);
  };

  const carText = (id: string) => {
    const car = cars.find((c) => c.id === id);
    return car ? carWithPlate(car) : undefined;
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={refreshControl}>
          <Text style={styles.title}>{t('packages.title')}</Text>
          {!!error && <ErrorBanner message={error} />}
          {loading && <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />}

          {mine.length > 0 && (
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionLabel}>{t('packages.myPackages')}</Text>
              {mine.map((up) => (
                <PackageCard key={up.id} userPackage={up} carText={carText(up.car_id)} />
              ))}
            </View>
          )}

          {!loading && (
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionLabel}>{t('packages.available')}</Text>
              {packages.length === 0 && <Text style={styles.hint}>{t('packages.noPackages')}</Text>}
              {packages.map((pkg) => {
                const { price: p, regular, from } = cardPrice(pkg);
                const savePct = regular && p !== null ? Math.round(((regular - p) / regular) * 100) : null;
                const description = localized(lang, pkg.description_en, pkg.description_ar);
                return (
                  <View key={pkg.id} style={styles.planCard}>
                    <View style={styles.planTop}>
                      <Text style={styles.planName}>{localized(lang, pkg.name_en, pkg.name_ar)}</Text>
                      {savePct !== null && savePct > 0 && (
                        <View style={styles.saveBadge}>
                          <Text style={styles.saveText}>{t('packages.savePct', { pct: savePct })}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.itemsRow}>
                      {pkg.items.map((i) => (
                        <View key={i.pack_id} style={styles.itemChip}>
                          <Text style={styles.itemQty}>{i.quantity}×</Text>
                          <Text style={styles.itemName}>{localized(lang, i.name_en, i.name_ar)}</Text>
                        </View>
                      ))}
                    </View>
                    {!!description && <Text style={styles.planDesc}>{description}</Text>}
                    <View style={styles.priceRow}>
                      <Text style={styles.planPrice}>
                        {p === null ? '—' : from ? t('common.fromEgp', { price: p }) : t('common.egp', { price: p })}
                      </Text>
                      <Text style={styles.perMonth}> {t('packages.perMonth')}</Text>
                    </View>
                    {regular !== null && <Text style={styles.regular}>{t('packages.insteadOf', { price: t('common.egp', { price: regular }) })}</Text>}
                    <View style={styles.perks}>
                      <Perk text={t('packages.perkOneCar')} />
                      <Perk text={t('packages.perkOneMonth')} />
                    </View>
                    <GoldButton title={t('packages.choose')} height={50} onPress={() => openBuy(pkg)} />
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="Packages" onNavigate={onNavigate} />

      <BottomSheet visible={!!buying} onClose={() => setBuying(null)}>
        {buying && sent ? (
          <View style={{ gap: 14, alignItems: 'center', paddingVertical: 10 }}>
            <View style={styles.sentIcon}>
              <Feather name="check" size={30} color={colors.goldOnGoldText} />
            </View>
            <Text style={styles.sheetTitle}>{t('packages.sentTitle')}</Text>
            <Text style={styles.sheetText}>{t('packages.bought')}</Text>
            <GoldButton title={t('confirmed.done')} height={52} style={{ alignSelf: 'stretch' }} onPress={() => setBuying(null)} />
          </View>
        ) : (
          buying && (
            <ScrollView contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitleLeft}>{localized(lang, buying.name_en, buying.name_ar)}</Text>

              <Text style={styles.sectionLabel}>{t('packages.vehicle')}</Text>
              {cars.length === 0 ? (
                <Text style={styles.hint}>{t('packages.addCarHint')}</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {cars.map((c) => {
                    const p = buying.prices[c.car_type];
                    const disabled = p === undefined;
                    const sel = c.id === carId;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        disabled={disabled}
                        style={[styles.optionRow, sel && styles.optionRowOn, disabled && { opacity: 0.45 }]}
                        onPress={() => setCarId(c.id)}
                      >
                        <Feather name="truck" size={18} color={colors.gold} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionName}>{carLabel(c)}</Text>
                          <Text style={styles.optionDesc}>{disabled ? t('packages.notForThisCar') : c.plate ?? ''}</Text>
                        </View>
                        {!disabled && <Text style={styles.optionPrice}>{t('common.egp', { price: p })}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.sectionLabel}>{t('packages.payment')}</Text>
              <View style={{ gap: 8 }}>
                {paymentMethods.map((m) => {
                  const sel = m.id === paymentId;
                  const instructions = localized(lang, m.instructions_en, m.instructions_ar);
                  return (
                    <TouchableOpacity key={m.id} style={[styles.optionRow, sel && styles.optionRowOn]} onPress={() => setPaymentId(m.id)}>
                      <View style={[styles.radio, sel && styles.radioOn]}>{sel && <View style={styles.radioDot} />}</View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionName}>{localized(lang, m.label_en, m.label_ar)}</Text>
                        {!!m.account_info && <Text style={styles.optionDesc}>{m.account_info}</Text>}
                        {sel && !!instructions && <Text style={styles.optionDesc}>{instructions}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {needsReference && (
                <TextInput
                  style={styles.input}
                  value={paymentReference}
                  onChangeText={setPaymentReference}
                  placeholder={t('packages.referencePlaceholder')}
                  placeholderTextColor={colors.textFaint}
                />
              )}

              <Text style={styles.hint}>{t('packages.validity')}</Text>
              {!!sheetError && <ErrorBanner message={sheetError} />}
              <GoldButton
                title={
                  submitting
                    ? t('packages.buying')
                    : price !== null
                      ? t('packages.requestFor', { price: t('common.egp', { price }) })
                      : t('packages.buy')
                }
                height={54}
                onPress={handleBuy}
                disabled={submitting || !selectedCar || price === null || (needsReference && !paymentReference.trim())}
              />
            </ScrollView>
          )
        )}
      </BottomSheet>
    </View>
  );
}

function Perk({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Feather name="check" size={14} color={colors.success} />
      <Text style={styles.perkText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 22 },
  title: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.label },
  hint: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.textFaint },

  planCard: {
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderGold, borderRadius: 20, padding: 18, gap: 10,
  },
  planTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  planName: { flex: 1, fontFamily: fonts.extrabold, fontSize: 19, color: colors.text },
  saveBadge: { backgroundColor: 'rgba(122,209,154,0.14)', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  saveText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.success },
  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  itemChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 10, backgroundColor: colors.surfaceGoldTint,
  },
  itemQty: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.gold },
  itemName: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  planDesc: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.textFaint },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  planPrice: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.gold },
  perMonth: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textFaint },
  regular: { fontFamily: fonts.medium, fontSize: 13, color: colors.textFaint, textDecorationLine: 'line-through', marginTop: -6 },
  perks: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 4 },
  perkText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textDim },

  sheetTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.text, textAlign: 'center' },
  sheetTitleLeft: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.text },
  sheetText: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.textDim, textAlign: 'center' },
  sentIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, minHeight: 56,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
  },
  optionRowOn: { borderColor: colors.gold, backgroundColor: colors.surfaceGoldTint },
  optionName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  optionDesc: { fontFamily: fonts.medium, fontSize: 13, color: colors.textFaint, marginTop: 2 },
  optionPrice: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.gold },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  radioOn: { borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  input: {
    height: 52, paddingHorizontal: 15, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    color: colors.text, fontFamily: fonts.semibold, fontSize: 15,
  },
});
