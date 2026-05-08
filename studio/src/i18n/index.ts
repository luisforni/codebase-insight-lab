import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import es from './locales/es'
import en from './locales/en'
import de from './locales/de'
import fr from './locales/fr'
import it from './locales/it'
import pt from './locales/pt'
import zh from './locales/zh'
import ja from './locales/ja'
import ru from './locales/ru'
import ar from './locales/ar'

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

const savedLang = localStorage.getItem('language') as LanguageCode | null

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    de: { translation: de },
    fr: { translation: fr },
    it: { translation: it },
    pt: { translation: pt },
    zh: { translation: zh },
    ja: { translation: ja },
    ru: { translation: ru },
    ar: { translation: ar },
  },
  lng: savedLang ?? 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
})

export default i18n
