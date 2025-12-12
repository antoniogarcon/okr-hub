import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredLanguage, setStoredLanguage } from '@/lib/storage';

export type SupportedLanguage = 'pt-BR' | 'en' | 'es';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; name: string }[] = [
  { code: 'pt-BR', label: 'PT', name: 'Português (Brasil)' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
];

/**
 * Hook for managing application language with persistence
 */
export const useLanguage = () => {
  const { i18n } = useTranslation();

  const currentLanguage = (i18n.language || getStoredLanguage()) as SupportedLanguage;

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    setStoredLanguage(lang);
  }, [i18n]);

  const getCurrentLanguageInfo = useCallback(() => {
    return SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  }, [currentLanguage]);

  return {
    currentLanguage,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    getCurrentLanguageInfo,
  };
};

export default useLanguage;
