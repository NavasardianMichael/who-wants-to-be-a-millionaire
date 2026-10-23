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

## Design system
- Colours, type scale, radii, shadows, animations: `src/styles/globals.css` §1 only.
- Use the kit: `Button`/`ButtonLink`, `IconButton`, `Lozenge`, `Dialog` (center/sheet/drawer),
  `SegmentedControl`, `Chip`, `Toggle`, `Card`, `Section`, `PageHeader`, `ErrorAlert`, `Toaster`.
- Motion: `motion/react` for orchestrated pieces, CSS keyframes for ambient ones; everything
  respects `prefers-reduced-motion` (global rule in §8, `useReducedMotion` in components).
- Accessibility: every icon-only control has a label; state is never colour-only; live regions
  announce results, lifeline outcomes and the 10 s / 5 s timer thresholds.
