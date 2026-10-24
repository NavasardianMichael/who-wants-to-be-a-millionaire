# Web app — invariants

## Routing and i18n
- Every page lives under `app/[lang]/`; `ROUTES` (`src/constants/routes.ts`) never contains a
  locale. Internal links use `AppLink` / `@i18n/navigation`, never `next/link`.
- Every indexable page exports `generateMetadata` built with `pageMetadata()` (`@i18n/metadata`):
  self-canonical + hreflang for all 50 locales + `x-default`. Private pages pass `noIndex`.
- Adding a public route: add it to `ROUTES`, `INDEXABLE_ROUTES` (sitemap) and the nav constants.
- RTL locales (`ar`, `ur`, `fa`, `he`) get `dir="rtl"`; use logical utilities (`ms-`, `pe-`,
  `inset-s-`, `text-start`) and flip directional icons with `rtl:-scale-x-100`.
- Scripts Montserrat/Manrope lack are loaded per locale from Google Fonts (`src/styles/fonts.ts`).

## Server rendering
- Pages need nothing locale-specific to be static: `src/i18n/request.ts` reads `lang()` from
  `next/root-params`. Never destructure `requestLocale` there (it calls `headers()`, making
  every page dynamic), and do not reach for the deprecated `setRequestLocale`.
- Pages are static per locale (`generateStaticParams` in the root layout) with ISR where they
  show live data (`revalidate`). Server fetches go through `@helpers/serverData` and return
  empty on failure, so a build without the API still succeeds.
- Client components are islands. The game's setup panel renders on the server with default
  settings, so the playable UI is in the HTML.

## State and data
- API calls: `src/api/<domain>/{endpoints,types,processors,main}.ts`; the server envelope is
  `{ value, error }` and processors unwrap it.
- Stores: `create()(immer(combine(initialState, actions)))` + `appendSelectors`; read with
  `useXStore.use.field()`. Stores never import components.
- The game director is `src/store/game/session/store.ts`: every async step checks
  `alive(gen)` so quitting mid-sequence cannot mutate a newer game.
- Anything lost by leaving the page (a game in progress, a form with unsaved input) calls
  `useLeaveGuard(reason)`; `LeaveGuard` in the shell asks on links, back and tab close.

## Design system (Ant Design 6 + Tailwind 4)
- One chain, bookie's: `styles/tokens.ts` (hex owner) → `styles/theme.ts` (antd ThemeConfig,
  dark algorithm, `cssVar` scoped to `CSS_VAR_SCOPE` on `<html>`) → `:root { --ant-* }` →
  globals.css §2 aliases (the only place naming `--ant-*`) → `@theme inline` utilities. The
  colour ramps are mirrored in globals.css §1; `tests/unit/styles/tokens.spec.ts` keeps them equal.
- Cascade layers: `<AntdRegistry layer>` puts antd in `@layer antd`, ordered
  `theme, base, antd, components, utilities` — a Tailwind class on an antd component wins
  without `!important`, and preflight never resets an antd control.
- Corners are deliberately tight (`RADII` 4/6/10 px; Tailwind's `rounded-*` scale is reduced
  to match). `rounded-full` only for things that are round: avatars, lifeline ovals, dots.
- Buttons are the show's hexagon (`btn-hex` + `btn-gold|violet|outline|danger`, globals.css §8):
  rim, gloss, shape-following glow, a light sweep on hover; antd's click wave is off.
- Use the kit, all antd underneath: `Button` (gold/violet/outline/ghost/danger) / `ButtonLink`
  (server-safe, same classes), `IconButton` (label = tooltip), `Dialog` (Modal; bottom sheet
  below `md`; end drawer), `SegmentedControl` (Segmented), `Chip` (CheckableTag), `Toggle`
  (Switch), `Spinner` (Spin), `ErrorAlert` (Alert), `Avatar`, `Toaster` (bridges the `toast()`
  store to antd `message`). Pages use antd directly where it fits: `Table`, `Select`, `Input`,
  `Pagination`, `Empty`, `Collapse`, `Slider`, `Statistic`, `Skeleton`, `Steps`, `Upload` + `antd-img-crop`.
- Kept custom because they are the show: `Lozenge`, `AnswerOption`, `PrizeLadder`,
  `LifelineBar`, `TimerRing`, the studio backdrop.
- Motion: `motion/react` for orchestrated pieces, CSS keyframes for ambient ones; everything
  respects `prefers-reduced-motion` (global rule in §10, `useReducedMotion` in components).
- Accessibility: every icon-only control has a label; state is never colour-only; live regions
  announce results, lifeline outcomes and the 10 s / 5 s timer thresholds.
