import i18n, { use } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { LANGUAGES } from './constants'
import en from './locales/en.json'
import hy from './locales/hy.json'
import ru from './locales/ru.json'

// eslint-disable-next-line react-hooks/rules-of-hooks
use(initReactI18next).init({
  compatibilityJSON: 'v4', // needed for React Native
  fallbackLng: LANGUAGES.en,
  lng: LANGUAGES.en, // default language
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    hy: { translation: hy },
  },
  interpolation: {
    escapeValue: false, // not needed for RN
  },
})

export default i18n
