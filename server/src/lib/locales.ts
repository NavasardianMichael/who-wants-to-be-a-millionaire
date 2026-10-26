/**
 * The 80 locales the API generates questions for — the same list as `src/i18n/config.ts`.
 *
 * `culture` is what the generator writes "local" questions about. It names the people and
 * places a speaker of that language most likely identifies with, so `local_culture`
 * questions feel native rather than translated.
 *
 * `script` is a check on the model's output: a question for `ja` that contains no Japanese
 * characters was answered in the wrong language and is rejected. Latin-script locales use
 * `null` — there is no cheap way to tell Turkish from English by alphabet alone.
 */
type LocaleInfo = {
  /** English name, used inside the (English) prompt. */
  name: string
  culture: string
  script: RegExp | null
}

const ARABIC = /[؀-ۿ]/
const CYRILLIC = /[Ѐ-ӿ]/
const DEVANAGARI = /[ऀ-ॿ]/

export const LOCALE_INFO = {
  en: { name: 'English', culture: 'the English-speaking world (UK, USA, Canada, Australia, Ireland, New Zealand)', script: null },
  'zh-CN': { name: 'Simplified Chinese', culture: 'mainland China', script: /[一-鿿]/ },
  hi: { name: 'Hindi', culture: 'India (especially the Hindi belt)', script: DEVANAGARI },
  es: { name: 'Spanish', culture: 'Spain and Latin America', script: null },
  fr: { name: 'French', culture: 'France, Belgium, Switzerland, Quebec and francophone Africa', script: null },
  ar: { name: 'Arabic', culture: 'the Arab world (Middle East and North Africa)', script: ARABIC },
  bn: { name: 'Bengali', culture: 'Bangladesh and West Bengal', script: /[ঀ-৿]/ },
  'pt-BR': { name: 'Brazilian Portuguese', culture: 'Brazil', script: null },
  ru: { name: 'Russian', culture: 'Russia and the Russian-speaking world', script: CYRILLIC },
  ur: { name: 'Urdu', culture: 'Pakistan', script: ARABIC },
  id: { name: 'Indonesian', culture: 'Indonesia', script: null },
  de: { name: 'German', culture: 'Germany, Austria and Switzerland', script: null },
  ja: { name: 'Japanese', culture: 'Japan', script: /[぀-ヿ一-鿿]/ },
  sw: { name: 'Swahili', culture: 'East Africa (Kenya, Tanzania, Uganda)', script: null },
  mr: { name: 'Marathi', culture: 'Maharashtra, India', script: DEVANAGARI },
  te: { name: 'Telugu', culture: 'Andhra Pradesh and Telangana, India', script: /[ఀ-౿]/ },
  tr: { name: 'Turkish', culture: 'Turkey', script: null },
  ta: { name: 'Tamil', culture: 'Tamil Nadu, Sri Lanka and the Tamil diaspora', script: /[஀-௿]/ },
  vi: { name: 'Vietnamese', culture: 'Vietnam', script: null },
  ko: { name: 'Korean', culture: 'South Korea', script: /[가-힯]/ },
  it: { name: 'Italian', culture: 'Italy', script: null },
  fa: { name: 'Persian', culture: 'Iran, Afghanistan and Tajikistan', script: ARABIC },
  th: { name: 'Thai', culture: 'Thailand', script: /[฀-๿]/ },
  gu: { name: 'Gujarati', culture: 'Gujarat, India', script: /[઀-૿]/ },
  pl: { name: 'Polish', culture: 'Poland', script: null },
  uk: { name: 'Ukrainian', culture: 'Ukraine', script: CYRILLIC },
  kn: { name: 'Kannada', culture: 'Karnataka, India', script: /[ಀ-೿]/ },
  ml: { name: 'Malayalam', culture: 'Kerala, India', script: /[ഀ-ൿ]/ },
  pa: { name: 'Punjabi', culture: 'Punjab (India and Pakistan)', script: /[਀-੿]/ },
  fil: { name: 'Filipino', culture: 'the Philippines', script: null },
  ms: { name: 'Malay', culture: 'Malaysia, Brunei and Singapore', script: null },
  nl: { name: 'Dutch', culture: 'the Netherlands and Flanders', script: null },
  ro: { name: 'Romanian', culture: 'Romania and Moldova', script: null },
  el: { name: 'Greek', culture: 'Greece and Cyprus', script: /[Ͱ-Ͽ]/ },
  cs: { name: 'Czech', culture: 'the Czech Republic', script: null },
  hu: { name: 'Hungarian', culture: 'Hungary', script: null },
  sv: { name: 'Swedish', culture: 'Sweden', script: null },
  he: { name: 'Hebrew', culture: 'Israel', script: /[֐-׿]/ },
  da: { name: 'Danish', culture: 'Denmark', script: null },
  fi: { name: 'Finnish', culture: 'Finland', script: null },
  nb: { name: 'Norwegian Bokmål', culture: 'Norway', script: null },
  sk: { name: 'Slovak', culture: 'Slovakia', script: null },
  bg: { name: 'Bulgarian', culture: 'Bulgaria', script: CYRILLIC },
  sr: { name: 'Serbian (Cyrillic)', culture: 'Serbia, Montenegro and Bosnia', script: CYRILLIC },
  hr: { name: 'Croatian', culture: 'Croatia', script: null },
  az: { name: 'Azerbaijani', culture: 'Azerbaijan', script: null },
  kk: { name: 'Kazakh', culture: 'Kazakhstan', script: CYRILLIC },
  uz: { name: 'Uzbek (Latin)', culture: 'Uzbekistan', script: null },
  hy: { name: 'Armenian', culture: 'Armenia and the Armenian diaspora', script: /[԰-֏]/ },
  ka: { name: 'Georgian', culture: 'Georgia', script: /[Ⴀ-ჿ]/ },
  'zh-TW': { name: 'Traditional Chinese', culture: 'Taiwan, Hong Kong and Macau', script: /[一-鿿]/ },
  jv: { name: 'Javanese', culture: 'Java, Indonesia', script: null },
  ha: { name: 'Hausa', culture: 'northern Nigeria and Niger', script: null },
  am: { name: 'Amharic', culture: 'Ethiopia', script: /[ሀ-፿]/ },
  yo: { name: 'Yoruba', culture: 'south-western Nigeria and Benin', script: null },
  ne: { name: 'Nepali', culture: 'Nepal', script: DEVANAGARI },
  my: { name: 'Burmese', culture: 'Myanmar', script: /[က-႟]/ },
  ig: { name: 'Igbo', culture: 'south-eastern Nigeria', script: null },
  si: { name: 'Sinhala', culture: 'Sri Lanka', script: /[඀-෿]/ },
  km: { name: 'Khmer', culture: 'Cambodia', script: /[ក-៿]/ },
  ps: { name: 'Pashto', culture: 'Afghanistan and north-western Pakistan', script: ARABIC },
  or: { name: 'Odia', culture: 'Odisha, India', script: /[଀-୿]/ },
  zu: { name: 'Zulu', culture: 'South Africa (especially KwaZulu-Natal)', script: null },
  so: { name: 'Somali', culture: 'Somalia, Djibouti and the Somali regions of Ethiopia and Kenya', script: null },
  af: { name: 'Afrikaans', culture: 'South Africa and Namibia', script: null },
  ky: { name: 'Kyrgyz', culture: 'Kyrgyzstan', script: CYRILLIC },
  mn: { name: 'Mongolian (Cyrillic)', culture: 'Mongolia', script: CYRILLIC },
  lo: { name: 'Lao', culture: 'Laos', script: /[຀-໿]/ },
  ca: { name: 'Catalan', culture: 'Catalonia, Valencia, the Balearic Islands and Andorra', script: null },
  sq: { name: 'Albanian', culture: 'Albania and Kosovo', script: null },
  lt: { name: 'Lithuanian', culture: 'Lithuania', script: null },
  mk: { name: 'Macedonian', culture: 'North Macedonia', script: CYRILLIC },
  be: { name: 'Belarusian', culture: 'Belarus', script: CYRILLIC },
  sl: { name: 'Slovenian', culture: 'Slovenia', script: null },
  lv: { name: 'Latvian', culture: 'Latvia', script: null },
  gl: { name: 'Galician', culture: 'Galicia, Spain', script: null },
  et: { name: 'Estonian', culture: 'Estonia', script: null },
  eu: { name: 'Basque', culture: 'the Basque Country and Navarre', script: null },
  cy: { name: 'Welsh', culture: 'Wales', script: null },
  is: { name: 'Icelandic', culture: 'Iceland', script: null },
} as const satisfies Record<string, LocaleInfo>

export type Locale = keyof typeof LOCALE_INFO

export const LOCALES = Object.keys(LOCALE_INFO) as Locale[]

export const DEFAULT_LOCALE: Locale = 'en'

export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && value in LOCALE_INFO
