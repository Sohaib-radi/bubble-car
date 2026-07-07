import React, { useCallback, useEffect, useState } from 'react';
import { View, I18nManager, DevSettings } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreenAPI from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookScreen from './src/screens/BookScreen';
import ConfirmedScreen from './src/screens/ConfirmedScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BookingDetailsScreen from './src/screens/BookingDetailsScreen';
import { NavKey } from './src/components/BottomNav';
import { colors } from './src/theme';
import { supabase } from './src/lib/supabase';
import i18n, { resolveInitialLanguage, isRTLLanguage } from './src/i18n';

SplashScreenAPI.preventAutoHideAsync();

type Route = 'Splash' | 'Login' | 'Register' | NavKey | 'Confirmed' | 'BookingDetails';

export default function App() {
  const [route, setRoute] = useState<Route>('Splash');
  const [sessionChecked, setSessionChecked] = useState(false);
  const [languageReady, setLanguageReady] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetailsFrom, setBookingDetailsFrom] = useState<Route>('Home');

  const [fontsLoaded] = useFonts(
    I18nManager.isRTL
      ? { Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold, Cairo_800ExtraBold }
      : { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold }
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setRoute('Home');
      setSessionChecked(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setRoute('Splash');
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      const lang = await resolveInitialLanguage();
      await i18n.changeLanguage(lang);

      const shouldBeRTL = isRTLLanguage(lang);
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
        DevSettings.reload();
        return;
      }
      setLanguageReady(true);
    })();
  }, []);

  const onLayout = useCallback(async () => {
    if (fontsLoaded && sessionChecked && languageReady) await SplashScreenAPI.hideAsync();
  }, [fontsLoaded, sessionChecked, languageReady]);

  if (!fontsLoaded || !sessionChecked || !languageReady) return null;

  const goTab = (k: NavKey) => setRoute(k);

  const openBooking = (id: string, from: Route) => {
    setSelectedBookingId(id);
    setBookingDetailsFrom(from);
    setRoute('BookingDetails');
  };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={onLayout}>
        {route === 'Splash' && (
          <SplashScreen onGetStarted={() => setRoute('Register')} onSignIn={() => setRoute('Login')} />
        )}
        {route === 'Login' && (
          <LoginScreen onBack={() => setRoute('Splash')} onSignIn={() => setRoute('Home')} onCreateAccount={() => setRoute('Register')} />
        )}
        {route === 'Register' && (
          <RegisterScreen onBack={() => setRoute('Splash')} onCreateAccount={() => setRoute('Home')} onSignIn={() => setRoute('Login')} />
        )}
        {route === 'Home' && (
          <HomeScreen onNavigate={goTab} onBookWash={() => setRoute('Book')} onOpenBooking={(id) => openBooking(id, 'Home')} />
        )}
        {route === 'Book' && <BookScreen onBack={() => setRoute('Home')} onConfirm={() => setRoute('Confirmed')} />}
        {route === 'Confirmed' && <ConfirmedScreen onDone={() => setRoute('Home')} />}
        {route === 'History' && <HistoryScreen onNavigate={goTab} onOpenBooking={(id) => openBooking(id, 'History')} />}
        {route === 'Profile' && <ProfileScreen onNavigate={goTab} onLogout={() => setRoute('Splash')} />}
        {route === 'BookingDetails' && selectedBookingId && (
          <BookingDetailsScreen bookingId={selectedBookingId} onBack={() => setRoute(bookingDetailsFrom)} />
        )}
      </View>
    </SafeAreaProvider>
  );
}
