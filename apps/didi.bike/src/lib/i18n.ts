import fs from 'fs';
import path from 'path';

// didi.bike-specific i18n helper
const LOCALES_DIR = path.resolve(__dirname, '../../i18n/locales');

export function getDictionary(locale: 'en' | 'id') {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
