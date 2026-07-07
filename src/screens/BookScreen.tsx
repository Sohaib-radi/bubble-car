import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, gradients } from '../theme';
import GoldButton from '../components/GoldButton';
import ErrorBanner from '../components/ErrorBanner';
import { supabase } from '../lib/supabase';
import { translateAuthError } from '../lib/authErrors';
import { SERVICE_KEYS, SERVICE_PRICES, ServiceKey } from '../data/services';
import en from '../i18n/en.json';

const DOWS = [1, 2, 3, 4, 5]; // Mon-Fri

const TIMES = ['09:00', '10:30', '12:00', '14:30', '16:00', '17:30'];
const DISABLED_TIMES = ['17:30'];

function nextDateForWeekday(dow: number): string {
  const now = new Date();
  const diff = (dow - now.getDay() + 7) % 7;
  const result = new Date(now);
  result.setDate(now.getDate() + diff);
  return result.toISOString().split('T')[0];
}

function localeFor(lang: string) {
  return lang === 'ar' ? 'ar-EG' : 'en-GB';
}

type Car = { id: string; name: string; plate: string };

export default function BookScreen({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  const { t, i18n } = useTranslation();
  const locale = localeFor(i18n.language);
  const [service, setService] = useState<ServiceKey>('full');
  const [day, setDay] = useState(1);
  const [time, setTime] = useState('14:30');
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState<string | null>(null);
  const [carsError, setCarsError] = useState('');
  const [addingCar, setAddingCar] = useState(false);
  const [newCarName, setNewCarName] = useState('');
  const [newCarPlate, setNewCarPlate] = useState('');
  const [savingCar, setSavingCar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selected = {
    key: service,
    name: t(`common.services.${service}.name`),
    desc: t(`common.services.${service}.desc`),
    price: SERVICE_PRICES[service],
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCarsError(t('common.notSignedIn'));
        return;
      }

      const { data, error: carsErr } = await supabase
        .from('cars')
        .select('id, name, plate')
        .eq('owner_id', user.id)
        .order('created_at');

      if (carsErr) {
        setCarsError(translateAuthError(carsErr.message));
        return;
      }
      setCars(data ?? []);
      if (data && data.length > 0) setCarId(data[0].id);
    })();
  }, []);

  const handleAddCar = async () => {
    if (!newCarName.trim() || !newCarPlate.trim()) return;
    setSavingCar(true);
    setCarsError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSavingCar(false);
      setCarsError(t('common.notSignedIn'));
      return;
    }

    const { data, error: insertErr } = await supabase
      .from('cars')
      .insert({ owner_id: user.id, name: newCarName.trim(), plate: newCarPlate.trim() })
      .select('id, name, plate')
      .single();

    setSavingCar(false);
    if (insertErr) {
      setCarsError(translateAuthError(insertErr.message));
      return;
    }
    if (data) {
      setCars((prev) => [...prev, data]);
      setCarId(data.id);
    }
    setNewCarName('');
    setNewCarPlate('');
    setAddingCar(false);
  };

  const handleConfirm = async () => {
    if (!carId) return;
    setError('');
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('bookings').insert({
      user_id: user.id,
      car_id: carId,
      service_key: selected.key,
      service_name: en.common.services[selected.key].name,
      price: selected.price,
      booking_date: nextDateForWeekday(DOWS[day]),
      booking_time: time,
      status: 'pending',
    });

    setSubmitting(false);
    if (insertError) {
      setError(translateAuthError(insertError.message));
      return;
    }
    onConfirm();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Feather name="arrow-left" size={18} color={colors.gold} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('book.title')}</Text>
          </View>

          <View>
            <Text style={styles.sectionLabel}>{t('book.vehicle')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {cars.map((c) => {
                const isSel = c.id === carId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.vehicleCard, isSel && styles.vehicleCardActive]}
                    onPress={() => setCarId(c.id)}
                  >
                    <Feather name="truck" size={22} color={colors.gold} />
                    <View>
                      <Text style={styles.vehicleName}>{c.name}</Text>
                      <Text style={styles.vehiclePlate}>{c.plate}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.addVehicle} onPress={() => setAddingCar((v) => !v)}>
                <Feather name={addingCar ? 'x' : 'plus'} size={20} color="#9a978f" />
              </TouchableOpacity>
            </View>

            {cars.length === 0 && !addingCar && (
              <Text style={styles.vehicleHint}>{t('book.noVehicles')}</Text>
            )}

            {addingCar && (
              <View style={styles.addCarForm}>
                <TextInput
                  style={styles.addCarInput}
                  value={newCarName}
                  onChangeText={setNewCarName}
                  placeholder={t('book.carNamePlaceholder')}
                  placeholderTextColor={colors.textFaint}
                />
                <TextInput
                  style={styles.addCarInput}
                  value={newCarPlate}
                  onChangeText={setNewCarPlate}
                  placeholder={t('book.platePlaceholder')}
                  placeholderTextColor={colors.textFaint}
                />
                <GoldButton
                  title={savingCar ? t('book.saving') : t('book.saveVehicle')}
                  onPress={handleAddCar}
                  disabled={savingCar || !newCarName.trim() || !newCarPlate.trim()}
                  height={46}
                />
              </View>
            )}

            {!!carsError && <ErrorBanner message={carsError} style={{ marginTop: 9 }} />}
          </View>

          <View>
            <Text style={styles.sectionLabel}>{t('book.service')}</Text>
            <View style={{ gap: 9 }}>
              {SERVICE_KEYS.map((key) => {
                const isSel = key === service;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.serviceRow, isSel && styles.serviceRowActive]}
                    onPress={() => setService(key)}
                  >
                    <View style={[styles.radio, isSel && styles.radioActive]}>
                      {isSel && <View style={styles.radioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{t(`common.services.${key}.name`)}</Text>
                      <Text style={styles.serviceDesc}>{t(`common.services.${key}.desc`)}</Text>
                    </View>
                    <Text style={[styles.servicePrice, isSel && { color: colors.gold }]}>
                      {key === 'accessories'
                        ? t('common.fromEgp', { price: SERVICE_PRICES[key] })
                        : t('common.egp', { price: SERVICE_PRICES[key] })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={styles.sectionLabel}>{t('book.date')}</Text>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {DOWS.map((dow, i) => {
                const isSel = i === day;
                const d = new Date(nextDateForWeekday(dow));
                const label = d.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
                const num = d.getDate();
                return (
                  <TouchableOpacity key={dow} style={{ flex: 1 }} onPress={() => setDay(i)}>
                    {isSel ? (
                      <LinearGradient colors={gradients.goldSoft} locations={gradients.goldSoftLocations} style={styles.dayChip}>
                        <Text style={styles.dayLabelActive}>{label}</Text>
                        <Text style={styles.dayNumActive}>{num}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.dayChipInactive}>
                        <Text style={styles.dayLabel}>{label}</Text>
                        <Text style={styles.dayNum}>{num}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={styles.sectionLabel}>{t('book.time')}</Text>
            <View style={styles.timeGrid}>
              {TIMES.map((t) => {
                const isSel = t === time;
                const isDisabled = DISABLED_TIMES.includes(t);
                if (isSel) {
                  return (
                    <LinearGradient key={t} colors={gradients.goldSoft} locations={gradients.goldSoftLocations} style={styles.timeChip}>
                      <Text style={styles.timeTextActive}>{t}</Text>
                    </LinearGradient>
                  );
                }
                return (
                  <TouchableOpacity
                    key={t}
                    disabled={isDisabled}
                    onPress={() => setTime(t)}
                    style={[styles.timeChipInactive, isDisabled && styles.timeChipDisabled]}
                  >
                    <Text style={[styles.timeText, isDisabled && styles.timeTextDisabled]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {!!error && <ErrorBanner message={error} style={{ marginHorizontal: 22 }} />}

        <View style={styles.footer}>
          <View>
            <Text style={styles.totalLabel}>{t('book.total')}</Text>
            <Text style={styles.totalValue}>{t('common.egp', { price: selected.price })}</Text>
          </View>
          <GoldButton
            title={submitting ? t('book.booking') : t('book.confirmBooking')}
            onPress={handleConfirm}
            disabled={submitting || !carId}
            style={{ flex: 1 }}
            height={56}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 24, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.extrabold, fontSize: 23, color: colors.text, letterSpacing: -0.3 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: colors.label, marginBottom: 10 },
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  vehicleCardActive: { borderColor: colors.borderGoldStrong, backgroundColor: colors.surfaceGoldTint },
  vehicleName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  vehiclePlate: { fontFamily: fonts.medium, fontSize: 11, color: colors.textFaint },
  addVehicle: {
    width: 50, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  vehicleHint: { marginTop: 9, fontFamily: fonts.medium, fontSize: 12, color: colors.textFaint },
  addCarForm: { marginTop: 9, gap: 9 },
  addCarInput: {
    height: 48, paddingHorizontal: 15, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    color: colors.text, fontFamily: fonts.semibold, fontSize: 14,
  },
  serviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 10, paddingHorizontal: 15,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  serviceRowActive: { backgroundColor: colors.surfaceGoldTint, borderColor: colors.borderGold },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  radioActive: { borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e0c674' },
  serviceName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  serviceDesc: { fontFamily: fonts.medium, fontSize: 11, color: colors.textFaint, marginTop: 2 },
  servicePrice: { fontFamily: fonts.bold, fontSize: 14, color: '#cfcdc6' },
  dayChip: { paddingVertical: 8, borderRadius: 14, alignItems: 'center', gap: 4 },
  dayChipInactive: {
    paddingVertical: 8, borderRadius: 14, alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  dayLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textDim },
  dayNum: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  dayLabelActive: { fontFamily: fonts.bold, fontSize: 11, color: 'rgba(26,20,7,0.7)' },
  dayNumActive: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.goldOnGoldText },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  timeChip: { width: '31%', paddingVertical: 11, borderRadius: 13, alignItems: 'center' },
  timeChipInactive: {
    width: '31%', paddingVertical: 11, borderRadius: 13, alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  timeChipDisabled: { backgroundColor: '#101012', borderColor: 'rgba(255,255,255,0.05)' },
  timeText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  timeTextActive: { fontFamily: fonts.bold, fontSize: 14, color: colors.goldOnGoldText },
  timeTextDisabled: { color: 'rgba(243,241,234,0.25)', textDecorationLine: 'line-through' },
  footer: {
    paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14,
    borderTopWidth: 1, borderTopColor: colors.borderSoft,
  },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.textFaint },
  totalValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text, marginTop: 1 },
});
