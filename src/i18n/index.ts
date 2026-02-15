import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './languages/en.json';
import el from './languages/el.json';
import de from './languages/de.json';

const LANGUAGE_KEY = '@shopping_list:language';

const resources = {
  en: { translation: en },
  el: { translation: el },
  de: { translation: de },
};

// Get device language (Expo SDK 50+ uses getLocales() instead of deprecated .locale)
const locales = Localization.getLocales();
const deviceLanguage = locales?.[0]?.languageCode ?? 'en';
const supportedLanguages = ['en', 'el', 'de'];
const defaultLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v3',
  });

// Load saved language preference
AsyncStorage.getItem(LANGUAGE_KEY).then((savedLanguage) => {
  if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
    i18n.changeLanguage(savedLanguage);
  }
});

// Function to change language and save preference
export const changeLanguage = async (lang: 'en' | 'el' | 'de') => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

export default i18n;
