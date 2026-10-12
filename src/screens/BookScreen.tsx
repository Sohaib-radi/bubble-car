import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius } from '../theme';
import GoldButton from '../components/GoldButton';
import ErrorBanner from '../components/ErrorBanner';
import BottomSheet from '../components/BottomSheet';
import ServiceCard from '../components/ServiceCard';
import PackageCard from '../components/PackageCard';
import { supabase } from '../lib/supabase';
import { translateAuthError } from '../lib/authErrors';
import {
  Car,
  CAR_SELECT,
  carLabel,
  Make,
  Model,
  Pack,
  PaymentMethod,
  UserPackage,
  fetchMyPackages,
  fetchPacks,
  localized,
  usablePackage,
} from '../lib/catalog';
import {
  BookingSettings,
  DayAvailability,
  PERIOD_ICONS,
  PeriodKey,
  fetchAvailability,
  fetchBookingSettings,
  formatHour,
  isoDate,
  partialClosures,
} from '../lib/settings';

const DAYS_AHEAD = 30;

export type BookingSummary = {
  ref: string;
  serviceName: string;
  carText: string;
  date: string;
  period: PeriodKey | null;
  price: number;
  viaPackage: boolean;
  remainingAfter: number | null;
};

function localeFor(lang: string) {
  return lang === 'ar' ? 'ar-EG' : 'en-GB';
}

