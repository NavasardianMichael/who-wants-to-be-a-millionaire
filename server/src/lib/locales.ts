/**
 * The 80 locales the API generates questions for — the same list as `src/i18n/config.ts`.
 *
 * `culture` is what the generator writes "local" questions about. It names the people and
 * places a speaker of that language most likely identifies with, so `local_culture`
 * questions feel native rather than translated.
 *
 * `script` is a check on the model's output: a question for `ja` that contains no Japanese
 * characters was answered in the wrong language and is rejected. Latin-script locales use
 * `null` — there is no cheap way to tell Swahili from English by alphabet alone.
 *
 * `writing` names the conventions a model gets wrong when it thinks in English and writes in
 * the target language: the standard variety, punctuation, quotation marks. `notNative` is the
 * cheap check behind it — a character a native text in that language never contains.
 */
export type LocaleInfo = {
  /** English name, used inside the (English) prompt. */
  name: string
  culture: string
  script: RegExp | null
  writing?: string
  notNative?: RegExp
}

const ARABIC = /[؀-ۿ]/
const CYRILLIC = /[Ѐ-ӿ]/
const DEVANAGARI = /[ऀ-ॿ]/

export const LOCALE_INFO = {
  en: {
    name: 'English',
    culture: 'the English-speaking world (UK, USA, Canada, Australia, Ireland, New Zealand)',
    script: null,
  },
  'zh-CN': {
    name: 'Simplified Chinese',
    culture: 'mainland China',
    script: /[一-鿿]/,
    writing: 'Use simplified characters, mainland vocabulary and full-width punctuation (，。？「」 or “”).',
  },
  hi: {
    name: 'Hindi',
    culture: 'India (especially the Hindi belt)',
    script: DEVANAGARI,
    writing:
      'Write the standard Hindi of educated speakers — neither heavily Sanskritised nor mixed with English. End statements with ।.',
  },
  es: {
    name: 'Spanish',
    culture: 'Spain and Latin America',
    script: null,
    writing: 'Write neutral Spanish that reads naturally in both Spain and Latin America. Open questions with ¿.',
  },
  fr: {
    name: 'French',
    culture: 'France, Belgium, Switzerland, Quebec and francophone Africa',
    script: null,
    writing: 'Use French typography: « » quotation marks, and a non-breaking space before ? ! : ;.',
  },
  ar: {
    name: 'Arabic',
    culture: 'the Arab world (Middle East and North Africa)',
    script: ARABIC,
    writing: 'Write Modern Standard Arabic. Use Arabic punctuation: ؟ and ،.',
  },
  bn: {
    name: 'Bengali',
    culture: 'Bangladesh and West Bengal',
    script: /[ঀ-৿]/,
    writing: 'End statements with the danda ।.',
  },
  'pt-BR': {
    name: 'Brazilian Portuguese',
    culture: 'Brazil',
    script: null,
    writing: 'Use Brazilian spelling, vocabulary and phrasing, never European Portuguese.',
  },
  ru: {
    name: 'Russian',
    culture: 'Russia and the Russian-speaking world',
    script: CYRILLIC,
    writing: 'Use « » quotation marks.',
  },
  ur: {
    name: 'Urdu',
    culture: 'Pakistan',
    script: ARABIC,
    writing: 'Write Urdu, not Hindi: Perso-Arabic script and vocabulary, with ؟ and ۔ as punctuation.',
  },
  id: { name: 'Indonesian', culture: 'Indonesia', script: null },
  de: {
    name: 'German',
    culture: 'Germany, Austria and Switzerland',
    script: null,
    writing: 'Use German quotation marks „ “.',
  },
  ja: {
    name: 'Japanese',
    culture: 'Japan',
    script: /[぀-ヿ一-鿿]/,
    writing: 'Use Japanese punctuation (、。「」) and natural Japanese quiz phrasing.',
  },
  sw: { name: 'Swahili', culture: 'East Africa (Kenya, Tanzania, Uganda)', script: null },
  mr: { name: 'Marathi', culture: 'Maharashtra, India', script: DEVANAGARI },
  te: { name: 'Telugu', culture: 'Andhra Pradesh and Telangana, India', script: /[ఀ-౿]/ },
  ta: { name: 'Tamil', culture: 'Tamil Nadu, Sri Lanka and the Tamil diaspora', script: /[஀-௿]/ },
  vi: { name: 'Vietnamese', culture: 'Vietnam', script: null },
  ko: { name: 'Korean', culture: 'South Korea', script: /[가-힯]/ },
  it: { name: 'Italian', culture: 'Italy', script: null },
  fa: {
    name: 'Persian',
    culture: 'Iran, Afghanistan and Tajikistan',
    script: ARABIC,
    writing: 'Write the Persian of Iran with Persian letters (ی, ک, not the Arabic forms), and ؟ and ، as punctuation.',
  },
  th: { name: 'Thai', culture: 'Thailand', script: /[฀-๿]/ },
  gu: { name: 'Gujarati', culture: 'Gujarat, India', script: /[઀-૿]/ },
  pl: { name: 'Polish', culture: 'Poland', script: null },
  uk: {
    name: 'Ukrainian',
    culture: 'Ukraine',
    script: CYRILLIC,
    writing: 'Write natural Ukrainian, never calqued from Russian. Use « » quotation marks.',
  },
  kn: { name: 'Kannada', culture: 'Karnataka, India', script: /[ಀ-೿]/ },
  ml: { name: 'Malayalam', culture: 'Kerala, India', script: /[ഀ-ൿ]/ },
  pa: { name: 'Punjabi', culture: 'Punjab (India and Pakistan)', script: /[਀-੿]/ },
  fil: { name: 'Filipino', culture: 'the Philippines', script: null },
  ms: { name: 'Malay', culture: 'Malaysia, Brunei and Singapore', script: null },
  nl: { name: 'Dutch', culture: 'the Netherlands and Flanders', script: null },
  ro: { name: 'Romanian', culture: 'Romania and Moldova', script: null },
  el: {
    name: 'Greek',
    culture: 'Greece and Cyprus',
    script: /[Ͱ-Ͽ]/,
    writing: 'Greek uses ; as its question mark, never ?. Use « » quotation marks.',
    notNative: /\?/,
  },
  cs: { name: 'Czech', culture: 'the Czech Republic', script: null },
  hu: { name: 'Hungarian', culture: 'Hungary', script: null },
  sv: { name: 'Swedish', culture: 'Sweden', script: null },
  he: {
    name: 'Hebrew',
    culture: 'Israel',
    script: /[֐-׿]/,
    writing: 'Write modern Israeli Hebrew without niqqud.',
  },
  da: { name: 'Danish', culture: 'Denmark', script: null },
  fi: { name: 'Finnish', culture: 'Finland', script: null },
  nb: {
    name: 'Norwegian Bokmål',
    culture: 'Norway',
    script: null,
    writing: 'Write Bokmål, not Nynorsk and not Danish.',
  },
  sk: { name: 'Slovak', culture: 'Slovakia', script: null },
  bg: { name: 'Bulgarian', culture: 'Bulgaria', script: CYRILLIC },
  sr: {
    name: 'Serbian (Cyrillic)',
    culture: 'Serbia, Montenegro and Bosnia',
    script: CYRILLIC,
    writing: 'Write Serbian in Cyrillic only, in the ekavian standard.',
  },
  hr: { name: 'Croatian', culture: 'Croatia', script: null },
  kk: {
    name: 'Kazakh',
    culture: 'Kazakhstan',
    script: CYRILLIC,
    writing: 'Write Kazakh in Cyrillic, never Russian words where Kazakh ones exist.',
  },
  uz: {
    name: 'Uzbek (Latin)',
    culture: 'Uzbekistan',
    script: null,
    writing: 'Write Uzbek in the Latin alphabet (oʻ, gʻ), never Cyrillic.',
  },
  hy: {
    name: 'Armenian',
    culture: 'Armenia and the Armenian diaspora',
    script: /[԰-֏]/,
    writing:
      'Write modern Eastern Armenian as it is written in the Republic of Armenia, in the reformed orthography. ' +
      'Armenian punctuation only: the question mark ՞ sits on the stressed vowel of the questioned word (Ո՞վ, Ո՞ր, Ե՞րբ, Քանի՞), ' +
      'never a Latin ? at the end; ։ ends a sentence, never a Latin full stop or colon; quotation marks are « ». ' +
      'Foreign names take their established Armenian spelling (Շեքսպիր, Նյուտոն).',
    notNative: /\?/,
  },
  ka: {
    name: 'Georgian',
    culture: 'Georgia',
    script: /[Ⴀ-ჿ]/,
    writing: 'Write Georgian in Mkhedruli and use „ “ quotation marks.',
  },
  'zh-TW': {
    name: 'Traditional Chinese',
    culture: 'Taiwan, Hong Kong and Macau',
    script: /[一-鿿]/,
    writing:
      'Use traditional characters, Taiwanese vocabulary and full-width punctuation (，。？「」), never mainland terms.',
  },
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
  ky: {
    name: 'Kyrgyz',
    culture: 'Kyrgyzstan',
    script: CYRILLIC,
    writing: 'Write Kyrgyz, never Russian words where Kyrgyz ones exist.',
  },
  mn: { name: 'Mongolian (Cyrillic)', culture: 'Mongolia', script: CYRILLIC },
  lo: { name: 'Lao', culture: 'Laos', script: /[຀-໿]/ },
  ca: {
    name: 'Catalan',
    culture: 'Catalonia, Valencia, the Balearic Islands and Andorra',
    script: null,
    writing: 'Write Catalan, never calqued from Spanish.',
  },
  sq: { name: 'Albanian', culture: 'Albania and Kosovo', script: null },
  lt: { name: 'Lithuanian', culture: 'Lithuania', script: null },
  mk: { name: 'Macedonian', culture: 'North Macedonia', script: CYRILLIC },
  be: {
    name: 'Belarusian',
    culture: 'Belarus',
    script: CYRILLIC,
    writing: 'Write Belarusian in the official orthography, never Russian words in Belarusian spelling.',
  },
  sl: { name: 'Slovenian', culture: 'Slovenia', script: null },
  lv: { name: 'Latvian', culture: 'Latvia', script: null },
  gl: {
    name: 'Galician',
    culture: 'Galicia, Spain',
    script: null,
    writing: 'Write Galician in the official (RAG) norm, never calqued from Spanish.',
  },
  et: { name: 'Estonian', culture: 'Estonia', script: null },
  eu: {
    name: 'Basque',
    culture: 'the Basque Country and Navarre',
    script: null,
    writing: 'Write standard Basque (euskara batua), never calqued from Spanish.',
  },
  cy: { name: 'Welsh', culture: 'Wales', script: null },
  is: { name: 'Icelandic', culture: 'Iceland', script: null },
  om: {
    name: 'Oromo (Latin script, Qubee)',
    culture: 'the Oromia region of Ethiopia and northern Kenya',
    script: null,
  },
  su: { name: 'Sundanese', culture: 'West Java and Banten, Indonesia', script: null },
} as const satisfies Record<string, LocaleInfo>

export type Locale = keyof typeof LOCALE_INFO

export const LOCALES = Object.keys(LOCALE_INFO) as Locale[]

export const DEFAULT_LOCALE: Locale = 'en'

export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && value in LOCALE_INFO
