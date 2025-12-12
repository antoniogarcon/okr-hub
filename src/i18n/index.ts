import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en': { translation: en },
  'es': { translation: es },
};

// Get stored language with fallback
const getInitialLanguage = (): string => {
  try {
    return localStorage.getItem('okrs_view_language') || 'pt-BR';
  } catch {
    return 'pt-BR';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
  });

// Sync language changes to storage
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('okrs_view_language', lng);
  } catch (error) {
    console.error('Failed to persist language:', error);
  }
});

export default i18n;