export default function BookScreen({
  onBack,
  onConfirm,
}: {
  onBack: () => void;
  onConfirm: (summary: BookingSummary) => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const locale = localeFor(lang);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // data
  const [userId, setUserId] = useState<string | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [myPackages, setMyPackages] = useState<UserPackage[]>([]);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});

  // choices
  const [carId, setCarId] = useState<string | null>(null);
  const [packId, setPackId] = useState<string | null>(null);
  const [usePlan, setUsePlan] = useState(false);
  const [date, setDate] = useState(isoDate(new Date()));
  const [period, setPeriod] = useState<PeriodKey | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState('');

  // sheets
  const [planSheetPack, setPlanSheetPack] = useState<Pack | null>(null);
  const [addCarOpen, setAddCarOpen] = useState(false);
  const [newMakeId, setNewMakeId] = useState<string | null>(null);
  const [newModelId, setNewModelId] = useState<string | null>(null);
  const [newCarPlate, setNewCarPlate] = useState('');
  const [savingCar, setSavingCar] = useState(false);
  const [carError, setCarError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const days = useMemo(() => {
    const out: string[] = [];
    const start = new Date();
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(isoDate(d));
    }
    return out;
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadError(t('common.notSignedIn'));
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const [carsRes, makesRes, modelsRes, packsRes, paymentRes, myPackagesRes, settingsRes, availabilityRes] = await Promise.all([
        supabase.from('cars').select(CAR_SELECT).eq('owner_id', user.id).order('created_at').returns<Car[]>(),
        supabase.from('car_makes').select('id, name').order('name'),
        supabase.from('car_models').select('id, make_id, name, car_type').order('name').returns<Model[]>(),
        fetchPacks(),
        supabase
          .from('payment_methods')
          .select('id, label_en, label_ar, account_info, instructions_en, instructions_ar')
          .eq('active', true)
          .order('created_at'),
        fetchMyPackages(user.id),
        fetchBookingSettings(),
        fetchAvailability(days[0], days[days.length - 1]),
      ]);

      const err = carsRes.error?.message ?? packsRes.error ?? paymentRes.error?.message;
      if (err) setLoadError(translateAuthError(err));

      setCars(carsRes.data ?? []);
      if (carsRes.data && carsRes.data.length > 0) setCarId(carsRes.data[0].id);
      setMakes(makesRes.data ?? []);
      setModels(modelsRes.data ?? []);
      setPacks(packsRes.packs);
      setPaymentMethods(paymentRes.data ?? []);
      if (paymentRes.data && paymentRes.data.length > 0) setPaymentId(paymentRes.data[0].id);
      setMyPackages(myPackagesRes.userPackages);
      setSettings(settingsRes);
      setAvailability(availabilityRes);
      setLoading(false);
    })();
  }, []);

  const selectedCar = cars.find((c) => c.id === carId) ?? null;
  const selectedPack = packs.find((p) => p.id === packId) ?? null;
  const selectedPayment = paymentMethods.find((m) => m.id === paymentId) ?? null;
  const price = selectedCar && selectedPack ? selectedPack.prices[selectedCar.car_type] ?? null : null;
  const carPackage =
    myPackages.find((up) => up.car_id === carId && (up.status === 'active' || up.status === 'pending_review')) ?? null;

  // Plan coverage for the chosen date (defaults to today until step 2).
  const planMatch = usablePackage(myPackages, carId, packId, date);
  const payingWithPlan = usePlan && !!planMatch;
  const planLostForDate = usePlan && !planMatch;
  const needsReference = !payingWithPlan && !!selectedPayment?.account_info;
  const dayInfo = availability[date];
  const enabledPeriods = settings?.periods.filter((p) => p.enabled) ?? [];

  const includedLeftFor = (pack: Pack) => {
    const match = usablePackage(myPackages, carId, pack.id, isoDate(new Date()));
    return match ? match.remaining : null;
  };

  const choosePack = (pack: Pack) => {
    if (includedLeftFor(pack) !== null) {
      setPlanSheetPack(pack);
      return;
    }
    setPackId(pack.id);
    setUsePlan(false);
  };

  const chooseCar = (id: string) => {
    setCarId(id);
    setPackId(null);
    setUsePlan(false);
  };

  const chooseDate = (d: string) => {
    setDate(d);
    if (period && availability[d]?.blocked_periods.includes(period)) setPeriod(null);
  };

  const handleAddCar = async () => {
    const model = models.find((m) => m.id === newModelId);
    if (!userId || !newMakeId || !model || !newCarPlate.trim()) return;
    setSavingCar(true);
    setCarError('');
    const { data, error: insertErr } = await supabase
      .from('cars')
      .insert({ owner_id: userId, make_id: newMakeId, model_id: model.id, car_type: model.car_type, plate: newCarPlate.trim() })
      .select(CAR_SELECT)
      .returns<Car[]>()
      .single();
    setSavingCar(false);
    if (insertErr) {
      setCarError(translateAuthError(insertErr.message));
      return;
    }
    if (data) {
      setCars((prev) => [...prev, data]);
      chooseCar(data.id);
    }
    setNewMakeId(null);
    setNewModelId(null);
    setNewCarPlate('');
    setAddCarOpen(false);
  };

  const handleConfirm = async () => {
    if (!userId || !selectedCar || !selectedPack) return;
    if (!payingWithPlan && price === null) return;
    setError('');
    setSubmitting(true);

    // Customers create a 'draft'; the database then allows
    // draft -> awaiting_payment_proof -> pending_review, which staff review.
    const { data: draft, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        car_id: selectedCar.id,
        car_type: selectedCar.car_type,
        pack_id: selectedPack.id,
        pack_name_en: selectedPack.name_en,
        pack_name_ar: selectedPack.name_ar,
        // A plan booking costs nothing; the database re-checks the plan and forces price 0.
        user_package_id: payingWithPlan ? planMatch.userPackage.id : null,
        price: payingWithPlan ? 0 : price,
        payment_method_id: payingWithPlan ? null : selectedPayment?.id ?? null,
        payment_method_label_en: payingWithPlan ? null : selectedPayment?.label_en ?? null,
        payment_method_label_ar: payingWithPlan ? null : selectedPayment?.label_ar ?? null,
        booking_date: date,
        booking_time: period,
      })
      .select('id')
      .single();

    let stepError = insertError;
    if (draft) {
      ({ error: stepError } = await supabase
        .from('bookings')
        .update({ status: 'awaiting_payment_proof', expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() })
        .eq('id', draft.id));
    }
    if (draft && !stepError) {
      ({ error: stepError } = await supabase
        .from('bookings')
        .update({ status: 'pending_review', payment_reference: payingWithPlan ? null : paymentReference.trim() || null })
        .eq('id', draft.id));
    }

    setSubmitting(false);
    if (stepError || !draft) {
      setError(translateAuthError(stepError?.message ?? ''));
      return;
    }
    onConfirm({
      ref: draft.id.slice(0, 6).toUpperCase(),
      serviceName: localized(lang, selectedPack.name_en, selectedPack.name_ar),
      carText: `${carLabel(selectedCar)} · ${selectedCar.plate}`,
      date,
      period,
      price: payingWithPlan ? 0 : price ?? 0,
      viaPackage: payingWithPlan,
      remainingAfter: payingWithPlan ? planMatch.remaining - 1 : null,
    });
  };

  const goBack = () => (step === 1 ? onBack() : setStep((s) => (s - 1) as 1 | 2));

  const formatDay = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(locale, opts);
  const dayLabel = (d: string, i: number) =>
    i === 0 ? t('book.today') : i === 1 ? t('book.tomorrow') : formatDay(d, { weekday: 'short' });
  const periodLabel = (k: PeriodKey | null) => (k ? t(`book.periods.${k}`) : t('book.anyTime'));

  const footerSummary =
    step === 1
      ? selectedPack
        ? `${localized(lang, selectedPack.name_en, selectedPack.name_ar)} · ${
            usePlan ? t('book.included') : price !== null ? t('common.egp', { price }) : '—'
          }`
        : t('book.pickService')
      : step === 2
        ? `${formatDay(date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${periodLabel(period)}`
        : payingWithPlan
          ? t('book.included')
          : price !== null
            ? t('common.egp', { price })
            : '—';

  const canContinue =
    step === 1
      ? !!selectedCar && !!selectedPack && (usePlan || price !== null)
      : step === 2
        ? !dayInfo?.whole_day_blocked && !planLostForDate
        : !submitting && (payingWithPlan || price !== null) && !(needsReference && !paymentReference.trim());

  const onContinue = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else handleConfirm();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack} accessibilityLabel={t('common.back')}>
            <Feather name="arrow-left" size={18} color={colors.gold} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t(`book.stepTitles.${step}`)}</Text>
            <Text style={styles.stepCount}>{t('book.stepOf', { step, total: 3 })}</Text>
          </View>
        </View>
        <View style={styles.progress}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.progressSeg, s <= step && styles.progressSegOn]} />
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 60 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {!!loadError && <ErrorBanner message={loadError} />}

            {step === 1 && (
              <>
                <View>
                  <Text style={styles.sectionLabel}>{t('book.yourCar')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>
                    {cars.map((c) => {
                      const sel = c.id === carId;
                      return (
                        <TouchableOpacity key={c.id} style={[styles.carChip, sel && styles.carChipOn]} onPress={() => chooseCar(c.id)}>
                          <Feather name="truck" size={18} color={colors.gold} />
                          <View>
                            <Text style={styles.carName}>{carLabel(c)}</Text>
                            <Text style={styles.carPlate}>{c.plate}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity style={styles.addCarChip} onPress={() => setAddCarOpen(true)}>
                      <Feather name="plus" size={18} color={colors.gold} />
                      <Text style={styles.addCarText}>{t('book.addCar')}</Text>
                    </TouchableOpacity>
                  </ScrollView>
                  {cars.length === 0 && <Text style={styles.hint}>{t('book.noVehicles')}</Text>}
                </View>

                {carPackage && (
                  <View>
                    <PackageCard userPackage={carPackage} compact />
                    {carPackage.status === 'active' && <Text style={styles.hint}>{t('book.planHint')}</Text>}
                  </View>
                )}

                <View>
                  <Text style={styles.sectionLabel}>{t('book.chooseService')}</Text>
                  {!selectedCar && (
                    <Text style={[styles.hint, { marginTop: 0, marginBottom: 10 }]}>{t('book.selectCarForPrice')}</Text>
                  )}
                  <View style={styles.grid}>
                    {packs.map((pack) => (
                      <ServiceCard
                        key={pack.id}
                        pack={pack}
                        price={selectedCar ? pack.prices[selectedCar.car_type] ?? null : null}
                        includedLeft={includedLeftFor(pack)}
                        selected={pack.id === packId}
                        onPress={() => choosePack(pack)}
                      />
                    ))}
                  </View>
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <View>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionLabel}>{t('book.date')}</Text>
                    <Text style={styles.monthLabel}>{formatDay(date, { month: 'long', year: 'numeric' })}</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>
                    {days.map((d, i) => {
                      const info = availability[d];
                      const closed = !!info?.whole_day_blocked;
                      const sel = d === date;
                      return (
                        <TouchableOpacity
                          key={d}
                          disabled={closed}
                          style={[styles.dayChip, sel && styles.dayChipOn, closed && styles.dimmed]}
                          onPress={() => chooseDate(d)}
                        >
                          <Text style={[styles.dayName, sel && styles.dayTextOn]}>{dayLabel(d, i)}</Text>
                          <Text style={[styles.dayNum, sel && styles.dayTextOn, closed && styles.struck]}>
                            {formatDay(d, { day: 'numeric' })}
                          </Text>
                          {closed ? (
                            <Text style={styles.dayTagClosed}>{t('book.closed')}</Text>
                          ) : info?.is_full ? (
                            <Text style={[styles.dayTagFull, sel && styles.dayTextOn]}>{t('book.full')}</Text>
                          ) : (
                            <View style={{ height: 14 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {dayInfo?.is_full && (
                  <View style={styles.notice}>
                    <Feather name="alert-triangle" size={18} color={colors.gold} />
                    <Text style={styles.noticeText}>{t('book.dayFullNotice')}</Text>
                  </View>
                )}

                {planLostForDate && <ErrorBanner message={t('book.planNotValidForDate')} />}

                {!!dayInfo?.closed_hours?.length && !dayInfo.whole_day_blocked && (
                  <View style={styles.notice}>
                    <Feather name="clock" size={18} color={colors.gold} />
                    <Text style={styles.noticeText}>
                      {t('book.closedHoursNotice', {
                        hours: dayInfo.closed_hours
                          .map((r) => r.split('-').map((h) => formatHour(h === '24:00' ? '00:00' : h, lang)).join(' – '))
                          .join(', '),
                      })}
                    </Text>
                  </View>
                )}

                {enabledPeriods.length > 0 && (
                  <View>
                    <Text style={styles.sectionLabel}>
                      {t('book.preferredTime')} <Text style={styles.optional}>({t('book.optional')})</Text>
                    </Text>
                    <View style={{ gap: 9 }}>
                      {enabledPeriods.map((p) => {
                        const blocked = !!dayInfo?.blocked_periods.includes(p.key);
                        const partial = blocked ? [] : partialClosures(p, dayInfo?.closed_hours ?? []);
                        const sel = period === p.key;
                        return (
                          <TouchableOpacity
                            key={p.key}
                            disabled={blocked}
                            style={[styles.periodCard, sel && styles.periodCardOn, blocked && styles.dimmed]}
                            onPress={() => setPeriod(sel ? null : p.key)}
                          >
                            <View style={[styles.periodIcon, sel && { backgroundColor: colors.gold }]}>
                              <Feather name={PERIOD_ICONS[p.key]} size={20} color={sel ? colors.goldOnGoldText : colors.gold} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.periodName, blocked && styles.struck]}>{t(`book.periods.${p.key}`)}</Text>
                              <Text style={styles.periodHours}>
                                {blocked ? t('book.closed') : `${formatHour(p.start, lang)} – ${formatHour(p.end, lang)}`}
                              </Text>
                              {partial.length > 0 && (
                                <Text style={styles.partialText}>
                                  {t('book.partlyClosed', {
                                    hours: partial
                                      .map((c) => `${formatHour(c.start, lang)} – ${formatHour(c.end === '24:00' ? '00:00' : c.end, lang)}`)
                                      .join(', '),
                                  })}
                                </Text>
                              )}
                            </View>
                            {sel && <Feather name="check-circle" size={22} color={colors.gold} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {!period && <Text style={styles.hint}>{t('book.noPreferenceHint')}</Text>}
                  </View>
                )}
              </>
            )}

            {step === 3 && selectedPack && selectedCar && (
              <>
                <View style={styles.summary}>
                  <SummaryRow
                    icon="droplet"
                    value={localized(lang, selectedPack.name_en, selectedPack.name_ar)}
                    onEdit={() => setStep(1)}
                    editLabel={t('book.edit')}
                  />
                  <SummaryRow
                    icon="truck"
                    value={`${carLabel(selectedCar)} · ${selectedCar.plate}`}
                    onEdit={() => setStep(1)}
                    editLabel={t('book.edit')}
                  />
                  <SummaryRow
                    icon="calendar"
                    value={`${formatDay(date, { weekday: 'long', day: 'numeric', month: 'short' })} · ${periodLabel(period)}`}
                    onEdit={() => setStep(2)}
                    editLabel={t('book.edit')}
                    last
                  />
                </View>

                {payingWithPlan ? (
                  <View style={styles.coveredBox}>
                    <Feather name="gift" size={22} color={colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.coveredTitle}>{t('book.coveredTitle')}</Text>
                      <Text style={styles.coveredText}>
                        {t('book.coveredText', {
                          name: localized(lang, planMatch.userPackage.package_name_en, planMatch.userPackage.package_name_ar),
                          count: planMatch.remaining - 1,
                        })}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.sectionLabel}>{t('book.payment')}</Text>
                    <View style={{ gap: 9 }}>
                      {paymentMethods.map((m) => {
                        const sel = m.id === paymentId;
                        const instructions = localized(lang, m.instructions_en, m.instructions_ar);
                        return (
                          <TouchableOpacity key={m.id} style={[styles.payRow, sel && styles.payRowOn]} onPress={() => setPaymentId(m.id)}>
                            <View style={[styles.radio, sel && styles.radioOn]}>{sel && <View style={styles.radioDot} />}</View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.payName}>{localized(lang, m.label_en, m.label_ar)}</Text>
                              {!!m.account_info && <Text style={styles.payDesc}>{m.account_info}</Text>}
                              {sel && !!instructions && <Text style={styles.payDesc}>{instructions}</Text>}
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
                        placeholder={t('book.referencePlaceholder')}
                        placeholderTextColor={colors.textFaint}
                      />
                    )}
                  </View>
                )}

                {dayInfo?.is_full && (
                  <View style={styles.notice}>
                    <Feather name="alert-triangle" size={18} color={colors.gold} />
                    <Text style={styles.noticeText}>{t('book.dayFullNotice')}</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}

        {!!error && <ErrorBanner message={error} style={{ marginHorizontal: 20, marginBottom: 8 }} />}

        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerLabel}>{step === 3 ? t('book.total') : t('book.yourChoice')}</Text>
            <Text style={styles.footerValue} numberOfLines={1}>
              {footerSummary}
            </Text>
          </View>
          <GoldButton
            title={step === 3 ? (submitting ? t('book.booking') : t('book.confirmBooking')) : t('book.continue')}
            onPress={onContinue}
            disabled={!canContinue}
            style={{ minWidth: 150 }}
            height={54}
          />
        </View>
      </SafeAreaView>

      {/* Use-a-plan-wash confirmation */}
      <BottomSheet visible={!!planSheetPack} onClose={() => setPlanSheetPack(null)}>
        {planSheetPack && selectedCar && (
          <PlanSheetContent
            pack={planSheetPack}
            car={selectedCar}
            myPackages={myPackages}
            onUsePlan={() => {
              setPackId(planSheetPack.id);
              setUsePlan(true);
              setPlanSheetPack(null);
            }}
            onPayInstead={() => {
              setPackId(planSheetPack.id);
              setUsePlan(false);
              setPlanSheetPack(null);
            }}
          />
        )}
      </BottomSheet>

      {/* Add a car */}
      <BottomSheet visible={addCarOpen} onClose={() => setAddCarOpen(false)}>
        <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitleLeft}>{t('book.addCar')}</Text>
          <Text style={styles.formLabel}>{t('book.make')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {makes.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.chip, m.id === newMakeId && styles.chipOn]}
                onPress={() => {
                  setNewMakeId(m.id);
                  setNewModelId(null);
                }}
              >
                <Text style={[styles.chipText, m.id === newMakeId && styles.chipTextOn]}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {newMakeId && (
            <>
              <Text style={styles.formLabel}>{t('book.model')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {models
                  .filter((m) => m.make_id === newMakeId)
                  .map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.chip, m.id === newModelId && styles.chipOn]}
                      onPress={() => setNewModelId(m.id)}
                    >
                      <Text style={[styles.chipText, m.id === newModelId && styles.chipTextOn]}>
                        {m.name} · {t(`common.carTypes.${m.car_type}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </>
          )}
          <Text style={styles.formLabel}>{t('book.plate')}</Text>
          <TextInput
            style={[styles.input, { marginTop: 0 }]}
            value={newCarPlate}
            onChangeText={setNewCarPlate}
            placeholder={t('book.platePlaceholder')}
            placeholderTextColor={colors.textFaint}
          />
          {!!carError && <ErrorBanner message={carError} />}
          <GoldButton
            title={savingCar ? t('book.saving') : t('book.saveVehicle')}
            onPress={handleAddCar}
            disabled={savingCar || !newMakeId || !newModelId || !newCarPlate.trim()}
            height={52}
          />
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

function PlanSheetContent({
  pack,
  car,
  myPackages,
  onUsePlan,
  onPayInstead,
}: {
  pack: Pack;
  car: Car;
  myPackages: UserPackage[];
  onUsePlan: () => void;
  onPayInstead: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const match = usablePackage(myPackages, car.id, pack.id, isoDate(new Date()));
  if (!match) return null;
  const total = match.userPackage.balances.find((b) => b.pack_id === pack.id)?.quantity ?? match.remaining;
  const regular = pack.prices[car.car_type];
  const packName = localized(lang, pack.name_en, pack.name_ar);

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.sheetIcon}>
        <Feather name="gift" size={28} color={colors.goldOnGoldText} />
      </View>
      <Text style={styles.sheetTitle}>{t('book.planSheet.title')}</Text>
      <Text style={styles.sheetSubtitle}>{t('book.planSheet.subtitle')}</Text>
      <View style={styles.sheetTable}>
        <SheetRow label={t('book.planSheet.service')} value={packName} />
        <SheetRow label={t('book.planSheet.car')} value={`${carLabel(car)} · ${car.plate}`} />
        <SheetRow
          label={t('book.planSheet.plan')}
          value={localized(lang, match.userPackage.package_name_en, match.userPackage.package_name_ar)}
        />
      </View>
      <View style={styles.afterBox}>
        <Text style={styles.afterText}>{t('book.planSheet.after', { left: match.remaining - 1, total, name: packName })}</Text>
      </View>
      <GoldButton title={t('book.planSheet.confirm')} height={54} onPress={onUsePlan} />
      {regular !== undefined && (
        <TouchableOpacity style={styles.secondaryBtn} onPress={onPayInstead}>
          <Text style={styles.secondaryText}>{t('book.planSheet.payInstead', { price: t('common.egp', { price: regular }) })}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function SummaryRow({
  icon,
  value,
  onEdit,
  editLabel,
  last,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  onEdit: () => void;
  editLabel: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, !last && styles.summaryRowBorder]}>
      <Feather name={icon} size={18} color={colors.gold} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.editLink} onPress={onEdit}>
        {editLabel}
      </Text>
    </View>
  );
}

function SheetRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sheetRow}>
      <Text style={styles.sheetRowLabel}>{label}</Text>
      <Text style={styles.sheetRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 6 },
  backBtn: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  stepCount: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textFaint, marginTop: 1 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginTop: 14 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressSegOn: { backgroundColor: colors.gold },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, gap: 24 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.label, marginBottom: 10 },
  optional: { textTransform: 'none', letterSpacing: 0, fontFamily: fonts.medium },
  hint: { marginTop: 10, fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.textFaint },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  monthLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textDim },
  dimmed: { opacity: 0.45 },
  struck: { textDecorationLine: 'line-through' },

  carChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, minHeight: 56,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
  },
  carChipOn: { borderColor: colors.gold, backgroundColor: colors.surfaceGoldTint },
  carName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  carPlate: { fontFamily: fonts.medium, fontSize: 12, color: colors.textFaint },
  addCarChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, minHeight: 56,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderGold, borderStyle: 'dashed',
  },
  addCarText: { fontFamily: fonts.bold, fontSize: 14, color: colors.gold },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },

  dayChip: {
    width: 68, paddingVertical: 10, borderRadius: 16, alignItems: 'center', gap: 3,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
  },
  dayChipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  dayName: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textDim },
  dayNum: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  dayTextOn: { color: colors.goldOnGoldText },
  dayTagFull: { fontFamily: fonts.bold, fontSize: 10, color: colors.danger, height: 14 },
  dayTagClosed: { fontFamily: fonts.bold, fontSize: 10, color: colors.textFaint, height: 14 },

  notice: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: radius.md,
    backgroundColor: 'rgba(205,179,122,0.1)', borderWidth: 1, borderColor: colors.borderGold,
  },
  noticeText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.text },

  periodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, minHeight: 68,
    borderRadius: 18, backgroundColor: colors.surfaceAlt, borderWidth: 1.5, borderColor: colors.borderSoft,
  },
  periodCardOn: { borderColor: colors.gold, backgroundColor: colors.surfaceGoldTint },
  periodIcon: {
    width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceGoldTint, borderWidth: 1, borderColor: colors.borderGold,
  },
  periodName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  periodHours: { fontFamily: fonts.medium, fontSize: 13, color: colors.textFaint, marginTop: 2 },
  partialText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.gold, marginTop: 3 },

  summary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 18, paddingHorizontal: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  summaryValue: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  editLink: { fontFamily: fonts.bold, fontSize: 13, color: colors.gold, padding: 4 },

  coveredBox: {
    flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16, borderRadius: 18,
    backgroundColor: 'rgba(122,209,154,0.08)', borderWidth: 1, borderColor: 'rgba(122,209,154,0.3)',
  },
  coveredTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.success },
  coveredText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.textDim, marginTop: 2 },

  payRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 15, minHeight: 56,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
  },
  payRowOn: { backgroundColor: colors.surfaceGoldTint, borderColor: colors.gold },
  payName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  payDesc: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.textFaint, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  radioOn: { borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  input: {
    height: 52, paddingHorizontal: 15, marginTop: 10, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    color: colors.text, fontFamily: fonts.semibold, fontSize: 15,
  },

  footer: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    borderTopWidth: 1, borderTopColor: colors.borderSoft, backgroundColor: colors.bg,
  },
  footerLabel: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: colors.textFaint },
  footerValue: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text, marginTop: 2 },

  sheetIcon: {
    alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.text, textAlign: 'center' },
  sheetTitleLeft: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.text },
  sheetSubtitle: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.textDim, textAlign: 'center', marginTop: -8 },
  sheetTable: { backgroundColor: colors.surfaceAlt, borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.borderSoft },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12 },
  sheetRowLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textFaint },
  sheetRowValue: { flex: 1, textAlign: 'right', fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  afterBox: { padding: 14, borderRadius: 14, backgroundColor: 'rgba(122,209,154,0.1)' },
  afterText: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.success, textAlign: 'center' },
  secondaryBtn: {
    height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },

  formLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textFaint },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipOn: { borderColor: colors.gold, backgroundColor: colors.surfaceGoldTint },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  chipTextOn: { color: colors.gold },
});
