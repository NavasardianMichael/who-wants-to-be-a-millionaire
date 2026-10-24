import { theme, type ThemeConfig } from 'antd'
import { CORRECT, CSS_VAR_SCOPE, GOLD, LINE, LOCK, MAGENTA, RADII, SPOT, STUDIO, TEXT, WRONG } from './tokens'

/**
 * antd's theme, derived from `tokens.ts` (bookie's pattern, on the dark algorithm).
 *
 * - **CSS-variable mode** (`cssVar`): antd emits `--ant-*` on `:root` (the scope class is on
 *   `<html>`), so globals.css §2 can alias them for Tailwind and both libraries move together.
 * - **Cascade layer**: the registry wraps antd's styles in `@layer antd`, declared *below*
 *   Tailwind's utilities in globals.css — a utility class always beats antd's own rule, so
 *   no `!important` and no fighting cssinjs.
 * - Seed colours are literals: antd feeds them to its palette generator, which cannot read
 *   `var()`.
 *
 * Gold is the primary colour, as money is on the show; violet carries links and info.
 * Controls that put text on a gold fill set their text to the studio's darkest step.
 */
export const antdTheme: ThemeConfig = {
  cssVar: { prefix: 'ant', key: CSS_VAR_SCOPE },
  hashed: false,
  algorithm: theme.darkAlgorithm,

  token: {
    fontFamily: 'var(--font-sans)',
    fontSize: 15,

    colorPrimary: GOLD[400],
    colorLink: SPOT[300],
    colorLinkHover: SPOT[100],
    colorInfo: SPOT[500],
    colorSuccess: CORRECT[500],
    colorWarning: LOCK[500],
    colorError: WRONG[500],

    colorTextBase: TEXT.ivory,
    colorTextSecondary: TEXT.mist,
    colorTextTertiary: TEXT.mistDim,
    colorTextDescription: TEXT.mist,
    colorTextPlaceholder: TEXT.mistDim,

    colorBgBase: STUDIO[950],
    colorBgLayout: STUDIO[950],
    colorBgContainer: STUDIO[900],
    colorBgElevated: STUDIO[800],
    colorBgSpotlight: STUDIO[700],
    colorBorder: LINE.strong,
    colorBorderSecondary: LINE.subtle,
    colorFillSecondary: STUDIO[800],

    borderRadius: RADII.base,
    borderRadiusLG: RADII.lg,
    borderRadiusSM: RADII.sm,
    borderRadiusXS: 2,

    controlHeight: 40,
    controlHeightLG: 48,
    wireframe: false,
    motionDurationMid: '0.25s',
  },

  components: {
    Button: {
      primaryColor: STUDIO[950],
      primaryShadow: `0 10px 30px -10px ${GOLD[500]}`,
      defaultBg: STUDIO[900],
      defaultBorderColor: LINE.strong,
      defaultColor: TEXT.ivory,
      defaultHoverBg: STUDIO[800],
      defaultHoverBorderColor: SPOT[300],
      defaultHoverColor: TEXT.ivory,
      fontWeight: 700,
      contentFontSizeLG: 17,
    },
    Modal: {
      contentBg: STUDIO[900],
      headerBg: STUDIO[900],
      footerBg: STUDIO[900],
      titleColor: GOLD[200],
      titleFontSize: 20,
    },
    Drawer: { colorBgElevated: STUDIO[900] },
    Segmented: {
      trackBg: STUDIO[950],
      itemColor: TEXT.mist,
      itemHoverColor: TEXT.ivory,
      itemHoverBg: STUDIO[800],
      itemSelectedBg: GOLD[400],
      itemSelectedColor: STUDIO[950],
    },
    Switch: { handleBg: TEXT.ivory, colorTextQuaternary: LINE.strong, colorTextTertiary: LINE.strong },
    Select: {
      optionSelectedBg: STUDIO[700],
      optionSelectedColor: TEXT.ivory,
      optionActiveBg: STUDIO[800],
      selectorBg: STUDIO[950],
    },
    Input: { activeBorderColor: GOLD[300], hoverBorderColor: SPOT[300], colorBgContainer: STUDIO[950] },
    Table: {
      headerBg: STUDIO[900],
      headerColor: SPOT[300],
      rowHoverBg: STUDIO[800],
      colorBgContainer: 'transparent',
      borderColor: LINE.subtle,
    },
    Tag: { defaultBg: STUDIO[900], defaultColor: TEXT.mist },
    Collapse: { headerBg: 'transparent', contentBg: 'transparent' },
    Tooltip: { colorBgSpotlight: STUDIO[700] },
    Slider: {
      trackBg: GOLD[400],
      trackHoverBg: GOLD[300],
      railBg: LINE.strong,
      railHoverBg: LINE.strong,
      handleColor: GOLD[300],
    },
    Message: { contentBg: STUDIO[800] },
    Progress: { defaultColor: GOLD[400], remainingColor: LINE.subtle },
    Skeleton: { gradientFromColor: STUDIO[800], gradientToColor: STUDIO[700] },
    Avatar: { colorTextPlaceholder: GOLD[200] },
    Alert: { colorErrorBg: STUDIO[900], colorErrorBorder: WRONG[700] },
    Statistic: { contentFontSize: 32 },
    Upload: { colorFillAlter: STUDIO[900] },
    Pagination: { itemActiveBg: GOLD[400], itemActiveColor: STUDIO[950] },
    Badge: { colorBgContainer: MAGENTA[500] },
  },
}
