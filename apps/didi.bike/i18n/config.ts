
import type { Locale } from '@/types/i18n.d';

export const locales = ['en', 'id'] as const;
export const defaultLocale: Locale = 'en';


export const localeNames: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
};


export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}
