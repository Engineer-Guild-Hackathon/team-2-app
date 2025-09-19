import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ja } from './locales/ja';
import { en } from './locales/en';

type Locale = 'ja' | 'en';
type TranslationKeys = typeof ja;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  isJapanese: boolean;
}

const locales = { ja, en };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current?.[key] !== undefined) {
      current = current[key];
    } else {
      console.warn(`Translation key not found: ${path}`);
      return path; // フォールバック：キー自体を返す
    }
  }

  return typeof current === 'string' ? current : path;
}

export function I18nProvider({ children, defaultLocale = 'ja' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // ブラウザの言語設定をチェック
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'ja' || savedLocale === 'en')) {
      return savedLocale;
    }

    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ja')) {
      return 'ja';
    }

    return defaultLocale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback((key: string): string => {
    const translations = locales[locale];
    return getNestedValue(translations, key);
  }, [locale]);

  const isJapanese = locale === 'ja';

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isJapanese }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// 型安全なヘルパーフック
export function useTranslation() {
  const { t, locale, setLocale, isJapanese } = useI18n();
  return { t, locale, setLocale, isJapanese };
}

// 特定のセクションの翻訳を取得するヘルパー
export function useSectionTranslation(section: keyof TranslationKeys) {
  const { t } = useI18n();

  return useCallback((key: string) => {
    return t(`${section}.${key}`);
  }, [t, section]);
}