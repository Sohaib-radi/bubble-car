import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius } from '../theme';
import BottomNav, { NavKey } from '../components/BottomNav';
import LanguageModal from '../components/LanguageModal';
import { supabase } from '../lib/supabase';
import { changeLanguageAndReload, LanguageCode } from '../i18n';

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function ProfileScreen({ onNavigate, onLogout }: { onNavigate: (k: NavKey) => void; onLogout: () => void }) {
  const { t, i18n } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberYear, setMemberYear] = useState<number | null>(null);
  const [carCount, setCarCount] = useState(0);
  const [washCount, setWashCount] = useState(0);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, created_at')
        .eq('id', user.id)
        .single();
      if (profile) {
        setFullName(profile.full_name);
        setPhone(profile.phone ?? '');
        setMemberYear(new Date(profile.created_at).getFullYear());
      }

      const { count: cars } = await supabase
        .from('cars')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      setCarCount(cars ?? 0);

      const { count: washes } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setWashCount(washes ?? 0);
    })();
  }, []);

  const handleSelectLanguage = async (lang: LanguageCode) => {
    setLanguageModalVisible(false);
    await changeLanguageAndReload(lang);
  };

  const MENU: { icon: keyof typeof Feather.glyphMap; label: string; value?: string; onPress?: () => void }[] = [
    { icon: 'truck', label: t('profile.menu.myCars'), value: String(carCount) },
    { icon: 'map-pin', label: t('profile.menu.savedAddresses') },
    { icon: 'credit-card', label: t('profile.menu.paymentMethods') },
    { icon: 'bell', label: t('profile.menu.notifications') },
    {
      icon: 'globe',
      label: t('profile.menu.language'),
      value: i18n.language === 'ar' ? t('profile.languageArabic') : t('profile.languageEnglish'),
      onPress: () => setLanguageModalVisible(true),
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{fullName ? initialsOf(fullName) : ''}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{fullName || '...'}</Text>
              <Text style={styles.phone}>{phone}</Text>
            </View>
            <LinearGradient colors={['#d4af37', '#f6dd8e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.vipBadge}>
              <Text style={styles.vipBadgeText}>{t('profile.vip')}</Text>
            </LinearGradient>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}><Text style={styles.statValue}>{washCount}</Text><Text style={styles.statLabel}>{t('profile.washes')}</Text></View>
            <View style={styles.divider} />
            <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.gold }]}>1,240</Text><Text style={styles.statLabel}>{t('profile.points')}</Text></View>
            <View style={styles.divider} />
            <View style={styles.statItem}><Text style={styles.statValue}>{memberYear ?? '—'}</Text><Text style={styles.statLabel}>{t('profile.member')}</Text></View>
          </View>

          <View style={styles.menuCard}>
            {MENU.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuRow, i === MENU.length - 1 && { borderBottomWidth: 0 }]}
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <Feather name={item.icon} size={20} color={colors.gold} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                <Feather name="chevron-right" size={18} color="#5a5a60" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="Profile" onNavigate={onNavigate} />
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
  scroll: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: {
    width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: colors.borderGold,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#1c1c20',
  },
  avatarText: { color: colors.gold, fontFamily: fonts.bold, fontSize: 22 },
  name: { fontFamily: fonts.bold, fontSize: 21, color: colors.text },
  phone: { fontFamily: fonts.medium, fontSize: 13, color: colors.textFaint, marginTop: 2 },
  vipBadge: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 11 },
  vipBadgeText: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1.6, color: colors.goldOnGoldText },
  statsCard: {
    marginTop: 18, flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderWidth: 1,
    borderColor: colors.borderSoft, borderRadius: 16, paddingVertical: 15,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.textFaint, marginTop: 2 },
  divider: { width: 1, backgroundColor: colors.border },
  menuCard: { marginTop: 18, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.xl, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 17,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  menuLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  menuValue: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textFaint, marginRight: 4 },
  logoutBtn: {
    marginTop: 16, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(220,90,90,0.08)', borderWidth: 1, borderColor: 'rgba(220,90,90,0.25)',
  },
  logoutText: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger, letterSpacing: 0.2 },
});
