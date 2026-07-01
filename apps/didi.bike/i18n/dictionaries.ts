
import type { Locale, Dictionary } from '@/types/i18n.d';

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import('./locales/en.json').then((m) => m.default),
  id: () => import('./locales/id.json').then((m) => m.default),
};


export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const loader = dictionaries[locale];
  if (!loader) return dictionaries.en();
  return loader();
}
