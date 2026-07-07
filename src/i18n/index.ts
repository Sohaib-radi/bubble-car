import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, DevSettings } from 'react-native';
import en from './en.json';
import ar from './ar.json';

export type LanguageCode = 'en' | 'ar';

const LANGUAGE_STORAGE_KEY = 'app_language';
const RTL_LANGUAGES: LanguageCode[] = ['ar'];

export function isRTLLanguage(lang: LanguageCode) {
  return RTL_LANGUAGES.includes(lang);
}

async function getStoredLanguage(): Promise<LanguageCode | null> {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'en' || stored === 'ar' ? stored : null;
}

function detectDeviceLanguage(): LanguageCode {
  return Localization.getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';
}

export async function resolveInitialLanguage(): Promise<LanguageCode> {
  const stored = await getStoredLanguage();
  return stored ?? detectDeviceLanguage();
}

// Returns true if the caller must reload the app for the RTL direction change to take effect.
export async function setAppLanguage(lang: LanguageCode): Promise<boolean> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);

  const shouldBeRTL = isRTLLanguage(lang);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return true;
  }
  return false;
}

export async function changeLanguageAndReload(lang: LanguageCode) {
  const needsReload = await setAppLanguage(lang);
  if (needsReload) DevSettings.reload();
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
