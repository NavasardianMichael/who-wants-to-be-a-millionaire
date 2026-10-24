import type { Locale as AntdLocale } from 'antd/es/locale'
import { DEFAULT_LOCALE, type Locale } from './config'

type Loader = () => Promise<{ default: AntdLocale }>

/**
 * antd's own locale ids are language_REGION, not our BCP-47 codes. antd ships 45 of our 50;
 * Swahili, Telugu, Gujarati, Punjabi and Filipino have no bundle and fall back to English.
 * That only affects antd's built-in copy (pagination, empty states, upload hints) — every
 * string we render ourselves is translated.
 */
const ANTD_LOCALE_LOADERS: Partial<Record<Locale, Loader>> = {
  en: () => import('antd/locale/en_US'),
  'zh-CN': () => import('antd/locale/zh_CN'),
  hi: () => import('antd/locale/hi_IN'),
  es: () => import('antd/locale/es_ES'),
  fr: () => import('antd/locale/fr_FR'),
  ar: () => import('antd/locale/ar_EG'),
  bn: () => import('antd/locale/bn_BD'),
  'pt-BR': () => import('antd/locale/pt_BR'),
  ru: () => import('antd/locale/ru_RU'),
  ur: () => import('antd/locale/ur_PK'),
  id: () => import('antd/locale/id_ID'),
  de: () => import('antd/locale/de_DE'),
  ja: () => import('antd/locale/ja_JP'),
  mr: () => import('antd/locale/mr_IN'),
  tr: () => import('antd/locale/tr_TR'),
  ta: () => import('antd/locale/ta_IN'),
  vi: () => import('antd/locale/vi_VN'),
  ko: () => import('antd/locale/ko_KR'),
  it: () => import('antd/locale/it_IT'),
  fa: () => import('antd/locale/fa_IR'),
  th: () => import('antd/locale/th_TH'),
  pl: () => import('antd/locale/pl_PL'),
  uk: () => import('antd/locale/uk_UA'),
  kn: () => import('antd/locale/kn_IN'),
  ml: () => import('antd/locale/ml_IN'),
  ms: () => import('antd/locale/ms_MY'),
  nl: () => import('antd/locale/nl_NL'),
  ro: () => import('antd/locale/ro_RO'),
  el: () => import('antd/locale/el_GR'),
  cs: () => import('antd/locale/cs_CZ'),
  hu: () => import('antd/locale/hu_HU'),
  sv: () => import('antd/locale/sv_SE'),
  he: () => import('antd/locale/he_IL'),
  da: () => import('antd/locale/da_DK'),
  fi: () => import('antd/locale/fi_FI'),
  nb: () => import('antd/locale/nb_NO'),
  sk: () => import('antd/locale/sk_SK'),
  bg: () => import('antd/locale/bg_BG'),
  sr: () => import('antd/locale/sr_RS'),
  hr: () => import('antd/locale/hr_HR'),
  az: () => import('antd/locale/az_AZ'),
  kk: () => import('antd/locale/kk_KZ'),
  uz: () => import('antd/locale/uz_UZ'),
  hy: () => import('antd/locale/hy_AM'),
  ka: () => import('antd/locale/ka_GE'),
}

/**
 * Resolved on the server and handed to `ConfigProvider` as a prop (bookie's pattern), so only
 * the active locale's few KB cross the RSC boundary and none of the 45 bundles enter the
 * client bundle. antd's locale objects are plain data, which is what makes that possible.
 */
export const getAntdLocale = async (locale: Locale): Promise<AntdLocale> => {
  const load = ANTD_LOCALE_LOADERS[locale] ?? ANTD_LOCALE_LOADERS[DEFAULT_LOCALE]!
  const { default: antdLocale } = await load()
  return antdLocale
}
