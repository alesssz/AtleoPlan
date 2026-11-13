# H3. Frontend: how to

[C1. Frontend](../concepts/C1-frontend.md) explains how the React app works. This page says **how to do things in it**: which files to create, what to write in each, which commands to run, and how to check the result. It is written for someone who has never written a React page.

**The code here has been run.** The example was built for real on this project, then removed; the outputs shown are what the commands printed. It is the React side of [H2. Backend: how to](H2-backend.md): a page at `/muscles` that lists the muscles from `GET /api/muscles`, with a form that lets admins rename one through `PATCH /api/muscles/{id}`.

**How to read this page:**

- The first time: [H3.1](#h31-before-you-start), then [H3.2](#h32-a-new-page) to [H3.5](#h35-testing-a-page) in order. Together they make a complete screen.
- Later, when you need one thing: translations [H3.6](#h36-translations), packages [H3.7](#h37-adding-an-npm-package), the browser's tools [H3.8](#h38-checking-in-the-browser) (a real phone: [H3.8.2](#h382-a-real-android-phone-over-usb)), ready-made components [H3.9](#h39-a-shadcnui-component).
- Something broke: [H3.10](#h310-when-something-goes-wrong).
- Real screens, as built: the exercise library [H3.12](#h312-the-exercise-library-screens-as-built), the plans [H3.13](#h313-the-plan-screens-as-built), the plan editor [H3.14](#h314-the-plan-editor-as-built), its two steps [H3.22](#h322-the-plan-editor-in-two-steps-as-built) and its picker's Create [H3.23](#h323-creating-an-exercise-from-the-picker-as-built), workout mode [H3.15](#h315-workout-mode-as-built), the list of set types, the RPE switch and the stopwatch [H3.24](#h324-set-types-the-rpe-switch-and-the-stopwatch-as-built), exercises done as fast as possible [H3.25](#h325-exercises-done-as-fast-as-possible-as-built), plan files [H3.26](#h326-plan-files-export-and-import-as-built), the loading signs [H3.27](#h327-loading-signs-as-built), Continue with Google [H3.28](#h328-continue-with-google-as-built), the link to the admin panel [H3.29](#h329-the-link-to-the-admin-panel-as-built), the photos of an exercise [H3.30](#h330-the-photos-of-an-exercise-as-built), workout mode after a real workout [H3.32](#h332-workout-mode-after-a-real-workout-as-built).

## Contents

- [H3.1 Before you start](#h31-before-you-start)
- [H3.2 A new page](#h32-a-new-page)
  - [H3.2.1 The page file](#h321-the-page-file)
  - [H3.2.2 Its texts](#h322-its-texts)
  - [H3.2.3 Its address](#h323-its-address)
  - [H3.2.4 Open it](#h324-open-it)
- [H3.3 Reading data from the API](#h33-reading-data-from-the-api)
  - [H3.3.1 The API file](#h331-the-api-file)
  - [H3.3.2 Using it in the page](#h332-using-it-in-the-page)
- [H3.4 A form that saves](#h34-a-form-that-saves)
  - [H3.4.1 The mutation](#h341-the-mutation)
  - [H3.4.2 The form](#h342-the-form)
- [H3.5 Testing a page](#h35-testing-a-page)
- [H3.6 Translations](#h36-translations)
- [H3.7 Adding an npm package](#h37-adding-an-npm-package)
  - [H3.7.1 A vulnerable package deep in the tree: overrides](#h371-a-vulnerable-package-deep-in-the-tree-overrides)
- [H3.8 Checking in the browser](#h38-checking-in-the-browser)
  - [H3.8.1 Phone, tablet and desktop widths](#h381-phone-tablet-and-desktop-widths)
  - [H3.8.2 A real Android phone over USB](#h382-a-real-android-phone-over-usb)
- [H3.9 A shadcn/ui component](#h39-a-shadcnui-component)
- [H3.10 When something goes wrong](#h310-when-something-goes-wrong)
- [H3.11 Commands at a glance](#h311-commands-at-a-glance)
- [H3.12 The exercise library screens, as built](#h312-the-exercise-library-screens-as-built)
  - [H3.12.1 The photos reach the browser](#h3121-the-photos-reach-the-browser)
  - [H3.12.2 Five shadcn/ui components](#h3122-five-shadcnui-components)
  - [H3.12.3 The list](#h3123-the-list)
  - [H3.12.4 The page and the editor](#h3124-the-page-and-the-editor)
  - [H3.12.5 The tests, and the errors met](#h3125-the-tests-and-the-errors-met)
  - [H3.12.6 The production build](#h3126-the-production-build)
  - [H3.12.7 Checking in the browser](#h3127-checking-in-the-browser)
- [H3.13 The plan screens, as built](#h313-the-plan-screens-as-built)
  - [H3.13.1 Plans to look at](#h3131-plans-to-look-at)
  - [H3.13.2 The tabs component](#h3132-the-tabs-component)
  - [H3.13.3 The API file and the line of an exercise](#h3133-the-api-file-and-the-line-of-an-exercise)
  - [H3.13.4 The plan page](#h3134-the-plan-page)
  - [H3.13.5 The tests, and the errors met](#h3135-the-tests-and-the-errors-met)
  - [H3.13.6 The production build](#h3136-the-production-build)
  - [H3.13.7 Checking in the browser](#h3137-checking-in-the-browser)
- [H3.14 The plan editor, as built](#h314-the-plan-editor-as-built)
  - [H3.14.1 The packages](#h3141-the-packages)
  - [H3.14.2 The dialog component](#h3142-the-dialog-component)
  - [H3.14.3 The draft first, with its tests](#h3143-the-draft-first-with-its-tests)
  - [H3.14.4 The components](#h3144-the-components)
  - [H3.14.5 Drag and drop](#h3145-drag-and-drop)
  - [H3.14.6 The tests, and the errors met](#h3146-the-tests-and-the-errors-met)
  - [H3.14.7 The production build](#h3147-the-production-build)
  - [H3.14.8 Checking in the browser](#h3148-checking-in-the-browser)
- [H3.15 Workout mode, as built](#h315-workout-mode-as-built)
  - [H3.15.1 The order of building](#h3151-the-order-of-building)
  - [H3.15.2 A route outside the frame](#h3152-a-route-outside-the-frame)
  - [H3.15.3 The browser's own APIs](#h3153-the-browsers-own-apis)
  - [H3.15.4 The errors met](#h3154-the-errors-met)
  - [H3.15.5 The timer that showed 1:31](#h3155-the-timer-that-showed-131)
  - [H3.15.6 The tests, proving they can fail, and the build](#h3156-the-tests-proving-they-can-fail-and-the-build)
  - [H3.15.7 Checking in the browser and on a phone](#h3157-checking-in-the-browser-and-on-a-phone)
  - [H3.15.8 Second pass: what was not clear on screen](#h3158-second-pass-what-was-not-clear-on-screen)
  - [H3.15.9 Third pass: exercises without kg, and margins](#h3159-third-pass-exercises-without-kg-and-margins)
  - [H3.15.10 Fourth pass: looking at the screen for real](#h31510-fourth-pass-looking-at-the-screen-for-real)
  - [H3.15.11 Fifth pass: wide on a laptop, an app on a phone](#h31511-fifth-pass-wide-on-a-laptop-an-app-on-a-phone)
  - [H3.15.12 Sixth pass: the app's margins and buttons](#h31512-sixth-pass-the-apps-margins-and-buttons)
  - [H3.15.13 Seventh pass: a button as wide as a laptop](#h31513-seventh-pass-a-button-as-wide-as-a-laptop)
  - [H3.15.14 Eighth pass: some breathing room](#h31514-eighth-pass-some-breathing-room)
  - [H3.15.15 Ninth pass: supersets with uneven sets](#h31515-ninth-pass-supersets-with-uneven-sets)
  - [H3.15.16 Tenth pass: the screen never moves by itself](#h31516-tenth-pass-the-screen-never-moves-by-itself)
- [H3.16 Home, as built](#h316-home-as-built)
  - [H3.16.1 The order of building](#h3161-the-order-of-building)
  - [H3.16.2 One hook for two pages](#h3162-one-hook-for-two-pages)
  - [H3.16.3 A workout with no plan](#h3163-a-workout-with-no-plan)
  - [H3.16.4 The errors met](#h3164-the-errors-met)
  - [H3.16.5 The tests, proving they can fail, and the build](#h3165-the-tests-proving-they-can-fail-and-the-build)
  - [H3.16.6 Checking in the browser](#h3166-checking-in-the-browser)
- [H3.17 The summary and history, as built](#h317-the-summary-and-history-as-built)
  - [H3.17.1 The order of building](#h3171-the-order-of-building)
  - [H3.17.2 A screen drawn from the phone](#h3172-a-screen-drawn-from-the-phone)
  - [H3.17.3 The errors met](#h3173-the-errors-met)
  - [H3.17.4 The tests, proving they can fail, and the build](#h3174-the-tests-proving-they-can-fail-and-the-build)
  - [H3.17.5 Checking in the browser](#h3175-checking-in-the-browser)
  - [H3.17.6 Second pass: no total volume](#h3176-second-pass-no-total-volume)
  - [H3.17.7 Third pass: the exercises folded, above Save](#h3177-third-pass-the-exercises-folded-above-save)
- [H3.18 Loose ends, as built](#h318-loose-ends-as-built)
  - [H3.18.1 Start without HTTPS: a UUID by hand](#h3181-start-without-https-a-uuid-by-hand)
  - [H3.18.2 "Last used" on each plan](#h3182-last-used-on-each-plan)
  - [H3.18.3 Finish from the banner](#h3183-finish-from-the-banner)
  - [H3.18.4 Three broken links, and checking them all](#h3184-three-broken-links-and-checking-them-all)
  - [H3.18.5 The checks](#h3185-the-checks)
- [H3.19 The logo, as built](#h319-the-logo-as-built)
- [H3.20 The stepper and the exercise menu, as built](#h320-the-stepper-and-the-exercise-menu-as-built)
  - [H3.20.1 The order of building](#h3201-the-order-of-building)
  - [H3.20.2 The panel: shadcn's Sheet](#h3202-the-panel-shadcns-sheet)
  - [H3.20.3 The files](#h3203-the-files)
  - [H3.20.4 The errors met](#h3204-the-errors-met)
  - [H3.20.5 The tests, proving they can fail](#h3205-the-tests-proving-they-can-fail)
  - [H3.20.6 Looking at it at a phone's width](#h3206-looking-at-it-at-a-phones-width)
  - [H3.20.7 Second to sixth pass: Add set and Add exercises out of the way, not out of sight](#h3207-second-to-sixth-pass-add-set-and-add-exercises-out-of-the-way-not-out-of-sight)
  - [H3.20.8 The checks](#h3208-the-checks)
- [H3.21 The workout preferences, as built](#h321-the-workout-preferences-as-built)
  - [H3.21.1 The order of building](#h3211-the-order-of-building)
  - [H3.21.2 The backend: five rules, and the fillable trap](#h3212-the-backend-five-rules-and-the-fillable-trap)
  - [H3.21.3 The frontend](#h3213-the-frontend)
  - [H3.21.4 Testing Radix Selects](#h3214-testing-radix-selects)
  - [H3.21.5 Checking it](#h3215-checking-it)
  - [H3.21.6 The checks](#h3216-the-checks)
- [H3.22 The plan editor in two steps, as built](#h322-the-plan-editor-in-two-steps-as-built)
  - [H3.22.1 The order of building](#h3221-the-order-of-building)
  - [H3.22.2 The files](#h3222-the-files)
  - [H3.22.3 The address and the history](#h3223-the-address-and-the-history)
  - [H3.22.4 The tests, and proving they can fail](#h3224-the-tests-and-proving-they-can-fail)
  - [H3.22.5 Looking at it](#h3225-looking-at-it)
  - [H3.22.6 Checking in the browser](#h3226-checking-in-the-browser)
  - [H3.22.7 The checks](#h3227-the-checks)
- [H3.23 Creating an exercise from the picker, as built](#h323-creating-an-exercise-from-the-picker-as-built)
  - [H3.23.1 The order of building](#h3231-the-order-of-building)
  - [H3.23.2 The test, and proving it can fail](#h3232-the-test-and-proving-it-can-fail)
  - [H3.23.3 Looking at it](#h3233-looking-at-it)
  - [H3.23.4 Checking in the browser](#h3234-checking-in-the-browser)
  - [H3.23.5 The checks](#h3235-the-checks)
- [H3.24 Set types, the RPE switch and the stopwatch, as built](#h324-set-types-the-rpe-switch-and-the-stopwatch-as-built)
  - [H3.24.1 The order of building](#h3241-the-order-of-building)
  - [H3.24.2 The column `show_rpe`](#h3242-the-column-show_rpe)
  - [H3.24.3 The list of set types](#h3243-the-list-of-set-types)
  - [H3.24.4 The RPE field](#h3244-the-rpe-field)
  - [H3.24.5 The stopwatch](#h3245-the-stopwatch)
  - [H3.24.6 Proving the tests can fail](#h3246-proving-the-tests-can-fail)
  - [H3.24.7 Looking at it](#h3247-looking-at-it)
  - [H3.24.8 Checking in the browser](#h3248-checking-in-the-browser)
  - [H3.24.9 The checks](#h3249-the-checks)
- [H3.25 Exercises done as fast as possible, as built](#h325-exercises-done-as-fast-as-possible-as-built)
  - [H3.25.1 The order of building](#h3251-the-order-of-building)
  - [H3.25.2 The backend: a column, a rule, and last time of each kind](#h3252-the-backend-a-column-a-rule-and-last-time-of-each-kind)
  - [H3.25.3 The plan: draft and switch](#h3253-the-plan-draft-and-switch)
  - [H3.25.4 Workout mode](#h3254-workout-mode)
  - [H3.25.5 The tests, and proving they can fail](#h3255-the-tests-and-proving-they-can-fail)
  - [H3.25.6 Looking at it](#h3256-looking-at-it)
  - [H3.25.7 Checking in the browser](#h3257-checking-in-the-browser)
  - [H3.25.8 The checks](#h3258-the-checks)
- [H3.26 Plan files, export and import, as built](#h326-plan-files-export-and-import-as-built)
  - [H3.26.1 The order of building](#h3261-the-order-of-building)
  - [H3.26.2 Export, and the arrow function that lost the exercises](#h3262-export-and-the-arrow-function-that-lost-the-exercises)
  - [H3.26.3 Import: rules shared, actions reused](#h3263-import-rules-shared-actions-reused)
  - [H3.26.4 The tests, and a test that passed for the wrong reason](#h3264-the-tests-and-a-test-that-passed-for-the-wrong-reason)
  - [H3.26.5 A round trip on the real plan](#h3265-a-round-trip-on-the-real-plan)
  - [H3.26.6 The frontend](#h3266-the-frontend)
  - [H3.26.7 Looking at it](#h3267-looking-at-it)
  - [H3.26.8 Checking in the browser](#h3268-checking-in-the-browser)
  - [H3.26.9 The checks](#h3269-the-checks)
  - [H3.26.10 Later: a window before importing](#h32610-later-a-window-before-importing)
- [H3.27 Loading signs, as built](#h327-loading-signs-as-built)
  - [H3.27.1 The order of building](#h3271-the-order-of-building)
  - [H3.27.2 The spinner, from shadcn's CLI](#h3272-the-spinner-from-shadcns-cli)
  - [H3.27.3 `pending` on Button, and the Slot that counts a `false`](#h3273-pending-on-button-and-the-slot-that-counts-a-false)
  - [H3.27.4 The search box: two moments](#h3274-the-search-box-two-moments)
  - [H3.27.5 Applying it](#h3275-applying-it)
  - [H3.27.6 The tests, and proving they can fail](#h3276-the-tests-and-proving-they-can-fail)
  - [H3.27.7 Looking at it](#h3277-looking-at-it)
  - [H3.27.8 Checking in the browser](#h3278-checking-in-the-browser)
  - [H3.27.9 The checks](#h3279-the-checks)
- [H3.28 Continue with Google, as built](#h328-continue-with-google-as-built)
  - [H3.28.1 The order of building](#h3281-the-order-of-building)
  - [H3.28.2 The proxy](#h3282-the-proxy)
  - [H3.28.3 The component](#h3283-the-component)
  - [H3.28.4 The texts](#h3284-the-texts)
  - [H3.28.5 The tests, and proving they can fail](#h3285-the-tests-and-proving-they-can-fail)
  - [H3.28.6 A "G" as big as the page](#h3286-a-g-as-big-as-the-page)
  - [H3.28.7 Second pass: sign-in on a laptop's screen](#h3287-second-pass-sign-in-on-a-laptops-screen)
  - [H3.28.8 Checking in the browser](#h3288-checking-in-the-browser)
  - [H3.28.9 The checks](#h3289-the-checks)
- [H3.29 The link to the admin panel, as built](#h329-the-link-to-the-admin-panel-as-built)
  - [H3.29.1 The order of building](#h3291-the-order-of-building)
  - [H3.29.2 The card](#h3292-the-card)
  - [H3.29.3 The tests](#h3293-the-tests)
  - [H3.29.4 Check it in the browser](#h3294-check-it-in-the-browser)
- [H3.30 The photos of an exercise, as built](#h330-the-photos-of-an-exercise-as-built)
  - [H3.30.1 The order of building](#h3301-the-order-of-building)
  - [H3.30.2 upload()](#h3302-upload)
  - [H3.30.3 The section of the editor](#h3303-the-section-of-the-editor)
  - [H3.30.4 The tests](#h3304-the-tests)
  - [H3.30.5 Check it in the browser](#h3305-check-it-in-the-browser)
- [H3.31 Compact page headers and the Filters panel](#h331-compact-page-headers-and-the-filters-panel)
  - [H3.31.1 A prop that takes JSX](#h3311-a-prop-that-takes-jsx)
  - [H3.31.2 The commands, in order](#h3312-the-commands-in-order)
  - [H3.31.3 Testing a panel](#h3313-testing-a-panel)
  - [H3.31.4 Check it in the browser](#h3314-check-it-in-the-browser)
- [H3.32 Workout mode after a real workout, as built](#h332-workout-mode-after-a-real-workout-as-built)
  - [H3.32.1 The commands, in order](#h3321-the-commands-in-order)
  - [H3.32.2 Pausing a moment](#h3322-pausing-a-moment)
  - [H3.32.3 The tests, and the errors met](#h3323-the-tests-and-the-errors-met)
  - [H3.32.4 Looking at it](#h3324-looking-at-it)
  - [H3.32.5 Checking in the browser and on a phone](#h3325-checking-in-the-browser-and-on-a-phone)
  - [H3.32.6 Second pass: a reminder, not a button](#h3326-second-pass-a-reminder-not-a-button)
  - [H3.32.7 Third pass: removing what was added by hand](#h3327-third-pass-removing-what-was-added-by-hand)
  - [H3.32.8 Fourth pass: deleting a workout in progress](#h3328-fourth-pass-deleting-a-workout-in-progress)
  - [H3.32.9 Fifth pass: Delete inside the dialog](#h3329-fifth-pass-delete-inside-the-dialog)

---

## H3.1 Before you start

**The frontend runs on the computer, not in Docker** ([S1.7](../start/S1-setup.md#s17-creating-the-react-frontend)). Two terminals, from the repository root:

```sh
make up       # the backend, in Docker (once; it stays up)
make dev      # Vite, the React dev server, at http://localhost:5673; Ctrl+C stops it
```

`make start` does both in one go. Vite reloads the page by itself at every save. Requests to `/api` and `/sanctum` are forwarded to Laravel on port 8500 by Vite's *proxy* (`frontend/vite.config.ts`), so the React code always writes `/api/…`, with no host.

**Where each piece goes**, all under `frontend/src/` ([C1.2](../concepts/C1-frontend.md#c12-folder-structure)):

| Piece | Where | Example |
|---|---|---|
| Page | `pages/` | `pages/MusclesPage.tsx` |
| Requests to the API, and their hooks | `api/` | `api/muscles.ts` |
| Components of one area | `components/<area>/` | `components/muscles/RenameMuscleForm.tsx` |
| Components used everywhere | `components/` | `PageHeader`, `EmptyState`, `FormField` |
| Texts, one file per language | `i18n/locales/` | `en.json`, `it.json`, `es.json`, `de.json` |
| The list of URLs | `router.tsx` | `{ path: 'muscles', element: <MusclesPage /> }` |
| Test | next to the file it tests | `pages/MusclesPage.test.tsx` |

**Commands,** from the root or with `npm run …` inside `frontend/`:

| What | From the root | Inside `frontend/` |
|---|---|---|
| Tests, once | `make fe-test` | `npm test` |
| Tests, again at every save | | `npm run test:watch` |
| One test file | | `npx vitest run src/pages/MusclesPage.test.tsx` |
| TypeScript check | `make typecheck` | `npm run typecheck` |
| Style check, and fixes | `make lint`, `make fix` | `npm run lint`, `npm run lint -- --fix` |

---

## H3.2 A new page

### H3.2.1 The page file

`src/pages/MusclesPage.tsx`. A page is a function that returns what to draw, and every page starts with a `PageHeader`:

```tsx
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'

/** The list of muscles (route `/muscles`). */
export function MusclesPage() {
  // t() returns a text in the current language, from the locale files
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t('pages.muscles.title')} description={t('pages.muscles.description')} />
      {/* the content comes in H3.3 */}
    </>
  )
}
```

- **The function's name** is the file's name, in PascalCase, ending in `Page`.
- **`export`** makes it importable from other files.
- **`@/`** means `src/`, so imports do not need `../../`.
- **No text is written in the component:** every text is a key, looked up with `t()` ([H3.6](#h36-translations)).
- **No `eyebrow` with the section's name** ("LIBRARY"): the navigation already says it. Pass one only when it adds something, such as a date ([D1.5](../design/D1-ui.md#d15-design-system) "Page header").
- **A main action** (a New button) goes in the header's `actions` prop, at the right of the title: `actions={<Button asChild size="xl"><Link to="/muscles/new">…</Link></Button>}`. `ExercisesPage` and `PlansPage` are the examples ([H3.31](#h331-compact-page-headers-and-the-filters-panel)).

### H3.2.2 Its texts

In **each of the four** files `src/i18n/locales/{en,it,es,de}.json`, under `pages`:

```json
"muscles": {
  "title": "Muscles",
  "description": "The muscles the exercises work."
}
```

```json
"muscles": {
  "title": "Muscoli",
  "description": "I muscoli che gli esercizi allenano."
}
```

…and the same in Spanish and German. A key missing in one language makes a test fail, and a misspelt key stops the TypeScript check ([H3.6](#h36-translations)).

### H3.2.3 Its address

In `src/router.tsx`, import the page and add a route among the children of `AppLayout`, before `'*'` (the "page not found" route, which catches every address not listed above it):

```tsx
import { MusclesPage } from '@/pages/MusclesPage'

// …
children: [
  { index: true, element: <HomePage /> },
  // …
  { path: 'profile', element: <ProfilePage /> },
  { path: 'muscles', element: <MusclesPage /> },
  { path: '*', element: <NotFoundPage /> },
],
```

**Where it is placed decides what it gets** ([C1.5](../concepts/C1-frontend.md#c15-routing)):
- inside `RequireAuth`, the page is only for users who are signed in;
- inside `AppLayout`, it has the menus around it;
- next to `/login`, inside `RequireGuest` and `AuthLayout`, it would be for visitors.

### H3.2.4 Open it

With `make dev` running, open http://localhost:5673/muscles. Signed out, you are sent to `/login` and brought back after signing in.

**Reaching it from the app.** The five main sections in the menus are fixed by the design ([D1.4](../design/D1-ui.md#d14-screens)), so a new page is usually opened from a link on another page:

```tsx
import { Link } from 'react-router'

// A link that changes page without reloading it; its text is a new key (H3.6)
<Link to="/muscles">{t('exercises.seeMuscles')}</Link>
```

A new main section would be a design change: an entry in `src/components/layout/nav-items.ts` updates both menus ([C1.9](../concepts/C1-frontend.md#c19-recipes)).

---

## H3.3 Reading data from the API

How server data works in general: [C1.6](../concepts/C1-frontend.md#c16-server-data).

### H3.3.1 The API file

`src/api/muscles.ts` holds everything about muscles on the server side: the type of the data, the cache keys, and the hooks that pages call.

```ts
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { request } from '@/lib/http'

/** A muscle as GET /api/muscles returns it: the fields of MuscleResource (H2.2.2). */
export interface Muscle {
  id: number
  slug: string
  /** In the language of the request. */
  name: string
}

/** The cache keys of the muscles. */
export const muscleKeys = {
  all: ['muscles'] as const,
}

/** The list of muscles, in the current language. */
export function useMuscles() {
  const { i18n } = useTranslation()
  return useQuery({
    // The key names this data in the cache. The language is part of it:
    // the names change with it, so another language is another list
    queryKey: [...muscleKeys.all, i18n.resolvedLanguage],
    // How to fetch it. Laravel wraps the list in "data" (H2.2.5), so it is unwrapped here
    queryFn: ({ signal }) => request<{ data: Muscle[] }>('/api/muscles', { signal }).then(body => body.data),
  })
}
```

- **`request()`** (`src/lib/http.ts`) sends the request with everything it needs: the session cookie, the CSRF header, the language. If the status is not 2xx, it throws an `ApiError`.
- **The interface must match the Resource** of the backend. TypeScript cannot check the server, so a field renamed in PHP must be renamed here too.
- **A key without the language** would keep showing the old names after switching language, until the page is reloaded.

### H3.3.2 Using it in the page

A request is in one of three states, and the page draws each:

```tsx
import { useMuscles } from '@/api/muscles'
import { FormBanner } from '@/components/FormBanner'
import { Skeleton } from '@/components/ui/skeleton'

export function MusclesPage() {
  const { t } = useTranslation()
  const muscles = useMuscles()

  return (
    <>
      <PageHeader … />

      {/* Loading: a grey block where the list will be */}
      {muscles.isPending && <Skeleton className="h-40 rounded-3xl" />}

      {/* The request failed */}
      {muscles.isError && <FormBanner variant="error">{t('muscles.loadError')}</FormBanner>}

      {/* The list: one <li> per muscle; key tells React which row is which */}
      {muscles.data && (
        <ul className="divide-y divide-border rounded-3xl border bg-card/60 px-6">
          {muscles.data.map(muscle => (
            <li key={muscle.id} className="py-4">
              <p className="font-semibold">{muscle.name}</p>
              <p className="text-sm text-muted-foreground">{muscle.slug}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
```

- **`{condition && <X />}`** draws `X` only when the condition is true ([C1.4](../concepts/C1-frontend.md#c14-react-from-scratch)).
- **The data is cached.** Leaving the page and coming back shows the list at once, and it is refreshed in the background.
- **An empty list** deserves an `EmptyState`, as on the other pages ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)).

---

## H3.4 A form that saves

How forms work here, in depth: [C1.13.3](../concepts/C1-frontend.md#c1133-a-form-step-by-step). The example is a one-field form to rename a muscle, shown to admins only.

### H3.4.1 The mutation

A request that **changes** data is a *mutation*. It goes in the same API file:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

/** Renames a muscle (admins only), then reloads the list. */
export function useRenameMuscle() {
  const queryClient = useQueryClient()
  return useMutation({
    // What to send. Called with mutate({ id, name })
    mutationFn: ({ id, name }: { id: number, name: string }) =>
      request<{ data: Muscle }>(`/api/muscles/${id}`, { method: 'PATCH', body: { name } }),
    // After a success, the cached list is out of date: every key that starts
    // with ['muscles'], in any language, is fetched again
    onSuccess: () => queryClient.invalidateQueries({ queryKey: muscleKeys.all }),
  })
}
```

### H3.4.2 The form

`src/components/muscles/RenameMuscleForm.tsx`. It has the same four parts as the sign-in forms:
- the rules, with zod;
- the form, with react-hook-form;
- one `FormField` per field;
- the server's errors.

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import type { TFunction } from 'i18next'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { useRenameMuscle, type Muscle } from '@/api/muscles'
import { FormBanner } from '@/components/FormBanner'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { showRequestError } from '@/lib/form'

/** The rules, checked in the browser before sending; messages in the current language. */
function renameSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, { error: t('muscles.nameRequired') }),
  })
}

/** The form's values, worked out from the rules: { name: string }. */
type RenameValues = z.infer<ReturnType<typeof renameSchema>>

/** Props of RenameMuscleForm. */
interface RenameMuscleFormProps {
  /** The muscle to rename. */
  muscle: Muscle
}

/** A one-field form that renames a muscle. */
export function RenameMuscleForm({ muscle }: RenameMuscleFormProps) {
  const { t } = useTranslation()
  const rename = useRenameMuscle()
  // The form's state: values, errors, and whether it was touched
  const form = useForm<RenameValues>({
    resolver: zodResolver(renameSchema(t)),
    defaultValues: { name: muscle.name },
  })
  const { errors } = form.formState

  /** Runs only if the rules pass. */
  function onSubmit(values: RenameValues) {
    rename.mutate({ id: muscle.id, name: values.name }, {
      // A 422 from Laravel: its message goes under the field. Anything else goes in the banner
      onError: error => showRequestError(error, form.setError, ['name'], t),
    })
  }

  return (
    // noValidate: the browser's own bubbles are off, zod's messages are shown instead
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-3 flex flex-col gap-3">
      {errors.root?.message && <FormBanner variant="error">{errors.root.message}</FormBanner>}
      {/* register() connects the input to the form: value, changes, name */}
      <FormField label={t('muscles.newName')} error={errors.name?.message} {...form.register('name')} />
      {/* pending: disabled, with a spinner, while the request runs (C1.20) */}
      <Button type="submit" pending={rename.isPending}>{t('muscles.save')}</Button>
    </form>
  )
}
```

**In the page,** for admins only. `useCurrentUser()` gives the signed-in user ([C1.13.1](../concepts/C1-frontend.md#c1131-the-one-idea-who-is-signed-in-is-server-data)):

```tsx
const { data: user } = useCurrentUser()
// …inside each <li>:
{user?.is_admin && <RenameMuscleForm muscle={muscle} />}
```

**Hiding the form is not the protection.** The server refuses non-admins anyway ([H2.3.3](H2-backend.md#h233-who-may-do-it-the-policy)). The interface only avoids showing a button that would fail.

---

## H3.5 Testing a page

The tests run in Node, without a browser and without the backend. `fakeApi()` (`src/test/auth-helpers.tsx`) replaces `fetch` with a fake server, which answers what each test says ([C1.13.6](../concepts/C1-frontend.md#c1136-testing-a-screen-with-the-api)).

`src/pages/MusclesPage.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RequireAuth } from '@/routes/RequireAuth'
import { fakeApi, renderRoutes, sentBody, signedInAs, testUser } from '@/test/auth-helpers'
import { MusclesPage } from './MusclesPage'

/** The page behind the sign-in guard, as in the app. */
const routes = [{ element: <RequireAuth />, children: [{ path: 'muscles', element: <MusclesPage /> }] }]

/** What the fake server answers for the list. */
const list = { status: 200, body: { data: [{ id: 1, slug: 'chest', name: 'Chest' }] } }

describe('MusclesPage', () => {
  it('lists the muscles', async () => {
    // "METHOD path" → the answer; GET /api/user is who is signed in
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/muscles': list })
    renderRoutes(routes, '/muscles')

    // findBy… waits for the text to appear; getBy… and queryBy… look now
    expect(await screen.findByText('Chest')).toBeInTheDocument()
    // Not an admin: no form
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })

  it('lets an admin rename a muscle', async () => {
    const fake = fakeApi({
      'GET /api/user': signedInAs({ ...testUser, is_admin: true }),
      'GET /api/muscles': list,
      'PATCH /api/muscles/1': { status: 200, body: { data: { id: 1, slug: 'chest', name: 'Pecs' } } },
    })
    renderRoutes(routes, '/muscles')

    // userEvent types and clicks as a person would
    const field = await screen.findByLabelText('New name')
    await userEvent.clear(field)
    await userEvent.type(field, 'Pecs')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    // What reached the fake server
    await vi.waitFor(() => expect(sentBody(fake, '/api/muscles/1')).toEqual({ name: 'Pecs' }))
  })

  it('stops an empty name before sending it', async () => {
    const fake = fakeApi({ 'GET /api/user': signedInAs({ ...testUser, is_admin: true }), 'GET /api/muscles': list })
    renderRoutes(routes, '/muscles')

    await userEvent.clear(await screen.findByLabelText('New name'))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a name.')
    expect(fake.mock.calls.some(([path]) => path === '/api/muscles/1')).toBe(false)
  })

  it('shows the server\'s message under the field', async () => {
    fakeApi({
      'GET /api/user': signedInAs({ ...testUser, is_admin: true }),
      'GET /api/muscles': list,
      'PATCH /api/muscles/1': { status: 422, body: { message: 'Invalid', errors: { name: ['The name field must not be greater than 50 characters.'] } } },
    })
    renderRoutes(routes, '/muscles')

    await userEvent.type(await screen.findByLabelText('New name'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('must not be greater than 50 characters')
  })
})
```

```sh
cd frontend && npx vitest run src/pages/MusclesPage.test.tsx
```

```
Test Files  1 passed (1)
     Tests  4 passed (4)
```

- **Find elements as a user would:** by their role and name (`getByRole('button', { name: 'Save' })`) or their label (`getByLabelText`). A test written this way also checks that the page is accessible.
- **Tests run in English,** the language of `src/test/setup.ts`, so they look for the English texts.
- **`vi` must be imported** from `vitest`, like `describe` and `it`. Without it, the first run gave `ReferenceError: vi is not defined`.

---

## H3.6 Translations

How they work: [C1.7](../concepts/C1-frontend.md#c17-translations).

**Adding a text:**
1. Add the key to `en.json`, in the group of its page or area.
2. Add the same key to `it.json`, `es.json` and `de.json`.
3. In the component, write `t('group.key')`.

**A misspelt key stops the TypeScript check.** The keys are typed from `en.json` (`src/i18n/i18next.d.ts`), so `t('muscles.sav')` gives, at the end of a long message:

```sh
npm run typecheck
```

```
src/components/muscles/RenameMuscleForm.tsx(48,60): error TS2345: Argument of type '["muscles.sav"]' is not assignable to parameter of type …
      Type '"muscles.sav"' is not assignable to type '"nav.label" | "nav.progress" | … | ("nav.label" | … 115 more … | TemplateStringsArray)[]'. Did you mean '"muscles.save"'?
```

Read the end first: *Did you mean*. VS Code underlines the same error in red as you type.

**A key missing in one language fails a test.** `src/i18n/locales.test.ts` checks that every language has exactly the English keys. With `muscles.save` deleted from `it.json`:

```
FAIL  src/i18n/locales.test.ts > translation files > it > has exactly the English keys
AssertionError: expected [ 'app.name', 'app.tagline', …(113) ] to deeply equal [ 'app.name', 'app.tagline', …(114) ]
- Expected
+ Received
    "muscles.nameRequired",
    "muscles.newName",
-   "muscles.save",
    "nav.exercises",
```

The `-` line is the key that `it.json` lacks.

**Values inside a text:** `"languageHint": "Numbers like {{weight}}"` in the file, then `t('preferences.languageHint', { weight: '82,5 kg' })` in the code. The same test checks that every language keeps the same `{{…}}`.

---

## H3.7 Adding an npm package

Inside `frontend/`:

```sh
npm install package-name            # for the app
npm install -D package-name         # only for development: tests, types, tools
```

**What changes**, here when the form libraries were added:

```diff
   "dependencies": {
     "@fontsource-variable/inter": "^5.3.0",
+    "@hookform/resolvers": "^7.0.3",
     …
+    "react-hook-form": "^7.91.0",
     …
-    "tw-animate-css": "^1.4.0"
+    "tw-animate-css": "^1.4.0",
+    "zod": "^4.6.7"
   },
```

- **`package.json`** lists what the app needs.
- **`package-lock.json`** records the exact versions. Both are committed.
- **`node_modules/`** holds the code. It is not in Git.

**Other computers** get the two files with `git pull`, but not `node_modules`. Until they run `npm install`, Vite stops at the first import:

```
[plugin:vite:import-analysis] Failed to resolve import "@hookform/resolvers/zod" from "src/pages/ResetPasswordPage.tsx". Does the file exist?
```

After a `git pull` that changes `package-lock.json`, run `npm install` in `frontend/` (`make fe-install`), then restart `make dev`. Vite prepares the packages when it starts.

**Never** `npm audit fix --force` (it can install incompatible major versions) and never `sudo npm` ([S1.10](../start/S1-setup.md#s110-troubleshooting)). `make audit` lists known vulnerabilities without changing anything.

### H3.7.1 A vulnerable package deep in the tree: overrides

`chore/minimatch-override`. GitHub's Dependabot ([P1.5.2](../project/P1-conventions.md#p152-the-account-and-the-repository-on-github)) reported a failed run, "Dependabot encountered an error performing the update". With no `.github/dependabot.yml` in the repository, it was a **security update**: Dependabot had found a vulnerable package and tried to open a pull request with the fix, and could not find one to propose.

**1. What is vulnerable, and who brings it.** From `frontend/`, and the same for the backend from the root:

```sh
npm audit                                         # the report, by package
npm ls minimatch                                  # who depends on it
docker compose exec -T backend composer audit     # the backend's packages
```

```
15 vulnerabilities (2 low, 13 moderate)

+-- eslint@10.14.0
| `-- minimatch@10.2.6
+-- shadcn@4.23.0
| `-- ts-morph@26.0.0
|   `-- @ts-morph/common@0.27.0
|     `-- minimatch@10.2.6 deduped
`-- typescript-eslint@8.72.1
  `-- @typescript-eslint/typescript-estree@8.72.1
    `-- minimatch@10.2.6 deduped

No security vulnerability advisories found.
```

Fifteen packages, but **two advisories**: npm counts every package on the way to a vulnerable one. `npm audit --json` lists each with `via`: an object there is the advisory itself, a name is a package that only depends on it. Here `minimatch` 10.2.6 (moderate, a denial of service through crafted patterns, GHSA-g3hv-75wg-m249, fixed in 11.0.1) and `deepmerge` 4.3.1 (low, prototype poisoning, GHSA-gcqx-w48m-w2h4).

**2. Why Dependabot could not fix them.** The fix of `minimatch` is a new major version, 11, and its three parents all ask for `^10`; no version of them accepts 11. `deepmerge` has no fixed version at all: 4.3.1 is the latest, from 2023. `npm view` says both:

```sh
npm view minimatch dist-tags.latest    # 11.0.8
npm view deepmerge dist-tags.latest    # 4.3.1, the vulnerable one
```

npm's own advice, `npm audit fix --force`, would have **gone back**: `eslint` 9, `shadcn` 1, major versions older than the project's.

**3. How much it matters.** `node -e "…"` on `package.json` showed `eslint` and `typescript-eslint` in `devDependencies`; `shadcn` is in `dependencies`, but the app imports from it only a stylesheet, `@import "shadcn/tailwind.css"` in `src/index.css`. Its JavaScript (`ts-morph`, `deepmerge`) is the command that adds components, and never reaches the browser. Every vulnerable package runs only on the developer's computer.

**4. The fix: `overrides`.** A field of `package.json` that forces a version of a package anywhere in the tree, whatever its parents ask:

```json
"overrides": {
  "minimatch": "^11.0.8"
}
```

```sh
npm install
npm ls minimatch
npm audit
```

```
+-- eslint@10.14.0
| +-- @eslint/config-array@0.23.5
| | `-- minimatch@11.0.8 deduped
| `-- minimatch@11.0.8
+-- shadcn@4.23.0
| `-- ts-morph@26.0.0
|   `-- @ts-morph/common@0.27.0
|     `-- minimatch@11.0.8 deduped
`-- typescript-eslint@8.72.1
  `-- @typescript-eslint/typescript-estree@8.72.1
    `-- minimatch@11.0.8 deduped

3 low severity vulnerabilities
```

`git diff package-lock.json` is worth reading before going on: `minimatch` from 10.2.6 to 11.0.8, one new package it brings (`@isaacs/nonrecursive-glob-match`, by the same author), and its need of Node raised from `18 || 20 || >=22` to `20 || >=22`, which the project's Node 24 meets. Nothing else moved.

The parents now get a version they did not ask for: **an override is a promise that it still works**, and has to be checked. JSON takes no comments, so the reason is written in a field named `"//"`, which npm ignores, beside the override.

**5. Checking that it still works.** The usual checks, then the two programs that use `minimatch`, on what they use it for:

```sh
npm run lint && npm run typecheck && npx vitest run && npm run build
```

```
 Test Files  32 passed (32)
      Tests  291 passed (291)
✓ built in 347ms
```

- **ESLint picks its files with `minimatch`** (the `files` and `ignores` patterns of `eslint.config.js`). A broken `minimatch` could make it lint nothing and report nothing, which reads as a pass. So: `npx eslint . --format json` piped into a few lines of Node that count the files by folder said `files linted: 184`, `in dist: 0` (ignored, though `dist/` existed after the build), `in src/components/ui: 19`, whose own rule (`react-refresh/only-export-components` off) still applied, or the lint would have failed on `buttonVariants`. And a file written to fail, `const unused = 1`, failed: `'unused' is assigned a value but never used`. Then it was deleted.
- **shadcn reads the project with `ts-morph`:** `npx shadcn add badge --dry-run` answered with the file it would overwrite, `src\components\ui\badge.tsx`, and wrote nothing (`git status` showed only `package.json` and `package-lock.json`).

**6. The rest, on GitHub.** `deepmerge` has no fix: its alert is closed by hand, **Security → Dependabot → the alert → Dismiss alert → Risk is tolerable to this project**, with a note such as "dev-only: shadcn's CLI, not bundled; no patched version". The `minimatch` alert closes by itself once the branch is on `main` and GitHub reads the new `package-lock.json`.

**7. Removing the override later.** It stays only until `eslint`, `typescript-eslint` and `ts-morph` ask for `minimatch` 11 themselves ([OPS-5](../project/backlog.md#ops-5-drop-the-minimatch-override)). To check, remove the `overrides` and `"//"` fields, `npm install`, `npm ls minimatch`: no 10.x left means it can go.

---

## H3.8 Checking in the browser

Open the developer tools: `F12`, or `Cmd+Option+I` on the Mac.

| Tab or tool | What it shows | Useful for |
|---|---|---|
| **Network** | Every request: URL, status, what was sent (*Payload*), what came back (*Response*) | The page shows nothing: is it a 401, a 422, a 500? Filter by *Fetch/XHR* to see only the API |
| **Console** | Errors and warnings from React | A red error stops the page; React's warnings, such as a missing `key`, appear here |
| **Elements** | The HTML drawn, and the CSS of each element | Why something is placed or coloured as it is |
| **Application → Cookies** | `atleoplan-session` and `XSRF-TOKEN` | Signing-in problems ([C2.7.1](../concepts/C2-backend.md#c271-how-a-session-works)) |
| **Device toolbar** (`Cmd+Shift+M`) | The page at a phone's or a tablet's width | Every screen is designed for the phone first ([D1.7](../design/D1-ui.md#d17-responsive-layout-and-accessibility)); how to use it: [H3.8.1](#h381-phone-tablet-and-desktop-widths) |
| **React Developer Tools** (a browser extension) | The components, with their props and state | What a component received |

**A 500 in the Network tab is a backend error:** its detail is in `backend/storage/logs/laravel.log` ([H2.9](H2-backend.md#h29-finding-out-what-is-going-on)).

**Check every screen:**
- in dark and light theme (Profile);
- in at least two languages, because Italian and German texts are longer than English ones;
- at the three widths of [H3.8.1](#h381-phone-tablet-and-desktop-widths): phone, tablet, desktop.

### H3.8.1 Phone, tablet and desktop widths

The layout depends only on the page's width. The app has three, set in [D1.7](../design/D1-ui.md#d17-responsive-layout-and-accessibility); in the code they are Tailwind's `sm:` (from 640 px) and `lg:` (from 1024 px) prefixes ([C1.8](../concepts/C1-frontend.md#c18-styles-and-theme)).

| Width | Called | What changes in the app | A device to try it with |
|---|---|---|---|
| under 640 px | phone | Tab bar at the bottom, one column; in the exercise library, the filters stacked and only the search box fixed | iPhone SE (375 px), iPhone 14 Pro Max (430 px) |
| 640 to 1024 px | tablet | Sidebar with icons only; the filters in one row, fixed with the search box | iPad Air (820 px) |
| over 1024 px | desktop | Sidebar with labels | the browser window itself |

**In Chrome or Edge** (the steps used in this project):

1. Open the developer tools: `Cmd+Option+I` on the Mac, `F12` or `Ctrl+Shift+I` on Windows.
2. Switch on the **device toolbar**: `Cmd+Shift+M` (Windows: `Ctrl+Shift+M`), or the phone-and-tablet icon at the top left of the tools. A bar appears above the page.
3. Pick a size in the bar's first menu:
   - **Dimensions: Responsive**: any width. Type it in the two boxes (`390` × `844`), or drag the handles at the sides of the page.
   - **A device** from the list: *iPhone SE*, *iPhone 14 Pro Max*, *iPad Air*, *iPad Pro* (1024 px, right on the edge). *Edit…* at the bottom of the list adds more.
   - The **rotate** icon next to the boxes turns it to landscape.
   - The **zoom** menu (*100%*, *75%*…) shrinks the view when it does not fit on your screen. It changes only how big you see it, not the width the app gets.
4. **Jump to a threshold:** the bar's `⋮` menu → *Show media queries*. Coloured stripes appear above the page, one per width the CSS reacts to (640, 1024…); clicking one sets the page to exactly that width. The quickest way to see where a layout changes.
5. **Back to desktop:** `Cmd+Shift+M` again; the page is as wide as the window.

Two things the device toolbar also does when a phone is picked: the pointer becomes a circle that acts as a finger, and there is no hover, as on a real phone. A layout that looks wrong only here is often one that relies on hovering.

**Without the device toolbar:** drag the edge of the browser window. While you drag, with the developer tools open, Chrome shows the page's size at its top right (`720 × 900`), so you know which of the three widths you are in. A window does not shrink to a phone's width, so for phones use the toolbar.

**In the other browsers:**

| Browser | How |
|---|---|
| Safari | Once: Settings → Advanced → *Show features for web developers*. Then Develop → *Enter Responsive Design Mode* (`Cmd+Option+R`) |
| Firefox | *Responsive Design Mode*: `Cmd+Option+M` (Windows: `Ctrl+Shift+M`) |

**A check to try it on:** `/exercises` ([H3.12.7](#h3127-checking-in-the-browser)). With *iPhone SE*, scroll the list: only the search box stays at the top. With *iPad Air*: the search box and the filters, in one row. Leave the device toolbar: the same, with the sidebar's labels.

A real phone is a different matter: it must reach the computer's Vite server. For an Android phone, a USB cable is enough: [H3.8.2](#h382-a-real-android-phone-over-usb).

### H3.8.2 A real Android phone over USB

The device toolbar shows the widths, but not what only a real phone does: the screen kept on during a workout (Wake Lock), the vibration at the end of the rest, the beep with the phone in a pocket, the notch, a real finger on a real keyboard. For those, the app has to run on the phone.

**The idea.** The development app answers only at `localhost:5673`, on the computer. **adb** (Android Debug Bridge, Google's tool for talking to an Android phone over USB) can **forward a port** the other way round: `adb reverse tcp:5673 tcp:5673` makes the phone's own `localhost:5673` lead down the cable to the computer's Vite, which forwards `/api` to Laravel as usual ([S1.4](../start/S1-setup.md#s14-ports)). For the phone it is `localhost`, so:

- **nothing changes in the cookie or Sanctum settings**: Sanctum already treats `localhost:5673` as its own app, and the session cookie works as on the computer ([C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum));
- the page is a **secure context**, as on the computer: the browser APIs held back on plain http (Wake Lock, `crypto.randomUUID()`, [H3.18.1](#h3181-start-without-https-a-uuid-by-hand)) work, with no certificate;
- Vite's live reload goes down the same cable: a saved file updates on the phone too.

The other ways (Vite on the Wi-Fi at `http://<the computer's IP>:5673`, with or without a local HTTPS certificate) were weighed in the backlog as OPS-4: without HTTPS the phone would not keep the screen on, and with it the cookie settings would have to change. They remain the way for an iPhone.

**Chrome alone was tried first, and did not do it.** Chrome on the computer has the same forwarding built in (`chrome://inspect/#devices` → *Port forwarding…*), with nothing to install. On Windows, with a Pixel 10a, the phone never appeared there, and it never asked *Allow USB debugging?*, the question that authorizes a computer, even after changing the USB mode, revoking the authorizations and switching USB debugging off and on. Windows saw the phone and its driver fine (the PowerShell check in the table below), and the first `adb devices` made the question appear at once. Hence adb.

**Once, on the phone** (a Pixel, Android 16; other phones are similar):

1. **Turn on developer options:** Settings → *About phone* → tap *Build number* seven times, then the phone's PIN. A message says *You are now a developer!*
2. **Turn on USB debugging:** Settings → *System* → *Developer options* → *USB debugging*, on; confirm with *OK*.

**Once, on the computer: adb.** It comes in Google's *platform-tools*, a zip with no installer. On the Mac, `brew install android-platform-tools` puts it on the PATH (not yet tried on this project). On Windows, from Git Bash:

```sh
curl -L -o ~/platform-tools.zip https://dl.google.com/android/repository/platform-tools-latest-windows.zip
powershell -command "Expand-Archive ~/platform-tools.zip -DestinationPath $HOME"
```

This makes `C:\Users\<you>\platform-tools\adb.exe`, where `make phone` looks for it when `adb` is not on the PATH. Two traps met:

- **`winget install Google.PlatformTools` failed:** its recipe points at a versioned file Google had removed: `Download request status is not success. 0x80190194 : Non trovato (404).` The `-latest-` link above is the one Google keeps current.
- **The commands above are for Git Bash.** In PowerShell, `curl` is another command (an alias of `Invoke-WebRequest`) that refuses `-L`, and nothing is downloaded.

Downloaded from Google, `adb.exe` is signed by Google LLC: in PowerShell, `Get-AuthenticodeSignature $HOME\platform-tools\adb.exe` answers `Status : Valid`.

**The first time, the authorization.** With the phone plugged in (a USB-C cable that carries data) and **unlocked**:

```sh
~/platform-tools/adb.exe devices -l
```

```
* daemon not running; starting now at tcp:5037
* daemon started successfully
List of devices attached
5B291JEA307657         unauthorized transport_id:1
```

The first time, adb starts its background server (the *daemon*). `unauthorized` means the phone has not yet accepted this computer, and the question is now on its screen: *Allow USB debugging?*, with the computer's key fingerprint. Tick *Always allow from this computer*, tap *Allow*, and ask again:

```
List of devices attached
5B291JEA307657         device product:stallion model:Pixel_10a device:stallion transport_id:2
```

**Each time:**

1. **The stack running:** `make start` (or `make up` and `make dev`).
2. **The phone plugged in**, then, from the repository's root:

   ```sh
   make phone
   ```

   ```
   List of devices attached
   5B291JEA307657         device product:stallion model:Pixel_10a device:stallion transport_id:2

   ✔ On the phone, in Chrome: http://localhost:5673 (until the cable is unplugged)
   ```

   The target runs `adb devices -l` (is the phone there, and authorized?) and `adb reverse tcp:5673 tcp:5673`. By hand, `adb reverse --list` shows the rule: `UsbFfs tcp:5673 tcp:5673`.
3. **On the phone**, open Chrome at `http://localhost:5673`. Sign in as on the computer: the phone has its own session and its own `localStorage`.

The rule lasts until the cable is unplugged or adb is restarted; then `make phone` again.

**Checking the way through without looking at the phone.** `adb shell` runs a command on the phone; Android's `toybox nc` sends a request by hand, so the phone itself asks its own `localhost:5673`:

```sh
~/platform-tools/adb.exe shell "(printf 'GET /sanctum/csrf-cookie HTTP/1.1\r\nHost: localhost:5673\r\nConnection: close\r\n\r\n'; sleep 8) | toybox nc 127.0.0.1 5673 | head -8"
```

```
HTTP/1.1 204 No Content
Vary: Origin
access-control-allow-origin: *
cache-control: no-cache, private
date: Tue, 10 Nov 2026 08:26:08 GMT
server: FrankenPHP Caddy
set-cookie: XSRF-TOKEN=eyJpdiI6…
set-cookie: atleoplan-session=eyJpdiI6…
```

The whole way works: phone, cable, Vite, Laravel, and back with the two cookies of signing in. The `sleep` keeps the connection open while Laravel answers: with `sleep 3`, nothing came back. `GET /` the same way answers `HTTP/1.1 200 OK` with `Content-Type: text/html`: the React app.

**The phone's page in the computer's DevTools:** `chrome://inspect/#devices` lists the tabs open in the phone's Chrome; **inspect** opens DevTools for one, with the tabs of [H3.8](#h38-checking-in-the-browser) about the phone's page and a live picture of its screen. On Windows the phone did not appear there (see above); whether it does once adb has authorized it is still to be tried.

**What to check there, for workout mode** ([H3.15.7](#h3157-checking-in-the-browser-and-on-a-phone)):

- **The screen kept on:** set the phone's Settings → *Display* → *Screen timeout* to 15 seconds, start a workout and leave the phone alone for a minute: the screen stays on. Close workout mode (✕): it turns off after 15 seconds. Put the timeout back afterwards.
- **The vibration and the beep:** tick a set with a short rest; at its end the phone vibrates and beeps (sound on, the volume up, vibration on in Settings → *Sound and vibration*).
- **The notch and the bars:** nothing hidden under the camera or the gesture bar at the bottom.

**When it does not work:**

| What you see | Why, and what to do |
|---|---|
| `adb devices` lists nothing | The cable only charges (try another); or USB debugging is off; or, on Windows, the phone has no driver for debugging. To see what Windows found, in PowerShell: `Get-PnpDevice -PresentOnly \| Where-Object InstanceId -match 'VID_18D1'` (18D1 is Google's USB id). A Pixel ready for debugging shows an `ADB Interface` with Status `OK` next to the `Pixel 10a` line. With only the `Pixel 10a` line, USB debugging is off or the driver is missing: install the *Google USB Driver* (developer.android.com → *Get the Google USB Driver*) and pick it in Device Manager → the phone → *Update driver* |
| `unauthorized`, and no question on the phone | The phone is locked: unlock it and run `adb devices` again. Still nothing: Developer options → *Revoke USB debugging authorizations*, unplug and plug again |
| `make phone`: `command not found`, or *No such file or directory* | adb is neither on the PATH nor in `~/platform-tools`: see *Once, on the computer* above |
| The phone says *This site can't be reached* at `localhost:5673`, though the computer opens it | Met on Windows: Vite was listening on `::1`, IPv6's "this computer", and not on `127.0.0.1`, IPv4's, where the forwarding connects. `netstat -ano \| grep 5673` printed only `TCP [::1]:5673 ... LISTENING`; `curl http://127.0.0.1:5673/` failed while `curl "http://[::1]:5673/"` answered 200. The computer's own browser hid it, since it tries both. The fix is `server.host: '127.0.0.1'` in `frontend/vite.config.ts`; restart `make dev` after pulling it. The line then reads `TCP 127.0.0.1:5673 ... LISTENING` |
| The phone says *This site can't be reached* at `localhost:5673` | The cable was unplugged since `make phone` (run it again), or the stack is not running: check http://localhost:5673 on the computer first |
| The page opens, the sign-in fails | The same as on the computer: [S1.10](../start/S1-setup.md#s110-troubleshooting). The address must be exactly `localhost:5673`; `127.0.0.1:5673` is not the address Sanctum knows |

---

## H3.9 A shadcn/ui component

shadcn/ui is not a package: its command copies the component's source into `src/components/ui/`, where it becomes our code ([C1.8](../concepts/C1-frontend.md#c18-styles-and-theme)). The list is at https://ui.shadcn.com/docs/components. Inside `frontend/`:

```sh
npx shadcn add badge --yes
```

```
✔ Checking registry.
✔ Created 1 file:
  - src/components/ui/badge.tsx
```

**The copied file follows shadcn's style, not ours:**

```sh
npx eslint src/components/ui/badge.tsx
```

```
✖ 17 problems (17 errors, 0 warnings)
  17 errors and 0 warnings potentially fixable with the `--fix` option.
```

`make fix` corrects all of them: quotes and semicolons. Then add the comments of [P1.2](../project/P1-conventions.md#p12-code), as in `card.tsx`. If the component needs a package, the command installs it and `package.json` changes too.

---

## H3.10 When something goes wrong

| Message or symptom | Cause | Fix |
|---|---|---|
| `Failed to resolve import "…"` in the browser, after a `git pull` | A package added on another computer is not installed here | `npm install` in `frontend/`, then restart `make dev` ([H3.7](#h37-adding-an-npm-package)) |
| `Failed to resolve import "@/…"` for a file of ours | The path or the file name is wrong (case counts) | Check the name; VS Code autocompletes the path |
| `error TS2345 … Did you mean …` on a `t('…')` | A misspelt translation key | The suggested key ([H3.6](#h36-translations)) |
| `has exactly the English keys` fails | A key missing in one language | The `-` line says which ([H3.6](#h36-translations)) |
| A Tailwind class with `[…]` does nothing, although the element has it | A `\'` inside the brackets: Tailwind reads the file as text and makes a class with the backslash | Write the string with the other quotes, or no quotes where CSS allows ([H3.28.6](#h3286-a-g-as-big-as-the-page)) |
| `ReferenceError: vi is not defined` | `vi` not imported in the test | `import { …, vi } from 'vitest'` |
| A test cannot find a text that is on the page | The text appears later | `findBy…` (waits) instead of `getBy…` |
| `Unable to find an accessible element with the role "button" and name "…"` | The name differs, or the button is not there | The error prints the page's HTML: search it for the button |
| The page is blank | A JavaScript error | The browser's Console ([H3.8](#h38-checking-in-the-browser)) |
| The list does not update after saving | The mutation does not invalidate the key, or uses another key | `invalidateQueries({ queryKey: muscleKeys.all })` ([H3.4.1](#h341-the-mutation)) |
| Old names after switching language | The language is not in the query key | Add it ([H3.3.1](#h331-the-api-file)) |
| 401 on every request | The session has ended, or you are signed out | Sign in again; Application → Cookies ([H3.8](#h38-checking-in-the-browser)) |
| 404 on `/api/…` | The backend route is missing, or `make up` is not running | `make artisan c="route:list --path=api"` ([H2.2.4](H2-backend.md#h224-the-route)) |
| `Port 5673 is already in use` | Another `make dev` is still running | Close it; Vite never picks another port (`strictPort`) |
| Lint errors after `shadcn add` | The copied file has shadcn's style | `make fix` ([H3.9](#h39-a-shadcnui-component)) |
| `shadcn add` stops at `Would you like to overwrite?` | The component depends on one we changed, such as `button.tsx` | Add it alone and answer no: `printf 'n\n' \| npx shadcn add name` ([H3.12.2](#h3122-five-shadcnui-components)) |
| `Fast refresh only works when a file only exports components` | A function or constant exported from a component's file | Move it to a `.ts` file of its own ([H3.20.4](#h3204-the-errors-met)) |
| A test on a request's address does not find `filter[muscle]=…` | `URLSearchParams` escapes the brackets: `filter%5Bmuscle%5D` | Compare with `decodeURIComponent(path)` ([H3.20.4](#h3204-the-errors-met)) |
| `target.hasPointerCapture is not a function` in a test | A Radix Select opened in jsdom, which lacks three pointer functions | `src/test/setup.ts` gives them ([H3.21.4](#h3214-testing-radix-selects)) |
| `ResizeObserver is not defined` in a test | A Radix component measures itself; jsdom has no `ResizeObserver` | `src/test/setup.ts` gives one ([H3.12.5](#h3125-the-tests-and-the-errors-met)) |
| `"undefined" is not valid JSON` from `sentBody` | No call to that path sent a body | Check the path, and that the request was sent before reading it |
| Photos do not load, 404 on `/storage/…` | No `public/storage` link on this computer | `make artisan c="storage:link"` ([H3.12.1](#h3121-the-photos-reach-the-browser)) |
| The plan list is empty | No plan made yet | **New plan**, or `make plans-demo` after `make exercises-import` ([H3.13.1](#h3131-plans-to-look-at)) |
| `Found multiple elements with the role "button" and name "Save"` | The same button drawn twice on the page | One of each: a page with two Save buttons confuses screen readers as much as tests ([H3.14.6](#h3146-the-tests-and-the-errors-met)) |
| A drag does nothing in a test | jsdom draws nothing, so dnd-kit measures every row at zero | Test the action the drag sends, in the reducer; check the drag in the browser ([H3.14.5](#h3145-drag-and-drop)) |
| The editor brings back old changes | A draft kept in the browser from an earlier visit | **Discard changes**; or DevTools → Application → Local storage, the keys `atleoplan.planDraft.…` |
| A tab bar with no tab selected | The `value` given to `Tabs` matches none of its `TabsTrigger` | Check where the value comes from; a value read from the address must be checked first ([H3.13.4](#h3134-the-plan-page)) |

Setup problems: [S1.10](../start/S1-setup.md#s110-troubleshooting).

---

## H3.11 Commands at a glance

| What | Command |
|---|---|
| Start the backend and Vite | `make start` (or `make up`, then `make dev`) |
| Tests, once / at every save | `make fe-test` / `npm run test:watch` in `frontend/` |
| One test file | `npx vitest run src/pages/MusclesPage.test.tsx` in `frontend/` |
| TypeScript | `make typecheck` |
| Style, and fixes | `make lint`, `make fix` |
| A package | `npm install name` in `frontend/`; after a pull, `make fe-install` |
| A shadcn/ui component | `npx shadcn add name` in `frontend/`, then `make fix`; answer no to overwriting our files |
| The photos' link, once per computer | `make artisan c="storage:link"` (`make setup` does it) |
| Example plans for every user who has none | `make plans-demo`, after `make exercises-import` |
| The packages of a feature, at exact versions | `npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0` in `frontend/` |
| Every check, backend included | `make check` |

**Official documentation:** React https://react.dev/learn; React Router https://reactrouter.com; TanStack Query https://tanstack.com/query/latest/docs/framework/react/overview; react-hook-form https://react-hook-form.com; zod https://zod.dev; Testing Library https://testing-library.com/docs/queries/about; Vitest https://vitest.dev; i18next https://www.i18next.com.

---

## H3.12 The exercise library screens, as built

UI-1 built the library's three screens on the API of [C2.5.4](../concepts/C2-backend.md#c254-the-exercise-librarys-endpoints): the list, an exercise's page, the editor. How they work is in [C1.14](../concepts/C1-frontend.md#c114-the-exercise-library-screens); this section is the doing, with the real output. It shows what [H3.2](#h32-a-new-page)–[H3.5](#h35-testing-a-page) do not: a list read in pages, filters kept in the address, a form shaped differently from the API, a confirmation dialog, and photos served by Laravel.

| File | What it is |
|---|---|
| `src/api/exercises.ts`, `muscles.ts`, `equipment.ts` | Types, keys and hooks of the library and its two fixed lists |
| `src/pages/ExercisesPage.tsx`, `ExerciseDetailPage.tsx`, `ExerciseEditorPage.tsx` | The three screens; their routes in `src/router.tsx` |
| `src/components/exercises/` | `ExerciseListItem`, `ExerciseFilters`, `ExercisePhotos`, `ExerciseForm`, and `exercise-form.ts` (rules and conversions) |
| `src/lib/useDebouncedValue.ts` | The search's pause |
| `src/components/ui/badge.tsx`, `checkbox.tsx`, `native-select.tsx`, `textarea.tsx`, `alert-dialog.tsx` | Five shadcn/ui components |
| `src/i18n/locales/*.json` | The `exercises` section, in four languages |
| `src/test/exercise-helpers.ts`, `auth-helpers.tsx`, `setup.ts` | Test data, and two changes to the helpers |
| 4 test files, 26 tests | Next to the pages, and `exercise-form.test.ts` |
| Backend: `ExerciseResource.php`, `ExerciseController.php`, `ExerciseApiTest.php`; `Makefile` | The photos in the API, and `storage:link` in `make setup` |

### H3.12.1 The photos reach the browser

The imported photos are files in `backend/storage/app/public` ([H1.12](H1-database.md#h112-the-free-exercise-db-import-as-built)). Two steps make them reachable.

**A link from Laravel's public folder,** which the web server exposes, to that folder:

```sh
make artisan c="storage:link"
```

```
INFO  The [public/storage] link has been connected to [storagepublic].
```

(The odd `[storagepublic]` is how Laravel prints the target, `storage/app/public`.) `backend/public/storage` is in `backend/.gitignore`: every computer makes its own link, and `make setup` now does it.

**The photos in the API, as paths.** `ExerciseResource` adds `"photos": [{ "id": 1, "url": "/storage/1/0.jpg" }, …]`. medialibrary's `getUrl()` gives `http://localhost:8000/storage/1/0.jpg`, from `APP_URL`, as Laravel sees itself inside the container:

```sh
make artisan c="config:show app.url"
```

```
app.url .............................................. http://localhost:8000
```

The browser cannot reach port 8000 (Laravel is at 8500 from the computer), so the resource keeps only the path, and the React app's server forwards `/storage` to Laravel: Vite's proxy already listed it (`vite.config.ts`). The backend's test:

```
✓ it sends the photos as paths on the app's own address, in their order
```

### H3.12.2 Five shadcn/ui components

```sh
npx shadcn add badge textarea checkbox alert-dialog native-select --yes
```

```
✔ Checking registry.
- Updating files.
? The file button.tsx already exists. Would you like to overwrite? › (y/N)
```

**The command stopped there.** `alert-dialog` uses `button.tsx`, and offered to replace ours, which has the app's own `xl` size. `--yes` does not answer that question. Four files had been written; the fifth was added alone, answering "no":

```sh
printf 'n\n' | npx shadcn add alert-dialog
```

```
✔ The file button.tsx already exists. Would you like to overwrite? … no
✔ Created 1 file:
  - src/components/ui/alert-dialog.tsx
ℹ Skipped 1 file: (files might be identical, use --overwrite to overwrite)
  - src/components/ui/button.tsx
```

`printf 'n\n' |` types "n" and Enter into the command. Then the style, as in [H3.9](#h39-a-shadcnui-component):

```sh
npx eslint src/components/ui/{badge,checkbox,native-select,textarea,alert-dialog}.tsx
```

```
✖ 77 problems (77 errors, 0 warnings)
  77 errors and 0 warnings potentially fixable with the `--fix` option.
```

`npx eslint --fix` on the same files corrected all 77; then each file got its header comment and a line on each function, on the model of `card.tsx`.

**Why `native-select`.** The library's filters and the editor use the browser's own `<select>`, styled: on a phone it opens the system's picker, it needs no code to place a popup, and `register()` and `userEvent.selectOptions()` work on it as on any field.

### H3.12.3 The list

`src/api/exercises.ts` follows [H3.3.1](#h331-the-api-file), with `useInfiniteQuery` for the pages ([C1.14.2](../concepts/C1-frontend.md#c1142-a-list-one-page-at-a-time)). The page keeps its filters in the address ([C1.14.3](../concepts/C1-frontend.md#c1143-filters-in-the-address)):

| Address | List |
|---|---|
| `/exercises` | All, sorted by name |
| `/exercises?q=panca` | The search; the request leaves 300 ms after the last key |
| `/exercises?muscle=chest&equipment=barbell` | Primary muscle chest, with a barbell |
| `/exercises?source=mine` | Only the user's own; empty, it offers to create the first one |

Each filter's request, as the test reads it from the fake API: `/api/exercises?filter%5Bmuscle%5D=chest&filter%5Bsource%5D=mine&page=1&per_page=50` (`%5B` and `%5D` are `[` and `]`, escaped by `URLSearchParams`).

### H3.12.4 The page and the editor

- **The page** shows the facts as a description list (`<dl>`), the steps as a numbered list, the YouTube link in a new tab. Edit and Delete appear only when `is_mine` is true. Delete opens an `AlertDialog`; its button calls `event.preventDefault()`, so the dialog stays open until the request is done, then the app goes to the list with `replace: true`.
- **The editor** is one page for `/exercises/new` and `/exercises/:id/edit`. For a change it waits for the exercise, then draws `ExerciseForm` with its values. The form's fields and the API's body differ, and `exercise-form.ts` converts between them ([C1.14.4](../concepts/C1-frontend.md#c1144-the-editors-form)).
- **"Create «…»"** after a search with no result opens `/exercises/new?name=…`, and the editor starts with that name.

### H3.12.5 The tests, and the errors met

```sh
npx vitest run src/pages/Exercise src/components/exercises --reporter=verbose
```

```
✓ src/components/exercises/exercise-form.test.ts > toExerciseInput > turns the form into what the API expects
✓ src/components/exercises/exercise-form.test.ts > toExerciseInput > never sends the main muscle as a secondary one too
✓ src/components/exercises/exercise-form.test.ts > toExerciseInput > sends no muscle and no equipment when none is chosen
✓ src/components/exercises/exercise-form.test.ts > formValuesFrom > fills the form from an exercise, and gives it back unchanged
✓ src/components/exercises/exercise-form.test.ts > exerciseFormSchema > asks for a name, and refuses a link that is not YouTube
✓ src/components/exercises/exercise-form.test.ts > exerciseFormSchema > accepts the YouTube addresses people paste
✓ src/pages/ExerciseDetailPage.test.tsx > ExerciseDetailPage > shows the photos, the facts, the muscles and the steps
✓ src/pages/ExerciseDetailPage.test.tsx > ExerciseDetailPage > lets the owner edit, and delete after confirming
✓ src/pages/ExerciseDetailPage.test.tsx > ExerciseDetailPage > keeps the exercise when the dialog is cancelled
✓ src/pages/ExerciseDetailPage.test.tsx > ExerciseDetailPage > says so for an exercise that is not there, or not the user's
✓ src/pages/ExercisesPage.test.tsx > ExercisesPage > lists the exercises with their count, cover, main muscle and Mine badge
✓ src/pages/ExerciseEditorPage.test.tsx > ExerciseEditorPage > creates an exercise from every field, then opens it
✓ src/pages/ExerciseEditorPage.test.tsx > ExerciseEditorPage > does not let the main muscle be ticked as secondary
✓ src/pages/ExerciseEditorPage.test.tsx > ExerciseEditorPage > starts with the name of the search that found nothing
✓ src/pages/ExerciseEditorPage.test.tsx > ExerciseEditorPage > says what is wrong before sending anything
✓ src/pages/ExerciseEditorPage.test.tsx > ExerciseEditorPage > shows the server's message under its field
✓ src/pages/ExerciseEditorPage.test.tsx > ExerciseEditorPage > changes an exercise, starting from its values
✓ src/pages/ExerciseEditorPage.test.tsx > ExerciseEditorPage > refuses to edit an exercise that is not the user's
✓ src/pages/ExercisesPage.test.tsx > ExercisesPage > searches once typing pauses, and keeps the search in the address
✓ src/pages/ExercisesPage.test.tsx > ExercisesPage > reads the filters from the address and sends them
✓ src/pages/ExercisesPage.test.tsx > ExercisesPage > changes a filter in the address and in the request
✓ src/pages/ExercisesPage.test.tsx > ExercisesPage > offers to create the exercise a search did not find
✓ src/pages/ExercisesPage.test.tsx > ExercisesPage > invites to create the first personal exercise
✓ src/pages/ExercisesPage.test.tsx > ExercisesPage > offers to clear filters that match nothing
✓ src/pages/ExercisesPage.test.tsx > ExercisesPage > loads the next page with Show more
✓ src/pages/ExercisesPage.test.tsx > ExercisesPage > says so when the list cannot be loaded
Test Files  4 passed (4)
     Tests  26 passed (26)
```

**Two errors, on the way there.**

The editor's tests first failed, every one of them, with:

```
React Router caught the following error during render ReferenceError: ResizeObserver is not defined
```

Radix's Checkbox watches its own size with `ResizeObserver`, which every browser has and jsdom does not. `src/test/setup.ts` now gives the tests one that does nothing.

Then one test, the change of an exercise:

```
FAIL  src/pages/ExerciseEditorPage.test.tsx > ExerciseEditorPage > changes an exercise, starting from its values
SyntaxError: "undefined" is not valid JSON
```

`sentBody(fake, '/api/exercises/13')` took the first call to that path, which was the page's `GET`, with no body. It now takes the first call **with a body**, the `PATCH`.

### H3.12.6 The production build

```sh
npm run build
```

```
dist/assets/index-BO-zBKwn.js                              783.30 kB │ gzip: 245.70 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
…
✓ built in 1.55s
```

The warning is the known limit of [C1.11](../concepts/C1-frontend.md#c111-known-limits): one file for the whole app, grown by these screens, under 250 kB once compressed. Splitting it per page is for when it starts to slow the first load.

### H3.12.7 Checking in the browser

With `make start`, at http://localhost:5673/exercises:

- **The list:** 876 exercises, with a photo on each row but three (the source has none for them); typing "bench" narrows it after a pause, and the address shows `?q=bench`. Back and Forward walk between pages, not letters.
- **The filters:** a muscle, then Mine: the address and the count follow; reloading the page keeps them.
- **What stays at the top:** scroll the list. In a wide window, the search box and the filters stay; in the device toolbar at a phone's width ([H3.8.1](#h381-phone-tablet-and-desktop-widths); *iPhone SE*, for example) only the search box stays, and the filters scroll away.
- **The photos:** in the Network tab ([H3.8](#h38-checking-in-the-browser)), the images come from `localhost:5673/storage/…`, with status 200.
- **An exercise of your own:** **New exercise**, fill it in, Create: its page opens with the Mine badge, Edit and Delete. Delete asks first.
- **Another language:** in Profile, switch to Italian: the names, the muscles and the equipment change too.


## H3.13 The plan screens, as built

The second part of FEAT-2 built the plan list and a plan's page on the API of [C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints). How they work is in [C1.15](../concepts/C1-frontend.md#c115-the-plan-screens); this section is the doing, with the real output, as a tutorial for the next screens. It shows what [H3.12](#h312-the-exercise-library-screens-as-built) does not: tabs whose state is in the address, text worked out from data by plain tested functions, one mutation hook for three actions, test answers that change after an action, and example data for screens that cannot make their own yet.

| File | What it is |
|---|---|
| `src/api/plans.ts` | Types, keys and hooks of the plans |
| `src/pages/PlansPage.tsx`, `PlanDetailPage.tsx` | The two screens; the new route `plans/:id` in `src/router.tsx` |
| `src/components/plans/` | `PlanCard`, `PlanDayView`, `PlanItemRow`, and `plan-format.ts` (the line of an exercise, the supersets) |
| `src/components/ComingSoon.tsx` | The "Coming soon" pill, taken out of `EmptyState` to be used next to a button too |
| `src/components/ui/tabs.tsx` | shadcn/ui's tabs |
| `src/i18n/locales/*.json` | The `plans` section, in four languages |
| `src/test/plan-helpers.ts` | Plans to fake |
| 3 test files, 23 tests | Next to the pages, and `plan-format.test.ts` |
| Backend: `database/seeders/DemoPlanSeeder.php`, `tests/Feature/Plans/DemoPlanSeederTest.php`; `Makefile` | Two example plans per user, `make plans-demo` |

### H3.13.1 Plans to look at

The editor came in the next branch ([H3.14](#h314-the-plan-editor-as-built)); while it did not exist, the app could not make a plan, and the list would always have been empty. The seeder stays useful to look at the screens without building a plan by hand. A seeder gives every user with no plans two examples, written through `SavePlan`, the action behind `POST /api/plans`, so they are exactly what the API would save:

```sh
make artisan c="make:seeder DemoPlanSeeder"
make artisan c="make:test Plans/DemoPlanSeederTest --pest"
```

```
INFO  Seeder [database/seeders/DemoPlanSeeder.php] created successfully.
INFO  Test [tests/Feature/Plans/DemoPlanSeederTest.php] created successfully.
```

- **The exercises are found by their free-exercise-db id** (`external_id`, such as `Barbell_Squat`), which is the same on every computer, unlike the numbers Postgres gives.
- **`run(SavePlan $save)`:** a seeder's `run()` gets its parameters from the service container, as a controller's method does.
- **Not in `DatabaseSeeder`:** after `make fresh` the library is empty until `make exercises-import`, so the seeder would find no exercises. It says so instead of failing:

```
The exercise library is not imported: run `make exercises-import` first. Missing: Barbell_Bench_Press_-_Medium_Grip, …
```

A `Makefile` target runs it, after the import:

```sh
make plans-demo
```

```
INFO  Seeding database.

Database\Seeders\DemoPlanSeeder .................................... RUNNING
Two example plans for <your email>
Database\Seeders\DemoPlanSeeder ................................ 140 ms DONE
```

Run again, it prints no line in between: users who have a plan are skipped (`User::query()->doesntHave('plans')`). The three tests:

```
✓ it gives a user with no plans an active plan of three days and an archived one
✓ it leaves alone a user who already has a plan, so it can run again
✓ it writes nothing, and says why, before the library is imported
```

The last one runs the seeder as from the terminal, `$this->artisan('db:seed', ['--class' => DemoPlanSeeder::class])`, and checks what it prints with `expectsOutputToContain()`.

### H3.13.2 The tabs component

```sh
printf 'n\n' | npx shadcn add tabs
```

```
✔ Checking registry.
✔ Created 1 file:
  - src/components/ui/tabs.tsx
```

`printf 'n\n' |` answers "no" in case it offers to overwrite one of our files, as `alert-dialog` did ([H3.12.2](#h3122-five-shadcnui-components)); this time it did not ask. Then the style:

```sh
npx eslint src/components/ui/tabs.tsx
```

```
✖ 20 problems (20 errors, 0 warnings)
  20 errors and 0 warnings potentially fixable with the `--fix` option.
```

`npx eslint --fix` corrected all 20. The generated file imports `cn` from `'cn'`, like every other file in `components/ui/`: not a mistake, `cn` is a small package by the authors of shadcn/ui, in `package.json`, which `src/lib/utils.ts` re-exports for the rest of the app. A header comment and a line on each export were added, as for the other components.

### H3.13.3 The API file and the line of an exercise

`src/api/plans.ts` follows [H3.3.1](#h331-the-api-file): the types of the JSON of [C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints), the keys, the hooks. Two choices are new:

- **Which keys carry the language.** The list's key is `['plans', 'list', archived]`: a plan's name is the user's own text, never translated. A whole plan's key adds the language, `['plans', 'detail', id, 'it']`, because it holds exercises, whose names arrive translated.
- **One hook for three actions,** `usePlanAction(id)`, whose `mutate()` takes the verb ([C1.15.4](../concepts/C1-frontend.md#c1154-actions-on-a-plan)).

The line that sums up an exercise is worked out in `src/components/plans/plan-format.ts`, plain functions with tests of their own, one per case:

```ts
expect(itemSummary(item, options)).toBe('4 × 8–10 · 80 kg · 90 sec')
expect(itemSummary(item, { ...options, defaultRestSeconds: 150 })).toBe('3 × 10/8/max · 60–70 kg · 150 sec')
expect(formatSeconds(90, 'de')).toBe('90 Sek.')
```

The units come from `Intl`; to see what it writes before choosing, run it in Node:

```sh
node -e "for (const l of ['en','it','es','de']) console.log(l, new Intl.NumberFormat(l, { style: 'unit', unit: 'second', unitDisplay: 'short' }).format(90))"
```

```
en 90 sec
it 90 s
es 90 s
de 90 Sek.
```

`unitDisplay: 'narrow'` would give `90s` in every language but German; `short` was kept, each language's usual form.

### H3.13.4 The plan page

`PlanDetailPage` has two layers, as `ExerciseDetailPage`: the outer component handles loading and errors, the inner one, `PlanDetail`, draws a plan that is there. The tabs are controlled from the address:

```tsx
const requested = Number(searchParams.get('day') ?? '1')
const dayIndex = Number.isInteger(requested) && requested >= 1 && requested <= plan.days.length ? requested - 1 : 0

<Tabs value={String(dayIndex)} onValueChange={openDay}>
```

- **The check on the value matters.** Without it, `?day=9` gives `Tabs` a value that no tab has: Radix then selects nothing and shows no panel. It was tried, removing the check; the test `opens the first day when the address names one that does not exist` failed on `expect(element).toHaveAttribute("aria-selected", "true")`.
- **Tabs give their value as text.** `TabsTrigger value={String(index)}`, and `openDay(value)` turns it back into a number.
- **The weight unit and the default rest** come from `useCurrentUser()`. `RequireAuth` has asked for the user before any page opens, so it is in the cache, and the hook answers at once.

### H3.13.5 The tests, and the errors met

```sh
npx vitest run src/pages/Plan src/components/plans --reporter=verbose
```

```
✓ src/components/plans/plan-format.test.ts > itemSummary > sums up the working sets, the weight and the rest, warm-ups apart
✓ src/components/plans/plan-format.test.ts > itemSummary > writes numbers and units in the reader's language and unit
✓ src/components/plans/plan-format.test.ts > itemSummary > lists each set when they ask for different things
✓ src/components/plans/plan-format.test.ts > itemSummary > counts the sets when none has a target
✓ src/components/plans/plan-format.test.ts > itemSummary > shows times and distances for the exercises logged that way
✓ src/components/plans/plan-format.test.ts > formatSeconds > says whole minutes as minutes, anything else as seconds
✓ src/components/plans/plan-format.test.ts > groupSupersets > joins neighbours with the same number, and leaves the others alone
✓ src/pages/PlansPage.test.tsx > PlansPage > shows each plan as a card: name, goal, days, and the Active badge
✓ src/pages/PlansPage.test.tsx > PlansPage > switches to the archived plans, in the address and in the request
✓ src/pages/PlansPage.test.tsx > PlansPage > invites to create the first plan, the action marked as coming soon
✓ src/pages/PlansPage.test.tsx > PlansPage > says so when there is no archived plan
✓ src/pages/PlansPage.test.tsx > PlansPage > says so when the list cannot be loaded, with a way to try again
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > shows the first day: each exercise summed up, warm-ups apart, the superset joined
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > opens another day, and keeps it in the address
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > opens the day named in the address
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > opens the first day when the address names one that does not exist
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > shows the weights in the user's unit
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > makes the plan active, then shows it so
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > archives the plan, and offers to restore it
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > says so when an action fails
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > deletes the plan after confirming, then opens the list
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > keeps Edit disabled until the editor exists
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > says so for a plan that is not there, or not the user's
Test Files  3 passed (3)
     Tests  23 passed (23)
```

**Answers that change after an action.** "Set as active" must show the Active badge afterwards, which the page reads from the plan, read again after the action. The fake API answers the plan through a function, reading a variable that the `POST` changes ([C1.15.5](../concepts/C1-frontend.md#c1155-testing-it)).

**The error met.** The first run failed one test:

```
FAIL  src/pages/PlanDetailPage.test.tsx > PlanDetailPage > shows the first day: each exercise summed up, warm-ups apart, the superset joined
TestingLibraryElementError: Unable to find an element with the text: 1 × max · 90 sec.
```

The code was right, the test was not: pull-ups to failure with no target are a set with nothing to show, and the rule written in `plan-format.ts` for that is to count the sets, `1 set · 90 sec`. "max" is only for a set with no target among sets that have one (`3 × 10/8/max`). The test was corrected.

**Proving they can fail.** Two lines were broken on purpose, then put back:

| Line changed | Test that failed |
|---|---|
| `item.superset_group !== null &&` removed from `groupSupersets()` | `joins neighbours with the same number, and leaves the others alone`: two lone exercises next to each other were joined into one "superset" of no group. The test had no such neighbours at first; they were added to its data for this |
| The check on `?day=` removed (`dayIndex = requested - 1`) | `opens the first day when the address names one that does not exist`, a test added for this |

### H3.13.6 The production build

```sh
npm run build
```

```
dist/assets/index-CoD4mpmV.js                              811.50 kB │ gzip: 252.97 kB
(!) Some chunks are larger than 500 kB after minification. Consider:
✓ built in 1.74s
```

28 kB more than after the library's screens. The known limit of [C1.11](../concepts/C1-frontend.md#c111-known-limits).

### H3.13.7 Checking in the browser

With `make start`, after `make exercises-import` and `make plans-demo`, at http://localhost:5673/plans:

- **The list:** Push Pull Legs, with the Active badge and a lime border, "3 days". **Archived** shows Full body; the address says `?archived=1`, and a reload keeps it.
- **A plan:** open Push Pull Legs, with the app in Italian. Day A: the bench press reads `4 × 8–10 · 80 kg · 2 min` and `+ 2 di riscaldamento`; lateral raises and pushdowns sit in a superset, with the lime bar. Day B: pull-ups read `3 serie · 2 min`, the curl `3 × 12/10/8 · 25–35 kg · 1 min`.
- **The tabs:** click Day C: the address gets `?day=3`. Open an exercise and press Back: Day C is still open. With the keyboard, Tab onto the tabs, then the arrow keys.
- **The unit:** there is no switch in Profile yet; in tinker, `User::first()->forceFill(['weight_unit' => 'lb'])->save()`, then reload: `176,37 lb`. Put it back with `'kg'`.
- **The actions:** Archive, then Restore. Open Full body in the archived view: it has Restore and no Set as active; restore it, then Set as active, and the badge moves to it in the list. Delete asks first, then opens the list.
- **A phone's width** ([H3.8.1](#h381-phone-tablet-and-desktop-widths)): the day tabs scroll sideways if they do not fit.


## H3.14 The plan editor, as built

The last part of FEAT-2 built the plan editor, at `/plans/new` and `/plans/:id/edit`. It has since been split into two steps, the plan's details and then the days' exercises ([H3.22](#h322-the-plan-editor-in-two-steps-as-built)); what follows is the first version, on one page. How it works is in [C1.16](../concepts/C1-frontend.md#c116-the-plan-editor); this section is the doing, with the real output, as a tutorial for the next large screen. It shows what H3.12 and H3.13 do not: state held by a reducer and tested without React, drag and drop, a modal window, a draft kept in the browser, the server's field names turned into the screen's, state passed with a navigation, and a check of the body against the real backend.

| File | What it is |
|---|---|
| `src/components/plans/plan-draft.ts` | The draft: types, conversions, rules, reducer |
| `src/components/plans/draft-storage.ts` | The draft kept in `localStorage` |
| `src/components/plans/editor/` | `PlanEditor`, `EditorDay`, `EditorItem`, `EditorSet`, `ExercisePicker` |
| `src/pages/PlanEditorPage.tsx` | `/plans/new` and `/plans/:id/edit`; the two routes in `src/router.tsx` |
| `src/api/plans.ts` | `useCreatePlan()`, `useUpdatePlan()`, `PlanInput` |
| `src/components/ui/dialog.tsx` | shadcn/ui's Dialog, with a translated close label |
| `src/components/ui/button.tsx` | A new size, `icon-xl`: a 48 px square |
| `src/pages/PlansPage.tsx`, `PlanDetailPage.tsx` | New plan and Edit now open the editor; the "changed elsewhere" warning |
| `src/components/plans/plan-format.ts` | `workingSets()` and `warmUpCount()` accept the draft's sets too |
| `src/i18n/locales/*.json` | `plans.editor`, `plans.detail.changedElsewhere`, `common.close` |
| `package.json` | `@dnd-kit/core`, `sortable`, `utilities`, `modifiers` |
| 2 test files, 25 tests | `plan-draft.test.ts`, `PlanEditorPage.test.tsx`; two tests of H3.13 changed |

### H3.14.1 The packages

dnd-kit was chosen in [D2.2](../design/D2-decisions.md#d22-stack). First, what exists and what it needs:

```sh
npm view @dnd-kit/core version peerDependencies
```

```
version = '6.3.1'
peerDependencies = { react: '>=16.8.0', 'react-dom': '>=16.8.0' }
```

`peerDependencies` are what the package expects the app to have already: any React from 16.8, so React 19 is fine. Then, in `frontend/`, at exact versions:

```sh
npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2
npm install @dnd-kit/modifiers@9.0.0
```

The second came later, when the list needed `restrictToVerticalAxis` (a drag moves only up and down). npm printed, among its lines, `15 vulnerabilities (2 low, 13 moderate)`. Before going on, which packages they are:

```sh
npm audit --json | python3 -c "import json,sys; print(sorted(json.load(sys.stdin)['vulnerabilities']))"
```

```
['@eslint/config-array', '@eslint/js', '@shadcn/registry', '@ts-morph/common', '@typescript-eslint/eslint-plugin', … 'eslint', 'minimatch', 'shadcn', 'ts-morph', 'typescript-eslint']
```

All tools of development (ESLint, shadcn's command), none in the app and none from dnd-kit, so nothing to do now; `make audit` lists them. Never `npm audit fix --force` ([S1.10](../start/S1-setup.md#s110-troubleshooting)).

### H3.14.2 The dialog component

```sh
printf 'n\n' | npx shadcn add dialog
```

```
✔ The file button.tsx already exists. Would you like to overwrite? … no
✔ Created 1 file:
  - src/components/ui/dialog.tsx
ℹ Skipped 1 file: (files might be identical, use --overwrite to overwrite)
  - src/components/ui/button.tsx
```

This time it asked, as `alert-dialog` did, and the `n` answered. Then `npx eslint --fix src/components/ui/dialog.tsx`, and the comments. One change to shadcn's code: the X had a hidden English word, `<span className="sr-only">Close</span>`. `DialogContent` now takes `closeLabel`, and the picker passes `t('common.close')`. A text in a shadcn component is easy to miss: search the copied file for English words.

### H3.14.3 The draft first, with its tests

The editor was built from the inside out: first `plan-draft.ts`, plain functions with no screen, and their tests; then the components that send actions to it.

The reducer has one `case` per action. Each copies the draft and changes the copy:

```ts
export function draftReducer(draft: PlanDraft, action: DraftAction): PlanDraft {
  if (action.type === 'replace') return action.draft
  const next = structuredClone(draft)
  const day = 'day' in action ? next.days[action.day] : undefined

  switch (action.type) {
    case 'cycleSetType': {
      const set = day?.items[action.item]?.sets[action.set]
      if (set) set.set_type = SET_TYPES[(SET_TYPES.indexOf(set.set_type) + 1) % SET_TYPES.length] ?? 'normal'
      break
    }
    // … one case per action
  }

  for (const changed of next.days) normalizeSupersets(changed.items)
  return next
}
```

The tests apply a few actions and read the result, with a helper that runs them in turn:

```ts
function run(start: PlanDraft, ...actions: DraftAction[]): PlanDraft {
  return actions.reduce(draftReducer, start)
}

const next = run(draft(), { type: 'moveItem', day: 0, from: 1, to: 0 })
```

`actions.reduce(draftReducer, start)` is the same thing `useReducer` does over time: each action turns the draft into the next one. This is also where the name "reducer" comes from.

```sh
npx vitest run src/components/plans/plan-draft.test.ts
```

```
Test Files  1 passed (1)
     Tests  17 passed (17)
```

All 17 passed at the first run, which proves little: [H3.14.6](#h3146-the-tests-and-the-errors-met) breaks lines on purpose to see them fail.

### H3.14.4 The components

`PlanEditor` holds the draft and hands `dispatch` down; each component sends actions with its indexes:

```tsx
// In EditorSet: a tap on the set's number (since feat/set-types-rpe, a list: H3.24.3)
<Button onClick={() => dispatch({ type: 'cycleSetType', ...at })}>{SET_TYPE_SIGNS[set.set_type] ?? number}</Button>
```

`...at` spreads `{ day, item, set }` into the action. Three details worth copying:

- **A field's name for screen readers says which set:** `aria-label="Set 2, Reps"`. On screen a row of three fields has no room for labels; the placeholder (`8-10`, `kg`, `RPE`) hints the format.
- **`inputMode`** picks the phone's keyboard: `decimal` for weights (digits and a separator), `numeric` for seconds, and plain text for reps, which need the dash of `8-10`.
- **An opened exercise** is a `<button aria-expanded={open} aria-controls={panelId}>`: screen readers say whether it is open, and the handle and the tick box stay separate buttons beside it, not inside it (a button inside a button is invalid HTML).

The picker reuses the library's hook, `useExercises({ search }, language)`, and draws its list only while the window is open (`{open && <PickerBody … />}`), so closing forgets the search and the ticks.

### H3.14.5 Drag and drop

In `EditorDay`, the context and the list; in `EditorItem`, the row ([C1.16.3](../concepts/C1-frontend.md#c1163-drag-and-drop-with-dnd-kit)). The end of a drag is one action:

```tsx
function onDragEnd({ active, over }: DragEndEvent) {
  if (!over || active.id === over.id) return
  const from = day.items.findIndex(item => item.id === active.id)
  const to = day.items.findIndex(item => item.id === over.id)
  dispatch({ type: 'moveItem', day: dayIndex, from, to })
}
```

**Why there is no test of the drag itself.** dnd-kit decides where a row lands from the rows' positions on screen. jsdom, the fake browser of the tests, lays nothing out: every row measures 0 × 0 at 0, 0, so a simulated drag lands nowhere. What matters, that `moveItem` reorders the list and takes the moved exercise out of a superset it left, is tested in the reducer; the drag is checked by hand in the browser ([H3.14.8](#h3148-checking-in-the-browser)), with the mouse, a phone's width and the keyboard.

### H3.14.6 The tests, and the errors met

```sh
npx vitest run src/components/plans/plan-draft.test.ts src/pages/PlanEditorPage.test.tsx --reporter=verbose
```

```
✓ src/components/plans/plan-draft.test.ts > reading what is typed > reads reps as one number or a range
✓ src/components/plans/plan-draft.test.ts > reading what is typed > reads decimals with a dot or a comma
✓ src/components/plans/plan-draft.test.ts > from the API and back > turns a saved plan into a draft and back into the same body
✓ src/components/plans/plan-draft.test.ts > from the API and back > shows weights in the user's unit and language, and sends kilograms
✓ src/components/plans/plan-draft.test.ts > from the API and back > starts a new plan with one empty day and no version
✓ src/components/plans/plan-draft.test.ts > from the API and back > names the draft's field for a field named by the server
✓ src/components/plans/plan-draft.test.ts > validateDraft > finds nothing wrong in a saved plan
✓ src/components/plans/plan-draft.test.ts > validateDraft > names each wrong field, with the key of its message
✓ src/components/plans/plan-draft.test.ts > draftReducer > leaves the draft it was given as it was
✓ src/components/plans/plan-draft.test.ts > draftReducer > adds exercises with three sets each, and a set copied from the last one
✓ src/components/plans/plan-draft.test.ts > draftReducer > cycles a set's type: normal, warm-up, drop, failure, normal
✓ src/components/plans/plan-draft.test.ts > draftReducer > joins exercises into a superset, next to each other where the first was
✓ src/components/plans/plan-draft.test.ts > draftReducer > takes an exercise out of its superset when it is dragged away, and ends a superset of one
✓ src/components/plans/plan-draft.test.ts > draftReducer > moves an exercise to another day, alone, and keeps its id
✓ src/components/plans/plan-draft.test.ts > draftReducer > adds, renames, moves and removes days
✓ src/components/plans/plan-draft.test.ts > draftReducer > stops at the backend's limits
✓ src/components/plans/plan-draft.test.ts > draftReducer > gives every new exercise its own id
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > creates a plan from exercises chosen in the library, then opens it
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > says what is wrong before sending anything
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > shows the server's message under its field
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > saves a plan again with its version and its ids
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > warns on the plan's page when the plan had been changed elsewhere
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > keeps the draft when leaving, and discards it on request
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > joins two exercises in a superset
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > adds a day named with the next letter, and opens it
Test Files  2 passed (2)
     Tests  25 passed (25)
```

**The errors met, in order.**

`npx tsc -b` refused the first `EditorItem`:

```
src/components/plans/editor/EditorItem.tsx(80,31): error TS2345: Argument of type 'DraftSet[]' is not assignable to parameter of type 'PlanSet[]'.
```

`warmUpCount()`, written for the plan's page, took the API's sets; the editor has its own. Both have a `set_type`, which is all it reads, so it became generic: `workingSets<T extends { set_type: SetType }>(sets: T[]): T[]` accepts any list of objects with a `set_type`.

`npx eslint src` then found a line with two statements (`onClick={() => { setSelecting(false); setChosen([]) }}`, now a function `stopSelecting`) and the layout of a long type, which `--fix` corrected.

The first run of the page's tests failed seven tests out of eight, all alike:

```
TestingLibraryElementError: Found multiple elements with the role "button" and name "Save"
```

The editor drew its bar of buttons twice, at the top and at the bottom of the plan. The test was right to complain: a person with a screen reader also meets two "Save" and cannot tell them apart. The bar is now drawn once, and sticks to the top of the screen while the plan scrolls.

**Proving they can fail.** Three lines broken on purpose, then put back:

| Line changed | Tests that failed |
|---|---|
| `clearDraft(storageKey)` after a save removed | `creates a plan from exercises chosen in the library, then opens it`: `expected '{"draft":{"id":"398cf02b-…' to be null`, the draft still kept after the save |
| `normalizeSupersets()` removed from the reducer | four: three of the reducer's (join, drag away, move to another day) and `joins two exercises in a superset` on the page |
| `version` left out of the body | `turns a saved plan into a draft and back into the same body` and `saves a plan again with its version and its ids` |

**The body against the real backend.** The fake API of the tests accepts anything; the backend has rules of its own ([C2.5.6](../concepts/C2-backend.md#c256-validating-nested-data)). To check that the two agree, a temporary Vitest test built a body with the real functions (two exercises, one by time; 82,5 lb; RPE 8.5; a warm-up; a superset; a rest of 0) and wrote it to a file, and a temporary Pest test sent that file to `POST /api/plans`, then `PUT` with the version:

```
201 [{"set_type":"normal","target_reps_min":8,"target_reps_max":10,"target_weight_kg":"37.421","target_rpe":"8.5",…},{"set_type":"normal",…,"target_duration_seconds":60,…}] [1,1]
✓ it accepts the editor body
```

82,5 lb arrived as 37.421 kg, the timed set as 60 seconds, the superset whole. Both temporary files were then deleted: the contract between the two sides is kept by the backend's tests of the body ([H2.13.8](H2-backend.md#h2138-the-tests-and-proving-they-can-fail)) and the editor's tests of what it sends.

### H3.14.7 The production build

```sh
npm run build
```

```
dist/assets/index-BWgffEDr.js                              896.86 kB │ gzip: 279.26 kB
✓ built in 818ms
```

85 kB more than after the plan screens: dnd-kit, the Dialog and the editor. Still one file for the whole app; the editor is the first page to load only when opened, when the size starts to slow the first load ([C1.11](../concepts/C1-frontend.md#c111-known-limits)).

### H3.14.8 Checking in the browser

With `make start`, at http://localhost:5673/plans:

- **A new plan:** **New plan**, a name; **Add exercises**, search "squat", tick two, **Add (2)**. Open one: three sets of 8-10. Tap a set's number: 1 → W → D → F → 1. Type a weight with a comma, `82,5`. **Create plan**: the plan's page opens, with the line `3 × 8–10 · 82,5 kg · …`.
- **The rules:** clear the name and save: the field turns red, and nothing is sent (Network tab, [H3.8](#h38-checking-in-the-browser)). Type `10-8` as reps: the set's field turns red, and its day's tab gets a red dot.
- **Dragging:** with the mouse, drag an exercise by its handle (⋮⋮). At a phone's width ([H3.8.1](#h381-phone-tablet-and-desktop-widths)), the same with the pointer as a finger: the page does not scroll while dragging. With the keyboard: Tab to a handle, space, the arrows, space.
- **Supersets:** **Make a superset**, tick two, **Join in superset (2)**: they move together, with the lime bar. Drag one away: it leaves the superset, and the other is alone again.
- **The kept draft:** change something, open another page, come back: the change is there, with the banner. **Discard changes** brings back the plan as it was. In DevTools → Application → Local storage, the key `atleoplan.planDraft.<id>` appears and disappears.
- **Changed elsewhere:** open the same plan's editor in two tabs; save in the first, then in the second: the plan's page warns that it was changed somewhere else.

## H3.15 Workout mode, as built

The first screen of FEAT-3: **Start** on a plan's day, sets ticked one by one with the rest timer between them, **Finish** sending the workout, which is kept on the phone until the backend has it. How it works is in [C1.17](../concepts/C1-frontend.md#c117-workout-mode); this section is the doing, with the real output. What it shows that the earlier screens do not: a full-screen route outside the frame, time on screen (a clock, a timer), the browser's own APIs (Wake Lock, Web Audio, vibration), and data that must survive with no network.

| File | What it is |
|---|---|
| `src/api/sessions.ts` | The types of `GET /api/sessions/last-sets` and `PUT /api/sessions/{id}`; `fetchLastSets()`, `useLastSets()`, `sendSession()` |
| `src/components/workout/workout-session.ts` | The workout: types, `startSession()`, readers, reducer, `toSessionInput()` |
| `src/components/workout/session-storage.ts` | The workout in progress and the queue, in `localStorage` |
| `src/components/workout/WorkoutScreen.tsx`, `SetRow.tsx` (and `SetHeader`), `RestBar.tsx`, `clock.ts`, `layout.ts` | The screen |
| `src/pages/WorkoutPage.tsx` | `/session/:id`; the route in `src/router.tsx` |
| `src/lib/pending-sessions.ts`, `usePendingSessions.ts` | Sending the queue; the hook, called in `src/routes/RequireAuth.tsx` |
| `src/lib/useNow.ts`, `useWakeLock.ts`, `alarm.ts` | The moment every second; the screen kept on; beep and vibration |
| `src/pages/PlanDetailPage.tsx` | **Start this day**, the Resume banner, the message after Finish |
| `src/i18n/locales/*.json` | `workout.*`, 40 keys in each language |
| 4 test files, 24 tests | `workout-session.test.ts`, `pending-sessions.test.ts`, `WorkoutPage.test.tsx`, three new in `PlanDetailPage.test.tsx` |

No package was added: everything here is React, the libraries already in place, and the browser.

### H3.15.1 The order of building

From the inside out, as the plan editor ([H3.14.3](#h3143-the-draft-first-with-its-tests)), so each step can be tested before the next one uses it:

1. **`api/sessions.ts`:** the types copied from what the backend sends ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)); `sendSession(id, body)` is one line, `api.put(`/api/sessions/${id}`, body)`.
2. **`workout-session.ts` and its tests**, with no screen: start a workout, tick, rest, supersets, the clock, the body. `npx vitest run src/components/workout` after each function.
3. **`session-storage.ts`**, a copy of the plan editor's `draft-storage.ts` with two keys.
4. **`pending-sessions.ts` and its test:** the queue, with a fake API answering 201, 410, no network, 503, 422.
5. **The three hooks and `alarm.ts`.**
6. **The components**, then the page and its route, then the Start button on the plan's page; the page's tests last.

### H3.15.2 A route outside the frame

Every signed-in page so far was a child of `AppLayout`, drawn inside its `<Outlet />` with the navigation around it. Workout mode must fill the screen, so its route is a **sibling** of `AppLayout`, still a child of `RequireAuth` (which checks the user is signed in):

```tsx
{
  element: <RequireAuth />,
  children: [
    { element: <AppLayout />, children: [ /* Home, plans, exercises… */ ] },
    // Workout mode (D1.4.9): full screen, so a sibling of AppLayout, not
    // its child: no navigation around it. Still inside RequireAuth
    { path: 'session/:id', element: <WorkoutPage /> },
  ],
},
```

Open http://localhost:5673/session/anything signed in: the page says "This workout is not on this device.", with no tab bar. The page draws the workout only when its id matches the one kept on the phone:

```tsx
const { id } = useParams()
const [session] = useState(loadActiveSession)     // read once, when the page opens
if (session === null || session.id !== id) return <NotOnThisDevice />
return <WorkoutScreen initial={session} />
```

`useState(loadActiveSession)` passes the function itself, not `loadActiveSession()`: React calls it only for the first draw, and `localStorage` is not read again on every tick of the clock.

### H3.15.3 The browser's own APIs

Three features come from the browser, not from a library. Each is tried in DevTools' Console first ([H3.8](#h38-checking-in-the-browser)), on http://localhost:5673:

```js
'wakeLock' in navigator                        // true in Chrome, Edge, Safari 16.4+
await navigator.wakeLock.request('screen')     // WakeLockSentinel {released: false, type: 'screen'}
typeof navigator.vibrate                       // 'function' in Chrome; 'undefined' in Safari
```

Then each goes in its own small file, which **checks before using**: a browser without the feature, and the tests (jsdom has none of the three), simply get nothing, and nothing breaks.

```ts
// useWakeLock.ts
if (!active || !('wakeLock' in navigator)) return
// alarm.ts
if (options.vibration && typeof navigator.vibrate === 'function') navigator.vibrate([200, 100, 200])
if (options.sound && typeof AudioContext === 'function') beep(new AudioContext())
```

- **TypeScript already knows them:** `navigator.wakeLock`, `WakeLockSentinel`, `AudioContext` are in the DOM types that come with TypeScript; no `@types` package.
- **A beep without a sound file:** an `OscillatorNode` makes a tone at a frequency, a `GainNode` sets its volume, fading it in 0.3 s so it does not click; connected to `audio.destination`, the speakers. To hear it without waiting a whole rest: start a workout, tick a set, and tap **−15** until the rest ends.
- **Browsers allow sound only after a tap on the page.** In workout mode the user has always tapped ✓ before a rest ends, so the beep plays; the `try`/`catch` covers the rare case it does not.

### H3.15.4 The errors met

The first `npx eslint src` on the new files:

```
src/components/workout/WorkoutScreen.tsx
   95:7   error  Error: Calling setState synchronously within an effect can trigger cascading renders
> 95 |       setAnnounce(t('workout.restOver'))
     |       ^^^^^^^^^^^ Avoid calling setState() directly within an effect
  96 |       dispatch({ type: 'endRest' })
  97 |     }
  98 |   }, [left, session.rest, t, user])  react-hooks/set-state-in-effect
  141:37  error  `{t('workout.clock')}` must be placed on a new line  @stylistic/jsx-one-expression-per-line
  141:57  error  `: ` must be placed on a new line                   @stylistic/jsx-one-expression-per-line

src/components/workout/session-storage.ts
  89:17  error  '_sent' is assigned a value but never used  @typescript-eslint/no-unused-vars

src/components/workout/workout-session.ts
  262:27  error  '=' should be placed at the beginning of the line  @stylistic/operator-linebreak

src/lib/useWakeLock.ts
  28:61  error  This line has 3 statements. Maximum allowed is 1  @stylistic/max-statements-per-line

✖ 7 problems (7 errors, 0 warnings)
  4 errors and 0 warnings potentially fixable with the `--fix` option.
```

One at a time:

- **`react-hooks/set-state-in-effect`**, the one worth understanding. The first version watched the seconds left, and ended the rest when they reached 0:

  ```tsx
  useEffect(() => {
    if (session.rest !== null && left === 0) {
      restOver(…)
      setAnnounce(t('workout.restOver'))   // ← here
      dispatch({ type: 'endRest' })
    }
  }, [left, session.rest, t, user])
  ```

  An effect runs **after** React has drawn the screen; changing state inside it at once makes React draw everything again, straight away. Here it worked, but it is a common source of loops and flicker, and the React team's lint rule refuses it. The fix is the better design anyway: **one `setTimeout` set for the moment the rest ends** ([C1.17.4](../concepts/C1-frontend.md#c1174-the-rest-timer-a-moment-not-a-countdown)). The state now changes inside the timer's function, later, like in a click handler, which the rule accepts; and the effect runs once per rest instead of once per second.
- **`jsx-one-expression-per-line`:** `<span>{t('workout.clock')}: </span>` mixes an expression and text on one line. A template string makes it one expression: `` {`${t('workout.clock')}: `} ``.
- **`'_sent' is assigned a value but never used`:** removing a key from an object by destructuring, `const { [id]: _sent, ...others } = pending`, leaves an unused variable. Rewritten as `Object.fromEntries(Object.entries(pending).filter(([key]) => key !== id))`: the pairs, minus one, back into an object.
- **`max-statements-per-line`:** `.then((lock) => { sentinel = lock }).catch(() => { sentinel = null })` on one line; `.then` and `.catch` each on their own lines.
- **`operator-linebreak`:** fixed by `npx eslint --fix src`.

`npx tsc -b` passed at the first run.

### H3.15.5 The timer that showed 1:31

The page's test ticks a set and expects the rest timer at the user's 90 seconds:

```tsx
expect(within(rest).getByRole('timer')).toHaveTextContent('1:30')
```

It failed: the timer said `1:31`. A temporary `console.log(rest.textContent)` in the test printed the whole bar:

```
REST Rest1:31−15+15Skip
```

The tempting move is to loosen the test (`/1:(30|31)/`), and it was the first one tried. But a person would see 1:31 too, for a second, on a rest of 1:30, so the test was right. Why:

- `useNow(1000)` refreshes `now` **once a second**. When ✓ is tapped, the screen draws again at once, with the `now` of the last tick: a moment **older** than the tap, up to a second.
- The rest ends 90 s after the tap. Seen from that older `now`, it is 90.4 s away, say; `Math.ceil` rounds up to 91: `1:31`.

The fix is in `restLeft()`: never more than the rest's length.

```ts
return Math.min(session.rest.total, Math.max(0, left))
```

With an assertion in the reducer's tests that keeps it fixed: a `now` one second before the tap still reads 90.

```ts
expect(restLeft(ticked, new Date(at(59)))).toBe(90)
```

**The lesson:** a test that fails on a value "off by a little" is often showing a real, small bug. Look for the cause before widening the assertion.

### H3.15.6 The tests, proving they can fail, and the build

```sh
npx vitest run src/components/workout src/pages/WorkoutPage.test.tsx src/lib/pending-sessions.test.ts src/pages/PlanDetailPage.test.tsx --reporter=verbose
```

The new tests, among the plan page's older ones:

```
✓ src/components/workout/workout-session.test.ts > startSession > makes a set to do for each planned set, filled with last time's values, else the target
✓ src/components/workout/workout-session.test.ts > startSession > writes the weights in the user's unit and language
✓ src/components/workout/workout-session.test.ts > setNumbers > counts warm-ups apart, so the sets that count start from 1
✓ src/components/workout/workout-session.test.ts > workoutReducer > ticks a set, which starts the rest; unticking leaves the rest alone
✓ src/components/workout/workout-session.test.ts > workoutReducer > does not tick a set whose values do not read
✓ src/components/workout/workout-session.test.ts > workoutReducer > moves through a superset with no rest, then rests and goes back to its first exercise
✓ src/components/workout/workout-session.test.ts > workoutReducer > moves the rest by ±15 seconds, and ends it
✓ src/components/workout/workout-session.test.ts > workoutReducer > adds a set copying the last one's values
✓ src/components/workout/workout-session.test.ts > workoutReducer > cycles a set's type
✓ src/components/workout/workout-session.test.ts > workoutReducer > counts the time trained without the pauses
✓ src/components/workout/workout-session.test.ts > toSessionInput > sends every exercise, the ticked sets only, in kilograms, with the time trained
✓ src/components/workout/workout-session.test.ts > toSessionInput > sends pounds as kilograms
✓ src/lib/pending-sessions.test.ts > sendPendingSessions > takes off the queue what the backend has or will never take, and keeps the rest
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > shows the first exercise with its sets, filled with the targets, under their column titles
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > ticks a set, which starts the rest timer, and keeps it on the phone
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > goes to the next exercise, and to any one through its dot; the last offers to finish
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > offers to finish once every set is ticked
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > pauses with ✕ and goes back to the plan, the workout kept
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > finishes early: says what will not be saved, sends the workout, opens the plan saying it is saved
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > keeps a finished workout on the phone when the network is down
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > says so for a workout that is not on this phone
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > starts a workout of the open day, with last time's sets, and opens workout mode
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > offers to resume a workout in progress, and does not start another
✓ src/pages/PlanDetailPage.test.tsx > PlanDetailPage > says a workout was saved when workout mode comes back
Test Files  4 passed (4)
     Tests  35 passed (35)
```

Two techniques new in this screen:

- **Time chosen by the test.** The reducer's tests never read the clock: `START` is a fixed moment and `at(60)` is 60 seconds later, so the rest left at `at(100)` is exactly 50. The page's tests, which do run the real clock, start the workout with `now: new Date()` and only check what does not depend on the second (the timer shows 1:30 right after the tap, thanks to H3.15.5).
- **`localStorage` read back in a test:** `loadActiveSession()` after a tap proves the workout was written to the phone, as a reload would find it. `src/test/setup.ts` empties `localStorage` after each test.

**Proving they can fail.** Three lines broken on purpose, then put back:

| Line changed | Tests that failed |
|---|---|
| The effect `storeActiveSession(session)` removed | `ticks a set, which starts the rest timer, and keeps it on the phone`: the workout on the phone still had set 3 not done |
| `addPending()` removed from Finish | `finishes early: …` and `keeps a finished workout on the phone when the network is down`: nothing was sent, nothing was queued |
| `supersetOf()` returning `[index]` (supersets ignored) | `moves through a superset with no rest, then rests and goes back to its first exercise` |

**The build:**

```sh
npm run build
```

```
dist/assets/index-asoYRVKR.js                              921.01 kB │ gzip: 285.99 kB
✓ built in 1.74s
```

24 kB more than after the plan editor ([C1.11](../concepts/C1-frontend.md#c111-known-limits)).

### H3.15.7 Checking in the browser and on a phone

With `make start`, signed in, at http://localhost:5673/plans, open a plan with exercises:

- **Start:** on a day's tab, **Start this day**. Workout mode opens full screen: the day's name, the clock running, the first exercise, its sets filled with the plan's targets. In DevTools → Application → Local storage, the key `atleoplan.activeSession` appears.
- **A set:** tap ✓ on a set: it turns green, the rest bar appears at the bottom with the time left. **+15**, **−15**: the time moves. Let it end: two beeps, the bar goes. With the sound on and the volume up.
- **The numbers:** above the sets, the titles Set, Last, kg, Reps, each above its column. With two warm-ups the rows read W, W, 1, 2, 3; tap a "1" to make it a warm-up: it becomes W and the numbers after it move up.
- **A value that does not read:** clear a set's reps: its ✓ is disabled.
- **Finishing:** on the last exercise, **Finish workout** stands where Next was. Tick every set: a box says **All sets done.** with the same button. **Finish** at the top, with sets left, says how many will not be saved; **Keep going** closes the question.
- **Supersets:** on a plan with a superset, tick a set of its first exercise: the screen moves to the second with no rest; tick there: the rest starts and the screen goes back to the first.
- **Pause:** ✕ goes back to the plan, with the banner "Workout in progress" and **Resume**; Start is disabled. **Resume** (or a reload of the workout's page): the sets ticked are still ticked, and the clock did not count the pause.
- **Finish with no network:** DevTools → Network → **Offline**, then **Finish**, **Finish and save**: the plan's page says the workout will be sent when online (since FEAT-4 the summary says it, [H3.17](#h317-the-summary-and-history-as-built)), and `atleoplan.pendingSessions` holds it. Back **Online** (No throttling): the `online` event sends it; the Network tab shows `PUT /api/sessions/<id>` with 201, and the key disappears. In TablePlus ([H4](H4-database-tools.md)), the workout is in `workout_sessions`, its exercises in `session_exercises`, its sets in `logged_sets`.
- **On a phone** (where the screen staying on and the vibration can be seen): an Android phone plugged in by USB opens the development app at `localhost:5673` through adb's port forwarding (`make phone`); how, and what to check there: [H3.8.2](#h382-a-real-android-phone-over-usb). Without a phone, Chrome's device mode ([H3.8.1](#h381-phone-tablet-and-desktop-widths)) shows the layout, but not the wake lock and the vibration.

### H3.15.8 Second pass: what was not clear on screen

The first try of the screen in the browser brought two remarks: **the numbers inside an exercise were not clear**, and **there was no way to complete the day, or to stop early**. All the tests passed; both were real. Tests check what the code does, not whether a person understands it.

**The numbers.** Each row showed a number, "80×8", then two boxes, "80" and "8", and ✓. The titles above the rows were only Set and Last: which box was the weight and which the reps was left to guess. The boxes had a name, but only for screen readers (`aria-label="Set 3, kg"`). And the rows were numbered by position: the bench press, with two warm-ups, read W, W, 3, 4, 5, 6.

- `SetHeader`, in `SetRow.tsx`, draws a title for every column. To keep the titles above their columns, the header and the rows get their fields from one function, `fieldsFor(loggingType, unit, t)`, and use the same widths: `w-12` for the number (the 48 px button), `w-16` for Last, `flex-1` for each field, `w-12` for ✓. Two lists written by hand would drift apart the day a field is added.
- `setNumbers(sets)`, in `workout-session.ts`, counts warm-ups apart: W, W, 1, 2, 3, 4, as D1.4.9 draws. The names for screen readers follow ("Set 1, kg", "Warm-up 2, kg", "Tick: Set 1"), so a person who sees and a person who listens count the same way.

**Finishing.** The only way was a small "Fine" (Italian for Done) at the top right, which reads as "end" but not as a button to press; on the last exercise, Next was simply greyed out. Now:

- the top button says **Finish** (**Concludi**);
- on the last exercise **Finish workout** takes Next's place, where the thumb already is;
- once every set is ticked, a box says **All sets done.** with **Finish workout**;
- the three open the same confirmation (`FinishButton`, with a `label` and a `className`), which counts the sets with `countSets()`: "1 of 7 sets done, warm-ups excluded. The 6 sets not ticked will not be saved." Its button says **Finish and save**: what it does, and not the same word as the button that opened it.

The texts changed in the four languages (`workout.done`, `tick`, `untick`, `finishText_one`/`_other`, `finishConfirm`) and seven are new (`setName`, `warmUpName`, `typeButton`, `finishWorkout`, `allDone`, `finishLeft_one`/`_other`). Then the tests: the names they looked for ("Tick set 3", "Done") were changed to the new ones, and three tests were added (the column titles and numbers, Finish workout on the last exercise, the All sets done box). The first run found one mistake, in the expected numbers:

```
AssertionError: expected { done: 1, total: 7 } to deeply equal { done: 1, total: 6 }
```

Day A has 4 bench sets that count, **2** rows (not 1) and 1 pull-up: 7. The code was right, the expectation wrong.

**Proving the new tests can fail:**

| Line changed | Tests that failed |
|---|---|
| `setNumbers()` numbering by position again | four: `counts warm-ups apart…`, `shows the first exercise… under their column titles`, `ticks a set…`, `finishes early…` (no "Set 1" to find) |
| Next kept on the last exercise | `goes to the next exercise… the last offers to finish`: `expect(element).not.toBeInTheDocument()`, Next still there |

**What was not checked:** the screen itself, in a browser. An automatic look at the page at a phone's width (Playwright, with the API faked) was planned, but reaching the development server from the assistant's tools was not allowed in this session; [H3.15.7](#h3157-checking-in-the-browser-and-on-a-phone) lists what to look at by hand.

### H3.15.9 Third pass: exercises without kg, and margins

Two more remarks, from someone who trains with calisthenics: **what about exercises without kg** (pull-ups, dips, mostly with the body alone, sometimes with a belt and a plate), and **more margin around the screens, on phones too**.

**First, what the data said.** A question to the database, read only, through Tinker ([H1.7](H1-database.md#h17-looking-at-the-data)): how are the library's bodyweight exercises logged?

```sh
docker compose exec -T backend php artisan tinker --execute '…the public exercises whose English name has pull, chin, dip, push-up…, with logging type and equipment'
```

```
reps         Body weight    Chin-Up
reps         Body weight    Dips - Triceps Version
reps         Body weight    Pullups
reps         Body weight    Pushups
…
weight_reps  Machine        Dip Machine
TOTAL 102 reps / 876
```

The import already logs "body only" exercises by reps ([H1.12](H1-database.md#h112-the-free-exercise-db-import-as-built)), so pull-ups showed a Reps column and no kg. Two cases were left out, and the user chose to cover both:

| Case | Before | Now |
|---|---|---|
| A weighted pull-up or dip | no way to write the plate: the backend refused any weight on a `reps` exercise | a **+kg** column, the added weight, empty for the body alone |
| Lunges without dumbbells, on a weighted exercise | ✓ disabled until a weight was typed (0 worked, awkwardly) | the kg may stay empty |

**The backend first**, since it refused both. In `SaveSessionRequest`, one list (`VALUES_BY_LOGGING`, "the fields each way of logging must fill") became two: `REQUIRED_BY_LOGGING` (reps for `weight_reps` and `reps`) and `OPTIONAL_BY_LOGGING` (`weight_kg` for both). The after-check now refuses a missing required field, and a filled field that is in neither list. The tests' table of refusals changed with it (no weight is no longer an error; no reps is), the Italian message test moved to a timed exercise, and one test was added: a lunge with no weight, a pull-up with none and one with +10 kg, then the list's volume.

```sh
docker compose exec -T backend php artisan test --filter=SaveSessionApiTest
```

```
✓ it asks for the values that fit how the exercise is logged, and onl… (×4)
✓ it takes the weight as optional: none for the body alone, an added…
✓ it accepts a timed set with its time alone
Tests:    18 passed (69 assertions)
```

The volume needed no change: the database sums `weight_kg * reps`, and a `null` weight makes that product `null`, which `sum()` skips. The +10 kg × 6 counts 60 kg; the body's own weight is unknown and counts nothing ([D2.8](../design/D2-decisions.md#d28-workout-rules)).

**Then the screen,** in three places:

- `canComplete()`: for `weight_reps` and `reps`, the reps must read; the weight may be empty, and when typed must read (`"8o"` keeps ✓ disabled).
- `fieldsFor()` in `SetRow.tsx`: `reps` gets two fields, **+kg** and **Reps**. Each field now has a `label` (the column's title, `+kg`) and a `spoken` name (`added weight, kg`: "+kg" read aloud means little), and a `–` placeholder where it may stay empty.
- `toSessionInput()`: the weight goes with both ways of logging, `null` when empty. The Last column writes `+10×6`, or `12` with no weight.

A new text in four languages, `workout.addedWeight` ("zavorra, {{unit}}" in Italian).

**The margins.** The app's pages already have them, from `AppLayout`: `px-5` (20 px) on a phone, `sm:px-8` from 640 px, a column at most `max-w-5xl` on a laptop. Workout mode is outside that frame ([H3.15.2](#h3152-a-route-outside-the-frame)) and had its own: 16 px in the middle, 8 px on the bars, and no maximum width, so on a laptop the fields of a set were a whole screen wide. Now a single list of classes, `WORKOUT_COLUMN` in `src/components/workout/layout.ts`:

```ts
export const WORKOUT_COLUMN = 'mx-auto w-full max-w-2xl px-5 sm:px-8'
```

is used by the four parts, each drawing its border as wide as the screen and its content inside the column:

```tsx
<header className="border-b pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
  <div className={cn(WORKOUT_COLUMN, 'flex items-center gap-2')}>
    …
```

`cn()` joins the column's classes with the part's own. One constant rather than the same classes copied four times: a later change of margin is one line, and the four parts cannot drift apart. `npx eslint --fix` then re-indented the JSX inside the new `<div>`s.

**Tests and failures on purpose.**

```sh
npx vitest run src/components/workout src/pages/WorkoutPage.test.tsx src/i18n
```

```
Tests  32 passed (32)
```

New: `ticks a set with no weight: the body alone, or no added weight`, `sends an empty weight as none, and the added weight of a pull-up`, a weight that does not read, and, on the page, the **+kg** title and the field `Set 1, added weight, kg` on the pull-ups.

| Line changed | Tests that failed |
|---|---|
| The weight required again in `canComplete()` | three: the new one, `sends an empty weight as none…`, and `moves through a superset…` (its pull-up had no weight) |
| The weight sent only for `weight_reps` | `sends an empty weight as none…`: `expected { …(7) } to match object { weight_kg: 10, reps: 6 }` |
| The backend's `'reps' => []` (added weight refused again) | `it takes the weight as optional…`: `Expected response status code [201] but received 422.` |

**Not checked:** the margins and the new column on a real screen ([H3.15.7](#h3157-checking-in-the-browser-and-on-a-phone)): open workout mode at 375 px and on a laptop, and a day with pull-ups: +kg, Reps, an empty +kg ticked.

### H3.15.10 Fourth pass: looking at the screen for real

After H3.15.9 the verdict was blunt: **the desktop view broken, the phone view senseless**. Every test passed, again: tests find buttons by their names, and do not see that a button sticks out of the screen or that three of them shout at once. The first three passes had been checked by tests only ([H3.15.8](#h3158-second-pass-what-was-not-clear-on-screen)); this time the screen was photographed.

**Photographing a screen without the server.** The assistant could not open the development server, but Playwright's copy of Chrome was on the Mac (`~/Library/Caches/ms-playwright/chromium-1248/`), and Chrome can take a screenshot by itself. The steps, worth repeating whenever a layout must be checked at several widths:

1. A **temporary page** in `frontend/preview-tmp/`: an `index.html`, and a `main.tsx` that draws the real `WorkoutScreen` with a workout made by `startSession()` from the tests' plan (`src/test/plan-helpers.ts`), a signed-in user put straight into the query cache (`queryClient.setQueryData(authKeys.user, user)`), a memory router, the theme, Italian. A `?state=` in the address picks the moment: start, pull-ups resting, every set ticked. No API, no database.
2. **Built as static files** with its own Vite config: `npx vite build --config preview-tmp/vite.config.ts`, with `base: './'` so the files work opened from disk.
3. **Photographed** with Chrome without a window:

```sh
"…/Google Chrome for Testing" --headless=new --allow-file-access-from-files --hide-scrollbars \
  --window-size=1280,800 --virtual-time-budget=4000 --screenshot=start-1280.png \
  "file://…/preview/preview-tmp/index.html?state=start"
```

`--allow-file-access-from-files` lets a page opened from disk load its JavaScript modules; `--virtual-time-budget` waits for React to draw.

4. The folder deleted afterwards (`rm -r frontend/preview-tmp`).

**Two traps met on the way.**

- **The first photo had no style at all:** plain text, no columns, no buttons. The cause was the preview, not the app: Tailwind's Vite plugin looks for class names in the files under Vite's `root`, and the first config set `root` to `preview-tmp/`, so it never saw `src/` and generated almost no classes. With `root` set to `frontend/` (the page given as `build.rolldownOptions.input`) the classes came back. To be sure the real app did not have the same problem, `npm run build` showed its CSS at its usual size: `index-….css 82.89 kB`.
- **A window of 390 px is not a phone of 390 px:** Chrome without a window keeps a minimum width of about 500 px, and the screenshot was only cut to 390. The fix is a page holding `<iframe width="390">`s side by side: each frame is truly 390 px wide, and one photo compares three phones (360, 375, 390 px).

**What the photos showed** at 390 px:

- at the bottom, **Finish workout ran off the right edge** of the screen: "Precedente" and "Concludi l'allenamento" side by side need about 380 px, and the bar has 350;
- on the last exercise with every set ticked, **three lime buttons at once**: Finish at the top, the "All sets done" box, Finish workout at the bottom. Three ways of doing the same thing, all shouting, made the screen read as nonsense.

On a laptop the screen itself was fine, but the same three buttons were there.

**The fix: one lime button at a time.**

- Finish at the top becomes **outlined** (`variant="outline"`, a new prop of `FinishButton`): still there to stop early, no longer the next thing to do.
- The "All sets done" box is gone, with its text `workout.allDone`.
- The bottom bar shows **Finish workout** when it is time, on the last exercise **or** once every set is ticked (`finishTime` in `WorkoutScreen`), as wide as the bar (`flex-1`); Previous then shrinks to its arrow (`size="icon-xl"`, with its name kept in `aria-label` for screen readers).

The page's test of the box became `offers to finish at the bottom once every set is ticked, on any exercise`: the first exercise shows Next; the same workout with every set ticked, drawn again (`cleanup()` removes the first drawing), shows Finish workout instead.

```
Tests  32 passed (32)
```

The photos again, at 360, 375 and 390 px and at 1280 px: nothing leaves the screen, the columns sit under their titles, one lime button. At 360 px a long day name is cut with "…", which is what `truncate` is for.

**The lesson:** a screen is not done when its tests pass. Whatever the tests cannot see (size, overlap, emphasis) needs a look at the narrowest phone and at a laptop, by hand ([H3.8.1](#h381-phone-tablet-and-desktop-widths)) or with screenshots as above, before saying it is finished.

### H3.15.11 Fifth pass: wide on a laptop, an app on a phone

H3.15.9 and H3.15.10 had read "more margin around the screens" as "a narrower, centred column". The answer: **before, the laptop view was wide and comfortable, and the phone view was like an app; now the laptop view is cramped, and the phone view has to be scrolled.** Both true, and both caused by H3.15.9.

**Measuring instead of guessing.** The temporary preview of H3.15.10 was built again, with a few lines at the end of its `main.tsx` that write the page's real sizes into the page after it is drawn:

```ts
setTimeout(() => {
  const root = document.documentElement
  const main = document.querySelector('main')!
  // … into a <pre id="measure">
  `viewport ${innerWidth}x${innerHeight} | page ${root.scrollWidth}x${root.scrollHeight} | main visible ${main.clientHeight} content ${main.scrollHeight} | …`
}, 1500)
```

Chrome's `--dump-dom` prints the page's HTML once drawn, so a small script loaded each state in an `<iframe>` of a phone's size (375×667, an iPhone SE; 390×844; 1280×800) and printed the line. With H3.15.9's layout:

```
start 375x667: viewport 375x667 | page 375x693 | main visible 521 content 644 | sideways false | page scrolls true | middle scrolls true
rest 390x844:  viewport 390x844 | page 390x844 | main visible 607 content 644 | sideways false | page scrolls false | middle scrolls true
```

**The page 26 px taller than the screen** was the real bug: the whole page scrolled, bars included, which is what makes a web page stop feeling like an app. Nothing visible was that tall; the culprit was invisible. The `<p className="sr-only">` that reads "Rest over" to screen readers is, in Tailwind, `position: absolute` and 1 px wide. An absolutely positioned element is placed against its nearest *positioned* ancestor; `main` was not one, so the text was placed against the page, at the spot where it would have been in the flow: after the last set, below the bottom of a long exercise. The browser then made the page tall enough to hold it. `relative` on `main` makes `main` its reference: the text now sits inside the scrolling middle, and the page is exactly the screen.

**The width.** `max-w-2xl mx-auto` had put the laptop view in a 672 px column. Gone: `WORKOUT_COLUMN` is now only the side margins, `w-full px-4 sm:px-6`, the window's whole width as before. The vertical spacing went back to the first version's (`py-3` in the middle, `pt-2`/`pb-2` on the bars), which also gave back the room H3.15.9 had taken.

After:

```
start 375x667:  viewport 375x667 | page 375x667 | main visible 537 content 616 | … | page scrolls false | middle scrolls true
rest 390x844:   viewport 390x844 | page 390x844 | main visible 623 content 623 | … | page scrolls false | middle scrolls false
rest 1280x800:  viewport 1280x800 | page 1280x800 | … | page scrolls false
```

The page never scrolls; the middle scrolls only on a short phone with a six-set exercise and the rest timer open, the bars staying put, as in any app.

**Two lessons.** When a request is vague ("more margin"), ask what it should look like, or show a screenshot before and after, rather than redesign. And `sr-only` (and anything `absolute`) inside a scrolling area needs a positioned parent, or it can stretch the page from where nobody can see it.

### H3.15.12 Sixth pass: the app's margins and buttons

Two last remarks: **no margin left and right** ("a little, not too much"), and **buttons in line with the rest of the app**.

**Margins.** H3.15.11 had set `px-4 sm:px-6`: 16 px on a phone, and only 24 px on a laptop, where it reads as none. The other pages already have an answer, in `AppLayout`: `px-5 sm:px-8 lg:px-12`. `WORKOUT_COLUMN` now uses exactly those, still with no maximum width:

```ts
export const WORKOUT_COLUMN = 'w-full px-5 sm:px-8 lg:px-12'
```

**Buttons.** Counting how the pages use `<Button>` showed the app's habit:

```sh
grep -rhoE '<Button[^>]*' src/pages src/components | grep -oE 'variant="[a-z]+"|size="[a-z-]+"' | sort | uniq -c | sort -rn
```

```
  46 size="xl"
  29 variant="outline"
   9 variant="ghost"
   5 size="icon-xl"
   2 variant="destructive"
```

Actions are 48 px tall (`xl`), lime (`default`) for the main one, **outlined** for the others; `ghost`, with no border, is for icons and small things. The plan editor's Add set, for one, is `variant="outline" size="xl"`. Workout mode had Previous, Next, Add set and Skip as `ghost`: plain words floating on the page, unlike anywhere else. They are now `outline`; the arrow alone of Previous too. Lime stays for Finish workout only, so the one lime button still says "this is next" ([H3.15.10](#h31510-fourth-pass-looking-at-the-screen-for-real)); ✕ and a set's number stay plain, as icons.

The temporary preview of H3.15.10 photographed the result at 390 px and at 1280 px before it was deleted; the tests find buttons by name, so they did not change:

```
Tests  165 passed (165)
```

### H3.15.13 Seventh pass: a button as wide as a laptop

"Finish workout on the last exercise is gigantic (in the browser)." H3.15.10 had given it `flex-1`, so that on a phone it takes the room left by Previous; on a laptop the same class stretched it across 1100 px.

Tailwind's breakpoints solve it in the class list itself. A class with no prefix applies at every width; `sm:` from 640 px up; `max-sm:` only **below** 640 px:

```tsx
<FinishButton … className="min-w-0 flex-1 sm:flex-none" />

<Button variant="outline" size="xl" className={cn('px-4', finishTime && 'max-sm:px-3.5')} …>
  <ChevronLeft aria-hidden="true" />
  <span className={cn(finishTime && 'max-sm:sr-only')}>{t('workout.previous')}</span>
</Button>
```

- `flex-1 sm:flex-none`: the whole bar on a phone; from 640 px, the button's own width, pushed right by the bar's `justify-between`.
- `max-sm:sr-only` on Previous's word: hidden on a phone only when Finish workout needs the room, still read by screen readers; on a laptop, arrow and word as usual. One button instead of the two of H3.15.10 (an icon-only one and a worded one), so the two cases cannot drift apart.

Checked with the temporary preview, on the last exercise at 375 × 667 and 1280 × 800, then deleted; the page's tests still pass (`Tests 8 passed (8)`).

### H3.15.14 Eighth pass: some breathing room

"Too compact, in the browser, on a tablet and on a phone: give it some room, not too much." H3.15.11 had tightened the vertical spacing to fit a six-set exercise on a 390 × 844 phone without scrolling the middle; the result read as cramped.

Spacing now grows with the screen, with the `sm:` prefix of [H3.15.13](#h31513-seventh-pass-a-button-as-wide-as-a-laptop) (from 640 px):

| Where | Before | Now |
|---|---|---|
| Between the rows of sets | `gap-1` (4 px) | `gap-2 sm:gap-3` (8, 12 px); the same inside a row and in its header, so the titles stay above their columns |
| The middle, top and bottom | `py-3` | `py-5 sm:py-6` |
| Under the dots, under the exercise's name, above Add set | `mb-3`, `mb-4`, `mt-3` | `mb-5`, `mb-6`, `mt-4` |
| Top bar, bottom bar | `pt-2`/`pb-2` | `pt-3`/`pb-3`, `sm:` 16 px; still at least the phone's safe areas |
| Rest bar | `py-3` | `py-4` |

"Not too much" was measured, with the preview's sizes of [H3.15.11](#h31511-fifth-pass-wide-on-a-laptop-an-app-on-a-phone), on the bench press (six sets) with the rest timer open. A first try with more room from 640 px (`sm:py-8`, `sm:mb-8`, a taller rest bar) made the middle of a 1280 × 800 laptop scroll by 213 px; trimmed back:

```
375x667:  page 375x667   | middle visible 418 content 680 | page scrolls false
390x844:  page 390x844   | middle visible 595 content 680 | page scrolls false
820x1180: page 820x1180  | middle visible 915 content 915 | page scrolls false
1280x800: page 1280x800  | middle visible 535 content 708 | page scrolls false
```

The page itself never scrolls; on a phone and a laptop a long exercise scrolls in the middle, the bars staying put, which is the trade for the room. The preview was deleted afterwards.

### H3.15.15 Ninth pass: supersets with uneven sets

Found while training (during FEAT-4): **"On the last exercise the ticks are strange: sometimes I tap the first one, and they all switch on."**

**The cause.** Two of the demo plan's days (`make plans-demo`) end with a superset: Day A's lateral raises and pushdowns, Day C's leg curls (3 sets) and calf raises (4 sets). The rule of [C1.17.3](../concepts/C1-frontend.md#c1173-the-workout-and-its-reducer) said: after a set of the superset's last exercise, rest and go back to its first exercise, for the next round. So:

- a tap on the calf raises' set 1 moved the screen to the leg curls, whose sets ticked earlier are green: it looked as if the tap had ticked a whole exercise;
- after the leg curls' third and last set, the screen went to the calf raises and back to the leg curls even with nothing left to do there, and the calf raises' fourth set sent the screen back to leg curls all done.

Nothing was ticked by mistake (the workout on the phone had the right sets); the screen moved where there was nothing to do, and said nothing about why.

**First, a test that fails** (`workout-session.test.ts`): on the test plan's Day A, the rows (2 sets) and the pull-ups (1 set) are a superset. Round 1, rows then pull-ups, then round 2's rows: the screen must stay on the rows, since the pull-ups are done; then one more set of pull-ups, ticked, must stay on the pull-ups.

```sh
npx vitest run src/components/workout/workout-session.test.ts
```

```
     × in a superset, never moves to an exercise with nothing left to do
- Expected
+ Received

- 1
+ 2

 ❯ src/components/workout/workout-session.test.ts:186:28
      Tests  1 failed | 16 passed (17)
```

The screen went to exercise 2, the pull-ups, with nothing to do.

**The fix,** in `workoutReducer`'s `toggleSet`: "next" and "first" count only exercises with a set still to tick (since H3.15.16 the screen no longer moves at all; the same rule chooses where Next points):

```ts
const hasWork = (index: number) => next.exercises[index]?.sets.some(candidate => !candidate.done) ?? false
const following = group.slice(place + 1).find(hasWork)
if (following !== undefined) {
  next.current = following                        // the round goes on, no rest
  next.rest = null
}
else {
  next.current = group.find(hasWork) ?? action.exercise   // next round, or stay
  next.rest = …                                   // the round is over: rest
}
```

`slice(place + 1)` is the part of the superset after this exercise; `find()` gives the first that has work, or `undefined`. A superset whose exercises have different numbers of sets now ends a round early instead of showing a finished exercise, and when nothing is left the screen stays on the exercise just ticked.

**Saying why the screen moves:** under the exercise's name, in lime, "Superset: " and the superset's exercises joined by " + " (`workout.superset`, "Superserie" in Italian, as on the plan's page), the names from `supersetOf()`. The page's test checks it on the pull-ups: `Superset: Bent Over Barbell Row + Pullups`.

**Proving it can fail:** `group.find(hasWork)` put back to `group[0]`, the old rule:

```
     × in a superset, never moves to an exercise with nothing left to do
      Tests  1 failed | 16 passed (17)
```

```
 Test Files  27 passed (27)
      Tests  202 passed (202)
```

**To check it in the browser:** Day C of Push Pull Legs, go to the leg curls, tick a set: the screen moves to the calf raises, "Superset: …" under the name. Tick there: rest, back to the leg curls. After the third round, the calf raises' fourth set keeps the screen on the calf raises.

### H3.15.16 Tenth pass: the screen never moves by itself

After H3.15.15: **"No, the last page still breaks."** H3.15.15 had stopped the jumps to an exercise with nothing left; the jump itself stayed.

**Seen in the preview** ([H3.15.10](#h31510-fourth-pass-looking-at-the-screen-for-real)), with a copy of the demo plan's Day A (lateral raises and triceps pushdowns in a superset, last), and a few lines at the end of the preview's `main.tsx` that tap buttons by their `aria-label`, one every 400 ms, then write what is on screen:

```
clicked Exercise 5: Triceps Pushdown; clicked Tick: Set 1 || now on: Lateral Raise || Tick: Set 1=false, Tick: Set 2=false, Tick: Set 3=false
```

A tap on the pushdowns' first ✓ replaced the whole screen: the lateral raises, none ticked, the rest bar, and Next where Finish workout was. The set just ticked was out of sight. That is the rule D1.4.9 asked for ("the view moves to B by itself"), and on a phone it reads as the page breaking.

**The choice** (asked, since it changes the design): the screen never moves by itself; in a superset the bottom bar names the exercise to go to, "Next: Lateral Raise", and one tap goes there. The rest still starts only at the end of a round.

**The steps:**

1. **The tests first** (`workout-session.test.ts`): the two superset tests now say that `current` does not change after a tick, that the rest starts only at the end of the round, and where `supersetNext()` points: to the pull-ups after the rows, back to the rows after the pull-ups, nowhere when the other exercise is done.
2. **`supersetNext(session, index, scope)`** in `workout-session.ts`: the next exercise of the round with a set left; at the end of a round, the first with a set left; `null` otherwise. `'round'` stops at the end of the round.
3. **The reducer** no longer sets `current` on a tick; it starts the rest when `supersetNext(next, index, 'round')` is `null`.
4. **The bottom bar** (`WorkoutScreen`): when `supersetNext()` points somewhere, the right-hand button is "Next: <name>" (`workout.nextIn`), outlined with a lime border, across the bar on a phone, the name cut with "…" when long; Finish workout waits until the superset has nothing left.
5. **The page's test** (`WorkoutPage.test.tsx`): on the pull-ups, the bar says "Next: Bent Over Barbell Row" instead of Finish workout; a tick leaves the pull-ups on screen, the set pressed, the rest started; the button opens the rows.

```
 Test Files  27 passed (27)
      Tests  202 passed (202)
```

**The preview again,** the same taps, then a whole round:

```
clicked Exercise 5: Triceps Pushdown; clicked Tick: Set 1; clicked Next: Lateral Raise; clicked Tick: Set 1; clicked Next: Triceps Pushdown; clicked Tick: Set 2 || now on: Triceps Pushdown || Untick: Set 1=true, Untick: Set 2=true, Tick: Set 3=false
```

**To check it in the browser:** Day A of Push Pull Legs, the triceps pushdowns (the last exercise): tick set 1. The screen stays, the set lime, the rest running, and the bar says "Next: Lateral Raise". Tap it, tick there: no rest (the round goes on), "Next: Triceps Pushdown".

## H3.16 Home, as built

The third part of FEAT-3: Home shows the active plan with the suggested day and **Start**, a chip per day, **Resume** for a workout left open, **Free workout**, and this week's days and numbers. How it works is in [C1.18](../concepts/C1-frontend.md#c118-home); this section is the doing, with the real output. What it shows that the earlier screens do not: one hook shared by two pages, `fetchQuery()` to read data in a click rather than while drawing, and dates worked out in the device's time zone.

| File | What it is |
|---|---|
| `src/api/home.ts` (new) | The types of `GET /api/home`, `homeKeys`, `useHome()` |
| `src/api/plans.ts` | `fetchPlan()` taken out of `usePlan()`; `refreshPlans()`, which marks Home stale after any change to a plan |
| `src/api/sessions.ts` | `exercises_done` in `WorkoutSession` |
| `src/components/workout/useStartWorkout.ts` (new) | Starting a workout: `startDay()`, `startPlanDay()`, `startFree()` |
| `src/components/workout/ResumeBanner.tsx` (new) | "Workout in progress", Resume |
| `src/components/workout/workout-session.ts` | `startFreeSession()`, `exerciseFrom()`, the action `addExercises` |
| `src/components/workout/WorkoutScreen.tsx` | "Free workout" as title, the empty screen, Add exercises, Home marked stale at Finish |
| `src/components/home/ActivePlanCard.tsx` (new), `week-summary.ts` (new) | The card; this week's numbers |
| `src/components/home/WeekStrip.tsx`, `WeekStats.tsx` | The days trained; the real numbers (the volume became minutes in FEAT-4, [H3.17.6](#h3176-second-pass-no-total-volume)) |
| `src/lib/week.ts` | `isInWeek()` |
| `src/lib/usePendingSessions.ts` | `homeKeys.all` instead of the written-out `['home']` |
| `src/pages/HomePage.tsx`, `PlanDetailPage.tsx` | Home rebuilt; the plan's page using the shared hook and banner |
| `src/i18n/locales/*.json` | 18 keys under `home.*`, 5 under `workout.*`, `home.statVolume` with the unit |
| 5 test files, 14 new tests | `HomePage.test.tsx` (new, 7), `week-summary.test.ts` (new, 2), `week.test.ts` (1), `workout-session.test.ts` (2), `WorkoutPage.test.tsx` (2) |

No package was added and the backend did not change: `GET /api/home` was built with the API ([H2.14](H2-backend.md#h214-the-workouts-api-as-built)).

### H3.16.1 The order of building

1. **Read the answer first.** `GET /api/home` is described, with a real answer, in [C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints) and in the header of `backend/app/Actions/Workouts/HomeSummary.php`. Its types in `api/home.ts` copy it field by field. The days come without exercises: that decided step 2.
2. **The shared hook,** by moving the steps out of the plan's page's `StartDayButton` into `useStartWorkout.ts`, then the plan's page using it. Its tests (`PlanDetailPage.test.tsx`) passed unchanged: the move changed nothing a user sees, which is what they proved.
3. **The free workout,** in `workout-session.ts` with its tests, then on the workout screen.
4. **The week,** `isInWeek()` and `weekSummary()` with their tests, then the strip and the numbers.
5. **The card, the page,** the translations, the page's tests.
6. **Photos** of the page at a phone's, a tablet's and a laptop's width (H3.16.4), as in [H3.15.10](#h31510-fourth-pass-looking-at-the-screen-for-real).

### H3.16.2 One hook for two pages

Before, the plan's page started a workout in its own `StartDayButton`: `useNavigate`, `useCurrentUser`, a `useState` for "starting", `fetchLastSets()`, `startSession()`, `storeActiveSession()`, `navigate()`. Home needs the same steps. Copying them would make two places to fix the next time; a **custom hook** keeps them in one ([C1.18.2](../concepts/C1-frontend.md#c1182-starting-from-home-one-hook-for-two-pages)):

```tsx
// src/components/workout/useStartWorkout.ts
export function useStartWorkout(): StartWorkout {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const [starting, setStarting] = useState(false)
  …
  return { starting, failed, startDay, startPlanDay, startFree }
}

// in StartDayButton, what is left
const { starting, startDay } = useStartWorkout()
<Button disabled={busy || starting} onClick={() => void startDay(plan, day)}>
```

**Home has only the plan's id.** `startPlanDay(planId, dayId)` reads the whole plan with `queryClient.fetchQuery()`. It needs the same function `usePlan()` uses, so that function was taken out of the hook and exported:

```ts
// src/api/plans.ts
export function fetchPlan(id: string, signal?: AbortSignal): Promise<Plan> {
  return request<{ data: Plan }>(`/api/plans/${id}`, { signal }).then(answer => answer.data)
}
```

To see the cache at work: open a plan's page, go back to Home, tap Start. DevTools → Network shows `last-sets` only, no `GET /api/plans/…`: the plan came from the cache. After a reload of Home, Start asks for both.

**Keeping Home fresh.** Home's answer changes when a workout is saved and when a plan changes (made active, archived, deleted). Every hook of `api/plans.ts` now ends with `refreshPlans(queryClient)`, which marks both `planKeys.all` and `homeKeys.all` stale; `WorkoutScreen.finish()` and `usePendingSessions` mark `homeKeys.all` too. Try: make another plan active on its page, then open Home: the card shows it at once.

### H3.16.3 A workout with no plan

Free workout starts with no exercises, so the workout screen needed a way to add them, which planned workouts can use too:

- **`startFreeSession(now)`** returns the empty workout. `startSession()` now starts from the same `emptySession(now)`, adding the plan's day.
- **`exerciseFrom(exercise, lastSets, options)`** turns a library exercise into a workout exercise: one set per set of last time, else one empty set.
- **The action `addExercises`** receives exercises already built. A first idea was to pass the library's exercises and build them inside the reducer; but building makes UUIDs (`newId()`), and a reducer called twice with the same action must give the same result: StrictMode calls it twice in development to check ([C1.4](../concepts/C1-frontend.md#c14-react-from-scratch)).
- **On screen,** `ExercisePicker` is the plan editor's own, reused as is: `trigger` is the button that opens it, `onAdd` receives the exercises ticked. With no exercise yet, the screen shows only **Add exercises** and **Cancel workout**; `finishTime` was changed to be false with no exercise, otherwise an empty free workout offered **Finish workout** at once (`index >= total - 1` is `0 >= -1`, true).

### H3.16.4 The errors met

**The new texts, before the translations existed.** TypeScript knows every translation key (`src/i18n/i18next.d.ts`), so a key not yet in `en.json` is an error, not a blank on screen:

```sh
npx tsc -b --noEmit
```

```
src/components/workout/ResumeBanner.tsx(31,97): error TS2345: Argument of type '["workout.free"]' is not assignable to parameter of type …
      Type '"workout.free"' is not assignable to type '"nav.label" | "nav.progress" | … 324 more …'. Did you mean '"workout.resume"'?
src/components/workout/WorkoutScreen.tsx(220,70): error TS2345: Argument of type '["workout.emptyTitle"]' …
```

Expected: the keys were added to the four languages next, and the errors went. `locales.test.ts` checks that the four files have the same keys.

**A test reading the wrong neighbour.** The first test of the week's numbers looked for the number before its label, as it is drawn:

```
FAIL  src/pages/HomePage.test.tsx > HomePage > marks the days trained this week, with the week's numbers
Error: expect(received).toHaveTextContent()
received value must be a Node.
Received has type:  Null
 ❯ src/pages/HomePage.test.tsx:139:64
    139|     expect(within(week).getByText('Workouts').previousSibling).toHaveT…
```

`WeekStats` writes the label (`<dt>`) first and the number (`<dd>`) after it, and draws them the other way round with `flex-col-reverse`, so that screen readers read "Workouts, 2". In the page the number is the label's **next** sibling: `nextSibling` fixed the test.

**The photos.** The page was photographed with the temporary preview of [H3.15.10](#h31510-fourth-pass-looking-at-the-screen-for-real): `HomePage` inside the real `AppLayout`, Home's answer put in the cache with `queryClient.setQueryData(homeKeys.all, home)`, and `?state=` choosing an active plan, a workout in progress, no plan, or a free workout. Three things were found:

- **Dark text on a dark page, white buttons.** The preview's `index.html` lacked `class="dark"` on `<html>`, which the real `index.html` has (with its script that applies the saved theme before React starts). The colour tokens came out half dark, half light. A fault of the preview only; the real app was fine.
- **The chosen chip did not look chosen.** It had `border-primary bg-primary/10`, but the outline button carries `dark:border-input dark:bg-input/30`: in the dark theme the `dark:` classes win over the plain ones for the same property. The chosen look now repeats itself with `dark:` (`dark:border-primary dark:bg-primary/15`).
- **"9,640 kg" over two lines** in the volume's tile, a third of a phone's width (since FEAT-4 the tile shows minutes, [H3.17.6](#h3176-second-pass-no-total-volume)). The unit moved to the label ("Volume (kg)"), the number stays whole on one line (`whitespace-nowrap`).

The photos again at 375 px, 820 px and 1280 px: the chosen chip lime-bordered, the week's numbers on one line each, one lime button (Start; Resume when a workout is in progress, with Start disabled). The preview was deleted afterwards.

### H3.16.5 The tests, proving they can fail, and the build

```sh
npx vitest run src/pages/HomePage.test.tsx src/components/home src/lib/week.test.ts src/components/workout/workout-session.test.ts src/pages/WorkoutPage.test.tsx src/pages/PlanDetailPage.test.tsx --reporter=verbose
```

The new tests, among the older ones of those files:

```
✓ src/lib/week.test.ts > isInWeek > takes the moments from Monday at midnight to the end of Sunday
✓ src/components/home/week-summary.test.ts > weekSummary > adds up this week's workouts and marks each day trained once
✓ src/components/home/week-summary.test.ts > weekSummary > gives zeros for an empty week
✓ src/components/workout/workout-session.test.ts > startFreeSession and exerciseFrom > starts a workout with no plan and no exercises, its clock running
✓ src/components/workout/workout-session.test.ts > startFreeSession and exerciseFrom > adds exercises from the library: last time's sets when there were some, one empty set otherwise
✓ src/pages/HomePage.test.tsx > HomePage > shows the active plan with the suggested day, and starts it
✓ src/pages/HomePage.test.tsx > HomePage > chooses another day with its chip; Start then starts that one
✓ src/pages/HomePage.test.tsx > HomePage > says so when the plan cannot be read to start
✓ src/pages/HomePage.test.tsx > HomePage > offers to resume a workout in progress, and starts no other
✓ src/pages/HomePage.test.tsx > HomePage > starts a free workout, with no plan and no exercises
✓ src/pages/HomePage.test.tsx > HomePage > marks the days trained this week, with the week's numbers
✓ src/pages/HomePage.test.tsx > HomePage > offers to try again when Home cannot be read
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > starts a free workout empty, adds exercises from the library with last time's sets
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > cancels an empty free workout, keeping nothing
 Test Files  6 passed (6)
      Tests  55 passed (55)
```

- **Dates in the week's tests** are built with the local constructor, `new Date(2026, 10, 5, 18, 0)` (months from 0: 10 is November), as the app's own code builds them, so they pass in any time zone the computer is in.
- **The page's week test** uses workouts finished "now", which are always in this week, whatever day the tests run.

**Proving they can fail.** Two lines broken on purpose, then put back:

| Line changed | Tests that failed |
|---|---|
| `weekSummary()` keeping every workout, not only this week's | `adds up this week's workouts and marks each day trained once` |
| `startPlanDay()` starting the plan's second day whatever the chip | `chooses another day with its chip; Start then starts that one` |

```
     × adds up this week's workouts and marks each day trained once 6ms
     × chooses another day with its chip; Start then starts that one 42ms
      Tests  2 failed | 7 passed (9)
```

**The build:**

```sh
npm run build
```

```
dist/assets/index-BBr9FzfE.css                              84.57 kB │ gzip:  14.46 kB
dist/assets/index-DGIFdlnm.js                              933.46 kB │ gzip: 289.07 kB
✓ built in 532ms
```

12 kB more than after workout mode ([C1.11](../concepts/C1-frontend.md#c111-known-limits)).

### H3.16.6 Checking in the browser

With `make start`, signed in, at http://localhost:5673:

- **No active plan** (a new account): the empty state with **Create a plan** and **Browse exercises**, then Free workout, then the week with zeros and "No workouts yet this week".
- **An active plan:** `make plans-demo` adds two plans and makes Push Pull Legs the active one; then Home: the card shows its first day as **Suggested** (nothing was done yet), its exercises and minutes. Tap another day's chip: the card shows that one, the badge goes. **Start** opens workout mode on that day.
- **The suggestion moving on:** finish that workout (**Finish**, **Finish and save**), back to Home: the day after it is now **Suggested**, "Last time you did …" names the one just done, and today's circle in the week has a lime dot; the numbers count it. DevTools → Network shows `GET /api/home` read again after the save.
- **A workout left open:** start one, ✕: Home shows **Workout in progress** with **Resume**; Start and Free workout are disabled, with the reason under Start.
- **Free workout:** "Free workout" as the title, only **Add exercises** and **Cancel workout**. Add two exercises: the first opens, with last time's sets if they were done before. **Cancel workout** on an empty one goes back to Home and leaves nothing in `atleoplan.activeSession` (DevTools → Application → Local storage). Finished, a free workout comes back to Home, which says it was saved (since FEAT-4, through its summary first: [H3.17](#h317-the-summary-and-history-as-built)).
- **Without the network** (DevTools → Network → Offline): Free workout still starts. Start on a plan works when the plan was opened before (it is in the cache), else the card says the plan could not be loaded.
- **The widths:** Chrome's device mode ([H3.8.1](#h381-phone-tablet-and-desktop-widths)) at 375 px (one column: banner, card, Free workout, week), 820 px, and a laptop (the card and the week side by side from 1024 px).

## H3.17 The summary and history, as built

FEAT-4: after Finish, **the summary** shows what was done, compares each exercise with last time, asks how it felt and takes notes; **history**, under Progress, lists every workout and opens each one with its sets. How it works is in [C1.19](../concepts/C1-frontend.md#c119-the-summary-and-history); this section is the doing, with the real output. What it shows that the earlier screens do not: a screen drawn from data kept on the phone rather than from the server, sending the same workout twice on purpose, a redirect with `<Navigate>`, and grouping a paged list.

| File | What it is |
|---|---|
| `src/api/sessions.ts` | `useSessions()`, `fetchSession()`, `useSession()`, `deleteSession()`, `useDeleteSession()`; the types `SessionDetail`, `SessionExercise`, `SessionWithLastSets`, `SessionPage`; new fields of `WorkoutSession` (`reps_done` among them) |
| `src/pages/SummaryPage.tsx` (new) | The summary, at `/session/:id/summary` |
| `src/pages/HistoryPage.tsx`, `HistoryDetailPage.tsx` (new) | History at `/progress/history`, a workout at `/progress/history/:id` |
| `src/pages/ProgressPage.tsx` | The three latest workouts, All workouts, the "Coming soon" card for charts |
| `src/components/history/` (new) | `totals.ts`, `compare.ts`, `feeling.ts`, `WorkoutStats`, `ComparisonSummary`, `FeelingPicker`, `SessionRow`, `SessionExercises` |
| `src/components/workout/set-text.ts` (new) | `loggedSetText()`, taken out of `SetRow.tsx` to be shared |
| `src/components/workout/session-storage.ts` | `FinishedWorkout`, `storeFinished()`, `loadFinished()`, `WorkoutOutcome` |
| `src/components/workout/workout-session.ts` | `previous` on each exercise: last time's whole list of sets |
| `src/components/home/week-summary.ts`, `WeekStats.tsx` | Minutes instead of volume |
| `src/components/workout/WorkoutScreen.tsx` | Finish opens the summary |
| `src/pages/HomePage.tsx`, `PlanDetailPage.tsx` | Home says what happened after the summary, and links to history; the plan's page no longer does |
| `src/lib/format.ts` | `formatDuration()` |
| `src/router.tsx` | Three routes |
| `src/test/session-helpers.ts` (new) | Past workouts as the API sends them |
| `src/i18n/locales/*.json` | 16 keys under `summary.*`, 23 under `history.*`, 14 under `compare.*`, 4 under `progress.*`, `workout.deleted`, `home.history`, `home.statMinutes` (`home.statVolume` removed) |
| 7 test files, 23 new tests | `SummaryPage.test.tsx` (6), `HistoryPage.test.tsx` (7), `compare.test.ts` (6), `totals.test.ts` (2), `format.test.ts` (1), `HomePage.test.tsx` (1); two in `WorkoutPage.test.tsx` and two of Home's week changed |

The backend gained two things, last time before a workout for history's comparison and the reps in a workout's totals: [H2.14.9](H2-backend.md#h2149-later-last-time-before-a-workout-feat-4). No package was added.

### H3.17.1 The order of building

1. **The backend first** ([H2.14.9](H2-backend.md#h2149-later-last-time-before-a-workout-feat-4)), with its test: the frontend then had a real answer to copy its types from.
2. **`api/sessions.ts`:** the types of the list and of one workout, read from `WorkoutSessionResource` and `SessionExerciseResource`; the hooks, on the models of `useExercises()` (pages) and `usePlan()` (one).
3. **`set-text.ts`,** by moving `weightText()` and the "Last" text out of `SetRow.tsx`. The workout page's tests passed unchanged: the move changed nothing on screen.
4. **`session-storage.ts` and Finish:** the finished workout kept, the summary opened. The two tests of Finish were changed to expect the summary (H3.17.3).
5. **`totals.ts`, `compare.ts`, `formatDuration()`** and their tests.
6. **The components, the pages, the routes,** the translations, the pages' tests.
7. **Photos** of the four screens with the temporary preview of [H3.15.10](#h31510-fourth-pass-looking-at-the-screen-for-real): the summary at 375 and 1280 px, history and Progress at 375 px, a workout at 1280 px.

### H3.17.2 A screen drawn from the phone

Every screen so far read the server, or worked on a copy of its data (the plan editor's draft). The summary must show right after the last set, maybe with no network, so it reads what Finish left on the phone:

```tsx
// WorkoutScreen.finish(), at the end
storeFinished({ id: finished.id, input, outcome })
void navigate(`/session/${finished.id}/summary`, { replace: true })

// SummaryPage
const [finished] = useState(loadFinished)          // read once
if (finished === null || finished.id !== id) return <Navigate to={`/progress/history/${id}`} replace />
```

- **`<Navigate>`** is React Router's redirect as a component: drawing it changes the address. Here it handles the summary opened again after Save (the copy is gone), or on another phone: the workout's page in history shows the same workout, from the server.
- **`replace`** on both: Back from the summary does not return to a workout that is over, and Back from history does not bounce to a summary that redirects again.
- **Try it:** finish a workout, then DevTools → Application → Local storage: `atleoplan.finishedSession` holds it, with `"outcome": "saved"`. Save: the key is gone. Reload the summary's address: history's page of the same workout opens.

**Sending the same workout twice, on purpose.** Save adds the feeling and the notes, which did not exist at Finish. There is no endpoint to change them alone, and none is needed: `PUT /api/sessions/{id}` replaces a whole workout ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)), so Save puts the body back in the queue with the two answers and sends the queue. In DevTools → Network, after Save: a second `PUT /api/sessions/<id>`, answered 200 (not 201: the workout was already there), its body with `"feeling": 4`.

### H3.17.3 The errors met

**Finish's tests, expected to fail.** Finish used to open the plan's page; after the change, the first run of the whole suite:

```
     × finishes early: says what will not be saved, sends the workout, opens the plan saying it is saved
     × keeps a finished workout on the phone when the network is down
 Test Files  1 failed | 23 passed (24)
      Tests  2 failed | 179 passed (181)
```

Not a bug: the tests described the old behaviour. They now expect a stand-in for the summary (`{ path: 'session/:id/summary', element: <p>the summary</p> }`) and read the finished workout with `loadFinished()`. One of them no longer used the router it took from `renderRoutes()`, which `npx tsc -b` reported: `'router' is declared but its value is never read.`

**A file exporting a function and a component.** `feelingName()` first lived in `FeelingPicker.tsx`, and was imported by the workout's page:

```
src/components/history/FeelingPicker.tsx
  24:17  error  Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components
```

While developing, Vite swaps a changed component in the open page without a reload (fast refresh), and can only do so for a file that exports components alone. The function moved to `feeling.ts`.

**A button read as one word.** A feeling's button holds two `<span>`s, "4" and "Good". Screen readers, and Testing Library's `getByRole('radio', { name })`, join inline text without a space: "4Good". Each button has an `aria-label`, "4, Good".

**"52 mins" in Chrome, "52 min" in the tests.** `formatDuration()` uses `Intl.NumberFormat`'s units, whose short English form for minutes depends on the browser's copy of the language data (ICU): Node, under the tests, writes "min", Chrome "mins". Both are correct English; the tests check the Italian and German forms and "1 hr 5 min", which agree.

### H3.17.4 The tests, proving they can fail, and the build

```sh
npx vitest run src/pages/SummaryPage.test.tsx src/pages/HistoryPage.test.tsx src/components/history src/lib/format.test.ts src/pages/WorkoutPage.test.tsx src/pages/HomePage.test.tsx --reporter=verbose
```

The new and changed tests, among the older ones of those files:

```
✓ src/components/history/compare.test.ts > compareExercise > weight × reps: the best estimated one-rep max wins, warm-ups left out
✓ src/components/history/compare.test.ts > compareExercise > reps: more added weight wins, then more reps; the body alone counts
✓ src/components/history/compare.test.ts > compareExercise > a tie of the best sets is decided by the total reps
✓ src/components/history/compare.test.ts > compareExercise > time and distance: the longest
✓ src/components/history/compare.test.ts > compareExercise > says "first" when never done before, and nothing for an exercise skipped
✓ src/components/history/compare.test.ts > the helpers > finds the best set, counts the verdicts, and adds an exercise's volume
✓ src/components/history/totals.test.ts > inputTotals > counts the exercises done, the sets and the reps, the body alone included, warm-ups left out
✓ src/components/history/totals.test.ts > sessionTotals > reads the backend's totals
✓ src/lib/format.test.ts > formatDuration > writes minutes, or hours and minutes, in each language's short units
✓ src/pages/SummaryPage.test.tsx > SummaryPage > shows the numbers and each exercise against last time, with no request
✓ src/pages/SummaryPage.test.tsx > SummaryPage > saves the feeling and the notes with the workout, then opens Home
✓ src/pages/SummaryPage.test.tsx > SummaryPage > sends nothing when there is nothing to add
✓ src/pages/SummaryPage.test.tsx > SummaryPage > deletes a workout already on the server
✓ src/pages/SummaryPage.test.tsx > SummaryPage > deletes a workout still waiting for the network: it leaves the queue, and never reaches the server
✓ src/pages/SummaryPage.test.tsx > SummaryPage > opens the workout in history when it is not on this phone
✓ src/pages/HistoryPage.test.tsx > HistoryPage > lists the workouts by month, each a link to its page, with Show more
✓ src/pages/HistoryPage.test.tsx > HistoryPage > says so when there is no workout yet
✓ src/pages/HistoryPage.test.tsx > HistoryDetailPage > shows a workout: its numbers, each exercise against last time, how it felt, the sets
✓ src/pages/HistoryPage.test.tsx > HistoryDetailPage > deletes a workout, after a question, and goes back to history
✓ src/pages/HistoryPage.test.tsx > HistoryDetailPage > says so for a workout that is not there
✓ src/pages/HistoryPage.test.tsx > ProgressPage > shows the three latest workouts and the way to all of them; charts are coming
✓ src/pages/HistoryPage.test.tsx > ProgressPage > leads to Home before the first workout
✓ src/pages/HomePage.test.tsx > HomePage > says what happened to a workout after its summary
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > finishes early: says what will not be saved, sends the workout, opens its summary
✓ src/pages/WorkoutPage.test.tsx > WorkoutPage > keeps a finished workout on the phone when the network is down
```

(The list above is the final one, after the second pass of H3.17.6.)

- **A finished workout made the way Finish makes it:** the summary's tests start Day A with `startSession()`, tick sets with `workoutReducer()`, finish, build the body with `toSessionInput()` and keep it with `storeFinished()`. The page then meets exactly what workout mode leaves behind.
- **One page of a list by its query string:** `fakeApi` matches the full key first, `'GET /api/sessions?status=finished&page=2&per_page=20'`, so the test gives page 1 and page 2 different answers and checks Show more.

**Proving they can fail.** Two lines broken on purpose, then put back:

| Line changed | Tests that failed |
|---|---|
| `inputTotals()` counting warm-ups too | the totals' test and the summary's numbers |
| Delete keeping the summary open whenever the network fails, even for a workout still in the queue | `deletes a workout still waiting for the network: …` |

```
     × counts the exercises done, the sets and the volume, warm-ups and the body alone adding nothing
     × shows the numbers worked out on the phone, and the comparison with last time
     × deletes a workout still waiting for the network: it leaves the queue, and never reaches the server
      Tests  3 failed | 5 passed (8)
```

(Run during the first pass, when the summary still showed the volume; the names are those tests' names at the time.)

**The build:**

```sh
npm run build
```

```
dist/assets/index-D9I666nz.css                              85.49 kB │ gzip:  14.63 kB
dist/assets/index-BHdJlXT7.js                              962.19 kB │ gzip: 295.59 kB
✓ built in 521ms
```

29 kB more than after Home ([C1.11](../concepts/C1-frontend.md#c111-known-limits)).

### H3.17.5 Checking in the browser

With `make start`, signed in, at http://localhost:5673, a plan active (`make plans-demo`):

- **The summary:** start the suggested day on Home, tick a few sets, **Finish**, **Finish and save**. The summary shows the day's name, the time, the exercises with a set, the sets and reps without warm-ups. The first time, every exercise says "First time"; do the day again with one more rep on a set, and that exercise says **Better**, "80×9 · last time 80×8", counted at the top ("Against last time: 1 better · 2 same").
- **Save:** choose a feeling, write a note, **Save**: Home opens with "Workout saved to your history.", and the week counts it.
- **Offline:** DevTools → Network → **Offline** before Finish: the summary still shows its numbers and its comparison (from the sets read when the workout started), with "it will be sent as soon as you are online". Save, then back **Online**: the queue sends the workout with the answers.
- **Delete:** finish another workout, **Delete workout** on the summary, confirm: Home says "Workout deleted.", and it is not in history.
- **History:** Progress → the three latest, **All workouts** → the months; the Progress tab stays lit. Open a workout: its numbers, how it felt, the notes, each exercise against the last time before it, with "W1 40×10", "1 80×8", its own volume when it has weights, "Skipped" for an exercise not done. **Delete workout** goes back to history.
- **The widths:** device mode at 375 px (the numbers two by two, the five feelings in one row) and a laptop (the numbers in one row).

### H3.17.6 Second pass: no total volume

Looking at the first summary: **"The volume in kg, is it the total? What sense does it make?"** It was the total, weight × reps of every set of every exercise, and it made little:

- it adds unlike things: a kilogram of squat counts the same as a kilogram of curl, so "2,960 kg" says nothing about how the workout went;
- **with calisthenics it was wrong:** a pull-up with the body alone has no weight, so it adds 0. A workout of pull-ups, dips and push-ups weighed 0 kg, and the comparison said "same volume as last time" after twice the reps.

The decision ([D2.8](../design/D2-decisions.md#d28-workout-rules)): no total volume anywhere; **each exercise compared with itself**; reps and minutes as the totals.

| Where | Before | Now |
|---|---|---|
| Summary and history, the fourth number | Volume (kg) | Reps, the body alone included |
| The comparison | The whole workout's volume against the last time the same day was done | Each exercise against the last time it was done, in any plan: better, the same, lower, first time; counted at the top |
| A row of history | time · sets · volume | time · sets · reps |
| Home's week, the third number | Volume (kg) | Minutes |
| Volume | Everywhere | Beside each exercise with weights only |

**The steps:**

1. **The rule, with no screen:** `compare.ts` and `compare.test.ts`. The table of C1.19.3 was written first, then one test per line of it, then the code: `npx vitest run src/components/history/compare.test.ts` → `Tests  6 passed (6)`.
2. **Last time on the phone.** The summary must compare offline, so it cannot ask the server. Workout mode already reads last time's sets at Start, but keeps only the one in each set's place; `startSession()` and `exerciseFrom()` now keep the whole list on each exercise, `previous`, and Finish stores the whole workout with the body (`FinishedWorkout.session`).
3. **Last time on the server,** for history: `meta.last_sets` instead of `meta.previous`, and `reps_done` in the totals ([H2.14.9](H2-backend.md#h2149-later-last-time-before-a-workout-feat-4)).
4. **The screens:** `VolumeComparison` deleted; `ComparisonSummary` new; `SessionExercises` given the comparisons, used by the summary too, which turns its body into the API's shape (`finishedExercises()`), so both screens draw exercises with one component. `WorkoutStats`, `SessionRow`, `WeekStats` switched to reps and minutes.
5. **Translations:** `compare.*` (the four verdicts, their counts in `_one`/`_other` forms, "last time {{set}}"), `history.statReps`, `history.reps_*`, `history.exerciseVolume`, `home.statMinutes`; the volume's keys removed. `locales.test.ts` checks that the four languages still have the same keys.

**The tests that had to change, and why:** five failed after the switch, all describing the volume or `meta.previous`:

```
     × marks the days trained this week, with the week's numbers
     × shows the numbers worked out on the phone, and the comparison with last time
     × lists the workouts by month, each a link to its page, with Show more
     × shows a workout: its numbers, the comparison, how it felt, every exercise with its sets
     × deletes a workout, after a question, and goes back to history
 Test Files  3 failed | 24 passed (27)
      Tests  5 failed | 196 passed (201)
```

They now check minutes, reps, and the verdicts. Two of the new checks failed first, because of the tests, not of the code:

- `getByText('Against last time:').nextSibling` was the space between the two `<span>`s, a text node of its own; the test reads the whole sentence from the parent instead (`parentElement`).
- `getByText('Exercises')` found two elements in the summary, the tile's label and the list's heading; `{ selector: 'dt' }` picks the label.

**What the photos showed:** at 375 px the comparison, on one line ("— Same · 70×10, last time 70×10"), wrapped half-way and started its second line with "·". It is now two lines at every width: the verdict with its arrow, then "70×10 · last time 70×10".

**Proving it can fail:** two lines changed together, then put back: the estimated one-rep max replaced by the weight alone (`[weight]`), and `previous: last` removed from `startSession()`:

```
     × weight × reps: the best estimated one-rep max wins, warm-ups left out
     × finds the best set, counts the verdicts, and adds an exercise's volume
     × shows the numbers and each exercise against last time, with no request
      Tests  3 failed | 11 passed (14)
```

The first two catch the rule (85×5 would beat 82.5×8 on weight alone); the third catches the summary losing last time.

### H3.17.7 Third pass: the exercises folded, above Save

"The list of exercises must be above Save and Delete… or better, an accordion to hide it, opened only if interested." After the second pass it sat at the bottom, under the buttons, open. It is now under the count ("Against last time: 2 better · 1 same"), closed, and slides open with a tap.

**First version: HTML's own `<details>`.** One panel that opens and closes needs no state: the browser keeps it (the `open` attribute), handles the tap and the keyboard, and tells screen readers whether it is expanded. It worked, but opened at once, with no movement, and did not look like the app's other components. The question "the native one, or the React one with the installed components?" led to the second version.

**Second version, the one kept: shadcn/ui's Collapsible.** The Accordion is for several panels, one open at a time; the Collapsible is its one-panel cousin. Both come from Radix, which the `radix-ui` package already holds:

```sh
cd frontend
npx shadcn@latest add collapsible
```

```
✔ Checking registry.
✔ Created 1 file:
  - src/components/ui/collapsible.tsx
```

No package was installed (`package.json` unchanged). The file was then given its comments, like every component in `ui/`, and one change of ours: the content **slides**. Radix measures the content's height into the CSS variable `--radix-collapsible-content-height`; tw-animate-css, already imported in `src/index.css`, has `animate-collapsible-down` and `animate-collapsible-up`, which go from 0 to that height and back:

```tsx
<CollapsiblePrimitive.CollapsibleContent
  className={cn('overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up', className)}
  {...props}
/>
```

`data-open:` and `data-closed:` are shadcn's variants for `data-state="open"` / `"closed"` (`shadcn/tailwind.css`); `overflow-hidden` hides the list while its height grows.

**In the summary:**

```tsx
<Collapsible className="group rounded-2xl border bg-card/60">
  <CollapsibleTrigger asChild>
    <button type="button" className="flex min-h-12 w-full items-center justify-between …">
      <span>Exercises{' '}<span>3</span></span>
      <ChevronDown className="… transition-transform duration-200 group-has-data-open:rotate-180" />
    </button>
  </CollapsibleTrigger>
  <CollapsibleContent><SessionExercises … /></CollapsibleContent>
</Collapsible>
```

- **`asChild`** lends the trigger's behaviour (the tap, `aria-expanded`, `aria-controls`) to our own `<button>`, styled as a full-width row 48 px tall.
- **The arrow turns** with `group-has-data-open:rotate-180`: the frame is the `group`, and `has-data-open` holds while something inside it has `data-state="open"`, here the trigger.
- **History's page keeps the list open,** as a plain list: there the exercises are the content.

**An error met, again:** the test looked for the button by its name and did not find it. Its name was "Exercises3": the title and the count are two pieces of text side by side, joined with no space, as the feeling buttons were ([H3.17.3](#h3173-the-errors-met)). The margin between them shows a space but is not one. A real space, `{' '}`, fixed it: "Exercises 3".

**The test** checks that the list starts closed, absent from the page, and opens with a tap:

```tsx
const toggle = screen.getByRole('button', { name: 'Exercises 3' })
expect(toggle).toHaveAttribute('aria-expanded', 'false')
expect(screen.queryByText('80×8 · last time 80×6')).not.toBeInTheDocument()
await userEvent.click(toggle)
expect(toggle).toHaveAttribute('aria-expanded', 'true')
expect(screen.getByText('80×8 · last time 80×6')).toBeInTheDocument()
```

```
      Tests  6 passed (6)
```

The photos at 375 px: closed, the questions and Save are in the first screen of a phone; open, the three exercises come before the questions and the arrow points up. The slide itself is seen in the browser: Home → a workout → Finish → tap "Exercises".

## H3.18 Loose ends, as built

Four small things found while listing what was left after FEAT-4, done together on `fix/loose-ends` ([P1.1](../project/P1-conventions.md#p11-git): several small points may share a branch). None was in the backlog.

| File | What changed |
|---|---|
| `src/components/plans/plan-draft.ts` | `newId()` falls back to `randomUuid()`, a UUID built by hand |
| `backend/app/Http/Controllers/PlanController.php`, `backend/app/Http/Resources/PlanResource.php` | The plan list's `last_used_at` |
| `src/api/plans.ts`, `src/components/plans/PlanCard.tsx`, `src/lib/format.ts` | "Used 3 days ago" on each plan's card; `formatDaysAgo()` |
| `src/components/workout/finish-workout.ts`, `FinishButton.tsx` (new) | Finishing, and its button, out of `WorkoutScreen.tsx` |
| `src/components/workout/ResumeBanner.tsx` | Finish beside Resume |
| `docs/design/D3-data-model.md`, `docs/how-to/H1-database.md`, `H2-backend.md` | Three links to a deleted backlog entry |
| `src/i18n/locales/*.json` | `plans.lastUsed`, `plans.neverUsed` |

### H3.18.1 Start without HTTPS: a UUID by hand

**The problem, found by reading, before it bit.** Every row a phone creates gets a UUID from `newId()`, which called `crypto.randomUUID()`. Browsers give that function only to a **secure context**: a page on HTTPS, or on `localhost`. The development app opened from a phone over the Wi-Fi, at `http://192.168.1.20:5673`, is neither (over USB it is `localhost`, [H3.8.2](#h382-a-real-android-phone-over-usb)): the function is missing, and Start would fail with `TypeError: crypto.randomUUID is not a function`. In DevTools' Console on any page opened by IP over http, `typeof crypto.randomUUID` answers `'undefined'`; on `localhost`, `'function'`.

**The fix:** when the function is missing, the same kind of UUID, version 4, is built from `crypto.getRandomValues()`, which every page has:

```ts
export function newId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : randomUuid()
}

export function randomUuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))   // 16 random bytes
  bytes[6] = (bytes[6]! & 0x0f) | 0x40                        // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80                        // the standard variant
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
```

- **`&` and `|` on bits:** `& 0x0f` keeps a byte's last four bits and clears the first four; `| 0x40` then sets them to `0100`, the number 4. That is how a UUID says "I am version 4": the third group starts with `4`. The fourth group starts with `8`, `9`, `a` or `b`, the "variant" bits `10`.
- **Why not `Math.random()`:** it is not meant to be unpredictable, and two phones could repeat a sequence; `getRandomValues()` is the browser's secure generator, the one `randomUUID()` uses itself.
- **The backend accepts both:** it checks the format (`uuid`), not the version, and makes its own ids as UUIDv7 ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)).

**The tests** (`plan-draft.test.ts`): 50 ids by hand, each matching the version 4 pattern, all different; and `newId()` with `crypto.randomUUID` taken away (`Object.defineProperty(crypto, 'randomUUID', { value: undefined })`, put back in a `finally`). **Proving it can fail:** with `newId()` back to `return crypto.randomUUID()`:

```
     × still works where the browser gives no crypto.randomUUID (a page on plain http, not localhost)
TypeError: crypto.randomUUID is not a function
```

The Wake Lock API is held back on plain http in the same way; it simply does nothing there ([H3.15.3](#h3153-the-browsers-own-apis)). Seeing it on a phone needs HTTPS or `localhost`: an Android phone over USB ([H3.8.2](#h382-a-real-android-phone-over-usb)), or the app on the server ([OPS-3](../project/backlog.md#ops-3-deploy-to-the-free-server)).

### H3.18.2 "Last used" on each plan

D1.4.6 asked for it; FEAT-2 left it for when workouts existed. The backend adds the column in the list's query, as `days_count` ([C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints)):

```php
->withMax(['workoutSessions as last_used_at' => fn ($sessions) => $sessions->whereNotNull('finished_at')], 'started_at')
```

`withMax(relation, column)` adds a subquery, `(select max(started_at) from workout_sessions where …) as last_used_at`; the array form names it and narrows it to finished workouts. Deleted ones are left out by `SoftDeletes`. A subquery's result is the database's text, so the resource turns it into ISO 8601 with Carbon, and sends it only when the query added it (`whenHas()`).

**The backend test** uses fixed dates (a test must give the same answer whatever day it runs: the first version used `now()->subDays(5)` and would have broken a few days later): finished on the 3rd and the 6th, a later one deleted, a later one in progress; the plan's `last_used_at` is the 6th, a plan never used gets `null`.

```sh
make artisan c="test --filter='says when each plan was last used'"
```

```
✓ it says when each plan was last used: its latest finished workout,…
Tests:    1 passed (3 assertions)
```

**On the card:** "Used 3 days ago", "Used yesterday", "Never used yet". `formatDaysAgo(date, today, language)` (`lib/format.ts`) counts **calendar days** in the device's time zone (a workout at 23:00 is "yesterday" at 08:00, though only 9 hours passed), and `Intl.RelativeTimeFormat(language, { numeric: 'auto' })` says them: "ieri", "3 giorni fa", "vor 3 Tagen", "hace 3 días". The page's test gives a plan used yesterday at noon, by the device's clock, so it reads "Used yesterday" any day.

### H3.18.3 Finish from the banner

The banner of a workout left open (Home, the plan's page) had only Resume; D1.4.2 asked for Finish too: a workout done but never finished, the app closed at the end. Finishing lived inside `WorkoutScreen`; two places needing it is the moment to share it:

- `finish-workout.ts`, `finishWorkout(session, unit, queryClient)`: the steps of [C1.17.5](../concepts/C1-frontend.md#c1175-the-queue-of-workouts-to-send), unchanged, returning the workout's id;
- `FinishButton.tsx`: the button and its question, moved out of `WorkoutScreen.tsx` as it was;
- `ResumeBanner` shows Finish (outlined) beside Resume (lime), and opens the summary afterwards.

A paused workout is already stopped: finishing it does not count the pause. Workout mode's ten tests passed unchanged after the move, which is what they were for. The new test (`HomePage.test.tsx`) stores a workout, taps Finish on Home's banner, confirms, and checks the `PUT`, the summary's address, and that the workout is no longer in progress but kept for the summary.

### H3.18.4 Three broken links, and checking them all

D3, H1 and H2 linked to `backlog.md#feat-2-plans`, an entry deleted when FEAT-2 was done (the backlog deletes finished points, [P1.1](../project/P1-conventions.md#p11-git)). They now say "FEAT-2" without a link. To find any other, a short script read every Markdown link of `docs/`, `README.md` and `CLAUDE.md` and checked that its file exists and, for `#anchor`, that the file has a heading with that anchor (lower case, punctuation removed, spaces as dashes, as GitHub makes them):

```
broken: 0
```

With one of the three links put back on purpose, it answered `docs/design/D3-data-model.md: missing anchor ../project/backlog.md#feat-2-plans` and `broken: 1`. The script was a one-off and was not added to the repository.

### H3.18.5 The checks

```
 Test Files  27 passed (27)
      Tests  206 passed (206)
```

and `make check`, all green.

## H3.19 The logo, as built

The placeholder "A" on a lime tile became the chosen logo ([D1.5](../design/D1-ui.md#d15-design-system), "Brand"): a heavy italic A with a tick cut out of it. How a logo goes from proposals to the app, by hand.

**The proposals.** A logo is a decision, not code: the proposals were drawn as plain SVG on a 64 × 64 grid, each in `currentColor`, in local HTML pages that show every idea as a dark and a lime tile, beside the wordmark on dark and on light, and at real sizes, 48 down to 16 px. Opened by double click, with no server and no account (claude.ai's artifacts need a sign-in). The last pages put the candidates in columns and the real situations in rows: a browser tab, a phone's home screen, the app's sidebar. Rendered and looked at before showing them: several needed redrawing (a kettlebell that read as a padlock, a tick lost in the A's legs, arms that seemed to hold the head).

**Five rounds, and what each taught:**

1. **Twelve ideas.** Two were later set aside for resembling existing brands: two rising chevrons (Strava's mark, in the same field) and an A cut out of a shield (Angular's). Checking a mark against known logos belongs with the trademark search of [OPS-2](../project/backlog.md#ops-2-check-that-the-atleoplan-name-is-free).
2. **An athlete with arms raised,** whose legs drew an A, chosen and put in the app. At 16 px it read as a little man, not as an A.
3. **Stronger A's for the athlete:** thicker legs and crossbar; arms out as the crossbar; a solid A, which read as the restroom's pictogram. None convinced.
4. **The tick, made personal:** the tick as the crossbar, breaking out, italic, cut out of a solid A, solid and italic.
5. **The solid italic A with the tick, its cut widened** (8 units instead of 6) so that it stays open at 16 and 24 px; at 9.5 the left foot came loose.

**The files:**

| File | What |
|---|---|
| `src/components/brand/Brand.tsx` | `BrandMark`: the lime tile and the A, the tick cut out, in the dark background colour |
| `public/favicon.svg` | The browser tab: the same mark, lime on dark |
| `docs/design/brand/mark-lime.svg`, `mark-dark.svg` | The drawings at 512 px, for anything else (the installed app's icon, a store, the README) |
| `README.md` | The mark at the top |

**A shape with a hole cut in it: a mask.** The A is one filled shape; the tick must be *missing* from it, showing the tile through. Painting the tick in the tile's colour would not do: the lime tile is a gradient, and the browser tab's tile is dark. An SVG **mask** cuts instead: inside it, white keeps and black removes, and what is drawn *through* it (here a plain rectangle of the mark's colour) shows only where the mask is white.

```tsx
<mask id={maskId} maskUnits="userSpaceOnUse" x="-10" y="0" width="84" height="64">
  <g transform="translate(6 0) skewX(-12)">
    <path d="M27 8 H37 L56 56 H45 L41 46 H23 L19 56 H8 Z" fill="white" />        {/* the A */}
    <path d="M21.5 37 L29.5 45 L43.5 25.5" stroke="black" strokeWidth="8" … />  {/* the tick */}
  </g>
</mask>
…
<g transform="translate(10 10) scale(0.6875)">
  <rect x="-10" width="84" height="64" fill="#0B0B0F" mask={`url(#${maskId})`} />
</g>
```

- **`skewX(-12)`** slants everything 12 degrees forward, as italic letters; a slanted shape moves sideways, and `translate(6 0)` brings it back to the middle. The mask and the rectangle are wider than the grid (`x="-10"`, `width="84"`) because the slanted A reaches past its edges.
- **`maskUnits="userSpaceOnUse"`:** the mask's area is given in the drawing's own coordinates, the 64 grid, rather than as fractions of the shape.
- **`scale(0.6875)` and `translate(10 10)`** fit the 64 grid into the tile with a margin: 44 / 64 = 0.6875, and (64 − 44) / 2 = 10.
- **`useId()`** gives each copy of the mark its own ids for the gradient and the mask: a page with the mark twice (the sidebar and the phone's bar) would otherwise have two masks with the same id.
- **In JSX** the SVG attributes with a dash are written in camelCase (`strokeWidth`, `strokeLinecap`), as React asks; in the `.svg` files they keep their dash (`stroke-width`).

**One mark, small sizes included.** The tab shows the same mark as the app. To compare icons at their real size, a small HTML page with `<img src="….svg" width="16">` beside `width="32"`, photographed as in [H3.15.10](#h31510-fourth-pass-looking-at-the-screen-for-real), is enough; enlarging an SVG with CSS does not show the pixels, since the browser redraws it sharp. That is how the tick's cut was chosen: 6, 8 and 9.5 units wide, side by side at 96, 48, 32, 24 and 16 px.

**Checking it:** `npm run dev`, then the sidebar (36 px), the phone's top bar (28 px, DevTools' device mode), the sign-in page (40 px) and the tab. Browsers cache the tab's icon hard: if the old icon stays, a hard reload (Cmd+Shift+R) or a new tab shows the new one.

**Not here yet:** the icons of the installed app (PNG at 192 and 512 px, and the Apple touch icon) come with the PWA (FEAT-3), drawn from `mark-lime.svg`; the admin panel keeps Filament's own look.

---

## H3.20 The stepper and the exercise menu, as built

UI-6 (`feat/workout-stepper`), the last two pieces of workout mode's screen in [D1.4.9](../design/D1-ui.md#d149-workout-mode): a tap on a set's value opens a big stepper from the bottom, and a "⋯" beside the exercise's name opens its menu (swap, skip, a note, the video). How they work: [C1.17.7](../concepts/C1-frontend.md#c1177-the-big-stepper-and-the-exercises-menu). How they were built, by hand:

### H3.20.1 The order of building

1. **The arithmetic first, with no React** (`stepper.ts` and its test): the step of each field, the next value after a tap. The rules are easier to get right in a function of four arguments than in a panel.
2. **The reducer's three actions** (`swapExercise`, `skipExercise`, `setNote`, with `swappedExercise()` and `hasWorkLeft()` in `workout-session.ts`) and their tests.
3. **The panel component** from shadcn/ui, then `SetStepper`, `ExerciseMenu` and the picker's swap mode.
4. **Wiring** in `WorkoutScreen`, the translations in four languages, the page's tests.
5. **Looking at it** at a phone's width, then the docs.

### H3.20.2 The panel: shadcn's Sheet

In `frontend/`. A drop-down menu was added in the same command, for the "⋯", and removed later (below):

```sh
printf 'n\nn\n' | npx shadcn@latest add sheet dropdown-menu
```

```
✔ Checking registry.
✔ The file button.tsx already exists. Would you like to overwrite? … no
✔ Created 2 files:
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/sheet.tsx
ℹ Skipped 1 file: (files might be identical, use --overwrite to overwrite)
  - src/components/ui/button.tsx
```

`printf 'n\n…' |` answers no to overwriting our `button.tsx` ([H3.9](#h39-a-shadcnui-component)). No npm package is added: both are built on Radix, already installed as the single `radix-ui` package. Then `sheet.tsx` was brought to our style, as `dialog.tsx` was ([H3.14.2](#h3142-the-dialog-component)): the comments, single quotes, and a `closeLabel` prop for the X's hidden text, which shadcn writes as the English word "Close".

**The drop-down, removed.** Its rows are 28 px tall, small text: fine with a mouse, thin for a thumb between two sets. The menu became a Sheet too, with 48 px rows; `rm src/components/ui/dropdown-menu.tsx`. One kind of panel for both.

### H3.20.3 The files

| File | What |
|---|---|
| `components/workout/stepper.ts`, `stepper.test.ts` | `fieldStep()`, `stepValue()`: the steps and the next value |
| `components/workout/set-fields.ts` | `fieldsFor()`, moved out of `SetRow.tsx` (below): the fields of a set, for the rows, their titles and the stepper |
| `components/workout/SetStepper.tsx` | The stepper's panel |
| `components/workout/ExerciseMenu.tsx` | The "⋯" and its panel |
| `components/workout/workout-session.ts`, its test | `notes` and `skipped` on an exercise; `swappedExercise()`, `hasWorkLeft()`; the three actions; `toSessionInput()` sends the note |
| `components/workout/SetRow.tsx` | The fields become buttons that open the stepper |
| `components/workout/WorkoutScreen.tsx` | The two panels, the swap picker, the note under the name, the skipped box, the dots |
| `components/plans/editor/ExercisePicker.tsx` | `open` / `onOpenChange` (controlled), and `replacing`: one tap, the muscle filter |
| `components/ui/sheet.tsx` | The panel |
| `i18n/locales/*.json` | 24 texts under `workout`, in four languages |
| `pages/WorkoutPage.test.tsx` | Three tests updated, two new |

### H3.20.4 The errors met

**A test that passed without the code.** The first `stepValue()` rounded the weight to two decimals, and a test checked it: `0.1 + 0.2` must read `0.3`. With the rounding taken out on purpose, to see the test fail, it still passed: `formatNumber(value, language, { maximumFractionDigits: 2 })` already rounds when it writes the number. The rounding was dead code, and the test was testing `Intl`. The line went; what rounding is really needed for, reps typed as `8,5`, got its own test, which fails without it:

```
 FAIL  src/components/workout/stepper.test.ts > stepValue > keeps reps, seconds and meters whole
AssertionError: expected '9,5' to be '10' // Object.is equality
      Tests  1 failed | 7 passed (8)
```

**A function exported from a component's file.** `SetStepper` needs the same fields as the row, so `fieldsFor()` was exported from `SetRow.tsx`:

```
/…/frontend/src/components/workout/SetRow.tsx
  50:17  error  Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components
```

Vite's Fast Refresh updates an edited component in the page without losing its state, but only for files that export components alone. `fieldsFor()` moved to `set-fields.ts`, imported by both.

**Indentation.** The picker's rows, wrapped in `{!replacing && ( … )}`, kept their old indentation: seven `@stylistic/indent` errors, all fixed by `npx eslint --fix src` (`make fix`).

**The page's tests looked for text boxes.** The fields became buttons, so three tests broke as they should:

```
TestingLibraryElementError: Unable to find a label with the text of: Warm-up 2, kg
```

They now look for the buttons by their names, value included (`getByRole('button', { name: 'Set 1, kg: 80' })`), and type in the stepper's box, which kept the old name (`Set 1, Reps`).

**The muscle in the address.** The new test checked that the swap picker asked for `muscle=chest`, and failed (`expected false to be true`). The list's filter is sent as `filter[muscle]=chest` (`exerciseListQuery()` in `api/exercises.ts`, [C1.14.3](../concepts/C1-frontend.md#c1143-filters-in-the-address)), and `URLSearchParams` writes the brackets escaped: `filter%5Bmuscle%5D=chest`. The test reads the address through `decodeURIComponent()` first.

### H3.20.5 The tests, proving they can fail

```sh
npx vitest run src/components/workout/stepper.test.ts
npx vitest run src/components/workout/workout-session.test.ts
npx vitest run src/pages/WorkoutPage.test.tsx
```

```
      Tests  8 passed (8)
      Tests  23 passed (23)
      Tests  12 passed (12)
```

Two rules broken on purpose in `workout-session.ts`, the plan's weight kept in a swap and the skip ignored by `hasWorkLeft()`, then the file restored:

```
 FAIL  … > the exercise's menu: swap, skip, note > swaps an exercise: same place, sets and types; values from its own last time
 FAIL  … > the exercise's menu: swap, skip, note > skips an exercise: the next opens, and its sets are no longer work left
 FAIL  … > the exercise's menu: swap, skip, note > in a superset, a skipped exercise ends the round
      Tests  3 failed | 20 passed (23)
```

### H3.20.6 Looking at it at a phone's width

Without a phone at hand, a throw-away page drew `WorkoutScreen` with a workout and a user put straight into the cache (`queryClient.setQueryData(authKeys.user, …)`), in Italian, and clicked "Serie 1, kg" or "Opzioni per…" by itself after drawing (`document.querySelector(…).click()` in a `setTimeout`). Built with `npx vite build --config preview-tmp/vite.config.ts` and photographed with headless Chrome, as in [H3.15.10](#h31510-fourth-pass-looking-at-the-screen-for-real); deleted afterwards. Two things learnt:

- **Tailwind looks for class names under Vite's root.** With the page's own folder as the root, the build had no classes at all and the screen was bare text. The root must be `frontend/`, with the page given as the build's input (`build.rolldownOptions.input`).
- **Headless Chrome will not make its window narrower than about 500 px:** a 390 px window gave a page wider than the photo. The page, inside an `<iframe width="390">`, is drawn at a phone's width.

What the photos showed: the values as buttons, the "⋯" beside the name, the stepper with `−2,5` / `+2,5` and `−1` / `+1` and last time's set under the title, the menu's three rows (no video: the test exercise has none), the skipped box. One change came of it: **Do it after all** was a small button, now 48 px like the screen's others.

**In the browser,** `make start`, signed in, a plan's day started:

- tap a weight: the panel rises with that set's fields; **+2,5** twice, the box reads two steps more, the row behind too; **Fatto**/**Done** closes;
- take a weight down to 0: the field empties (the body alone), and ✓ still works;
- **⋯** → **Aggiungi una nota**, Save: the note under the name; at the end it is in the workout's history page, under the exercise;
- **⋯** → **Salta esercizio**: the next exercise opens, the dot turns grey; back on it, **Fallo comunque**;
- **⋯** → **Sostituisci esercizio**: the picker, **Solo Petto** pressed; tap one: it takes the place, the plan's reps, no weight; tick a set and the menu's Swap is disabled, saying why.

### H3.20.7 Second to sixth pass: Add set and Add exercises out of the way, not out of sight

**Seen on a phone:** **Aggiungi serie** and **Aggiungi esercizi**, two outlined buttons under the sets, did not fit side by side (about 420 px for both, 360 px available), so `flex-wrap` put the second under the first, both on the left at different widths. It looked like a mistake.

**First fix, tried:** below 640 px, two equal halves of one row (`grid grid-cols-2`, `sm:flex` above) with short labels, **＋ Serie** and **≡＋ Esercizi**, each written twice and shown by width (`sm:hidden`, `max-sm:hidden`), the full name kept for screen readers in `aria-label`. It fitted, in German too. It broke one test, which found the column title "Set" by its text and now found the English short label too (`Found multiple elements with the text: Set`).

**Then the real question:** in a day of a plan, ready and started, are the two buttons worth that place? Both are rare there, and in the way under the sets every time. But not useless: a set more than planned (a good day, a back-off set) happens; an exercise more, less often (a busy machine has **Swap** now); and a free workout needs Add exercises to have anything at all. So they stay, quieter:

- **Add set** is the last row of the table, as in D1.4.9's drawing: a ghost button as wide as the rows, dashed border, grey text. The ghost variant's border is transparent (`border-transparent` in the base classes), so `border-dashed` alone drew nothing; `border-border dark:border-input` gives it the outline buttons' colour.
- **Add exercises** is a dashed **＋** of 36 px after the dots, in the `<nav>` of the workout's exercises: the dots are the exercises, so a ＋ after them reads "one more". It sits beside the `<ol>` of dots, not inside it, so a screen reader does not count it as an exercise. Its name is `aria-label` "Add exercises". A free workout with no exercise keeps the big lime button.

The short labels and their texts went again; the column-titles test is back to plain `getByText`, and checks the two buttons where they now are:

```tsx
expect(screen.getByRole('button', { name: 'Add set' })).toBeInTheDocument()
expect(within(screen.getByRole('navigation', { name: 'Exercise 1 of 3' })).getByRole('button', { name: 'Add exercises' })).toBeInTheDocument()
```

**Fourth pass: too quiet.** Seen in the app, grey text and a grey dashed border on the near-black background were nearly invisible, and a ＋ alone said nothing. Secondary is not hidden. The two buttons got light semibold text, a lime ＋, a lighter dashed border, and Add exercises its words: a pill, **＋ Aggiungi esercizi**, on the right of the dots' row (`ml-auto`), 36 px tall (`h-9`, `text-sm`).

**Fifth pass: no dashes.** Seen, the dashed lines were ugly: a soft grey fill with no border replaced them, and the skipped box lost its dashes the same way (`bg-muted/50`).

**Sixth pass: like the other buttons.** The grey pill, 36 px and fully round, did not match the screen's other buttons, 48 px with `rounded-xl` corners. The lesson of the six passes: a secondary action needs no look of its own, the app already has one, the **outlined** button (Previous, Next, Concludi). Both are now `variant="outline" size="xl"`, Add set as wide as the rows, Add exercises with Previous's padding (`px-4`); the one touch kept is the lime ＋:

```tsx
const ADD_ICON = '[&_svg]:text-primary'

<Button variant="outline" size="xl" className={cn('mt-2 w-full sm:mt-3', ADD_ICON)} …>
```

`[&_svg]:text-primary` is an **arbitrary variant**, Tailwind's way of styling the elements inside: every `<svg>` in the button, the ＋, is lime.

Photographed at 390 px in the dark and the light theme ([H3.20.6](#h3206-looking-at-it-at-a-phones-width)): seen at once, of a piece with Concludi and Successivo.

### H3.20.8 The checks

`make check`: everything passes, with 222 frontend tests (206 before, 16 new: 8 for the stepper, 6 for the reducer, 2 for the page).

---

## H3.21 The workout preferences, as built

UI-7 (`feat/workout-preferences`): Profile gets a **Workout** card with the five preferences workout mode reads, the weight unit, the default rest, the stepper's weight step, the rest timer's sound and vibration ([D1.4.14](../design/D1-ui.md#d1414-profile-and-settings)). The columns existed with their defaults, and `GET /api/user` sent them; nothing could change them. How it works: [C1.13.4](../concepts/C1-frontend.md#c1134-preferences-on-the-account). How it was built:

### H3.21.1 The order of building

1. **The backend:** the endpoint that saves the language and the theme takes five more fields; its tests first.
2. **The frontend:** shadcn's Switch, the request's type, the card, its texts, the page's tests.
3. **A look** at a phone's and a laptop's width, then the docs.

### H3.21.2 The backend: five rules, and the fillable trap

No new endpoint: `PATCH /api/user/preferences` already saved one preference at a time. Three files:

| File | Change |
|---|---|
| `app/Http/Requests/UpdatePreferencesRequest.php` | Five rules, each `sometimes` (checked only when sent) |
| `app/Models/User.php` | The five columns added to `#[Fillable([...])]` |
| `tests/Feature/Auth/CurrentUserTest.php` | Two tests: the five saved one at a time; values out of range refused |

```php
'weight_unit' => ['sometimes', Rule::enum(WeightUnit::class)],
'default_rest_seconds' => ['sometimes', 'integer', 'between:0,600'],
'weight_step' => ['sometimes', 'numeric', 'between:0.25,50', 'decimal:0,2'],
'timer_sound' => ['sometimes', 'boolean'],
'timer_vibration' => ['sometimes', 'boolean'],
```

`decimal:0,2` refuses more than two decimals (`1.125`), which the column, `numeric(5,2)`, could not keep. `boolean` takes `true`, `false`, `1`, `0`, `"1"`, `"0"`.

```sh
docker compose exec backend php artisan test --filter=CurrentUserTest
```

```
  ✓ it saves the workout preferences, one at a time
  ✓ it refuses workout preferences out of range

  Tests:    8 passed (49 assertions)
```

**The trap, shown by breaking it on purpose.** The controller saves with `update($request->validated())`, a *mass assignment*: several columns at once, from an array. Laravel then writes only the columns listed in the model's `#[Fillable([...])]` and **silently skips the others**. With the five left out of the list, the request is valid, the answer is 204, and nothing is saved:

```
  ⨯ it saves the workout preferences, one at a time
  Failed asserting that two variables reference the same object.
  Tests:    1 failed, 7 passed (45 assertions)
```

Only the test that reads the row back (`$user->fresh()`) notices. The list is a protection, against a request slipping in `is_admin` ([C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders)); the price is remembering it for every new column a request may change.

### H3.21.3 The frontend

In `frontend/`, shadcn's on/off switch:

```sh
printf 'n\n' | npx shadcn@latest add switch
```

```
✔ Checking registry.
✔ Created 1 file:
  - src/components/ui/switch.tsx
```

Brought to our style, as `sheet.tsx` was ([H3.20.2](#h3202-the-panel-shadcns-sheet)), with a third size, `lg`, 48 × 28 px: shadcn's default is 32 × 18, small for a finger.

| File | What |
|---|---|
| `components/ui/switch.tsx` | The switch, with `size="lg"` |
| `components/WorkoutPreferences.tsx` | The card: three Selects, two Switches, each saved on change |
| `pages/ProfilePage.tsx` | The card, between Preferences and Information |
| `api/auth.ts` | `PreferencesData` with the five fields |
| `i18n/locales/*.json` | 16 texts under `preferences`, in four languages |
| `test/setup.ts` | Three pointer functions for Radix's Select (below) |
| `pages/ProfilePage.test.tsx` | Three tests |

Two choices, explained in [C1.13.4](../concepts/C1-frontend.md#c1134-preferences-on-the-account): the unit is sent with the step that suits it (2.5 kg, 5 lb), and cannot change while a workout is in progress.

### H3.21.4 Testing Radix Selects

The language and theme pickers had no test that opened them. The first one written here failed on opening:

```
TypeError: target.hasPointerCapture is not a function
TestingLibraryElementError: Unable to find role="option" and name "2 min"
```

Radix's Select calls three element functions jsdom does not have: `hasPointerCapture`, `releasePointerCapture`, `scrollIntoView`. `src/test/setup.ts` now gives every element versions that do nothing, as it does for `ResizeObserver`:

```ts
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}
```

`??=` assigns only when there is nothing yet: a real browser keeps its own. Then a Select is used as a person would: a click on the `combobox` (named by its label), a click on the `option`.

```tsx
await user.click(within(card).getByRole('combobox', { name: 'Default rest' }))
await user.click(await screen.findByRole('option', { name: '2 min' }))
```

**A fake server that forgets.** The next test clicked the sound's switch and expected it off at once; it failed:

```
Error: expect(element).toHaveAttribute("aria-checked", "false")
```

Two reasons. `useUpdatePreferences` writes the change into the cache after an `await` (it first cancels the reads in flight), so not before the next line of the test: `waitFor(() => …)` waits for it. And after the last change Profile reads the user again, and the fake `GET /api/user` gave the first values back. The fake now remembers, as the real server does: a function entry is called at each request, and merges every body sent so far into the user:

```tsx
const fake = fakeApi({
  'GET /api/user': () => signedInAs(Object.assign({ ...testUser }, ...preferencesSent(fake))),
  …
})
```

### H3.21.5 Checking it

Photographed at 390 and 900 px with a throw-away page ([H3.20.6](#h3206-looking-at-it-at-a-phones-width)), this time wrapped in `ThemeProvider` too: without it, `ThemeSelect` stops the page with `useTheme() must be used inside <ThemeProvider>`. The Workout card has the Preferences card's look; on a phone each control goes under its text, as the other rows'.

**In the browser,** `make start`, signed in, Profile:

- **Default rest** → 2 min; start a plan's day: an exercise with no rest of its own rests 2 minutes;
- **Weight step** → 1.25 kg; in a workout the stepper shows −1,25 / +1,25;
- **Weight unit** → Pounds: the step becomes 5 lb, the plans' and workouts' weights are shown in pounds; back to kilograms, nothing has drifted (the database kept kilograms);
- with a workout in progress, the unit's picker is greyed, and says why;
- **Sound** off: a rest ends with the vibration alone.

### H3.21.6 The checks

`make check`: everything passes, with 245 backend tests (2 new) and 225 frontend tests (3 new).

## H3.22 The plan editor in two steps, as built

`feat/plan-editor-steps`: the plan editor of [H3.14](#h314-the-plan-editor-as-built) put the plan's fields, the days as tabs and the open day's exercises on one long page. Trying it, the verdict was that adding exercises "right there" under the plan's fields did not feel right. It now has two steps on the same draft: first the plan's details, the number of days and their names; then the days as tabs, with each day's exercises under its tab. The open tab is in the address. How it works and why: [C1.16.7](../concepts/C1-frontend.md#c1167-two-steps-one-draft); the screens: [D1.4.8](../design/D1-ui.md#d148-plan-editor). Frontend only: the draft, the reducer and the request are unchanged.

### H3.22.1 The order of building

**A first pass, rejected.** The first version had a "plan" screen with the days as cards (name, number of exercises, up, down, delete, **Exercises →**) and a screen per day with arrows to the days around it. It worked and its tests passed, but tried on screen it read as confusing: two ways of moving between days, buttons on every card. What was asked instead was a form in two steps: everything about the plan, including how many days, then the exercises, the days as tabs. The history handling of the first pass (below, H3.22.3) was kept; the two screens were redone:

1. **The first step**, `EditorOverview`: the plan's fields, a select for the number of days, a name field per day, **Next**, and the dialog before removing days with exercises.
2. **The second step**, `EditorDays`: the way back and the tabs; `EditorDay` keeps only a day's exercises.
3. **`PlanEditor`** reads `?day=` and draws one step or the other.
4. **The texts**, in four languages; **the page's tests**, rewritten for two steps, then broken on purpose.
5. **A look** at a phone's and a laptop's width, then the docs.

### H3.22.2 The files

| File | Change |
|---|---|
| `components/plans/editor/EditorOverview.tsx` | New: step 1, the plan's fields, **Number of days**, the days' names, **Next**, the dialog |
| `components/plans/editor/EditorDays.tsx` | New: step 2, **Back to the plan's details** and the days as tabs |
| `components/plans/editor/EditorDay.tsx` | The day's name, move and delete gone: only the exercises |
| `components/plans/editor/PlanEditor.tsx` | The plan's fields and the tabs moved out; `?day=`, `goToDay`, `backToPlan`, errors sent to their step, the step back before a save, Save outlined in step 1 |
| `components/plans/plan-draft.ts` | `dayLetter(index)`: "A", "B"… for "Day A", used by both steps |
| `i18n/locales/*.json` | Under `plans.editor`: `addDay`, `dayName`, `removeDay`, `moveDayEarlier`, `moveDayLater` gone; 7 new texts |
| `pages/PlanEditorPage.test.tsx` | 6 of the 8 tests changed, 3 new: 11 |

`dayLetter()` went into `plan-draft.ts` rather than into `EditorOverview.tsx`, where it was first written: a `.tsx` file of components should export only components, otherwise Vite's Fast Refresh (the page updating as a file is saved) cannot swap it in place, and ESLint's `react-refresh/only-export-components` says so.

**The number of days is a native select** (`NativeSelect`, as "Move to another day" in an exercise): on a phone it opens the system's own list, and in a test it is changed with `user.selectOptions()`. Fewer days removes the last ones; when one has exercises, an `AlertDialog` asks, opened by state rather than by a button:

```tsx
const [pendingCount, setPendingCount] = useState<number | null>(null)

function chooseCount(count: number) {
  const removed = draft.days.slice(count)
  if (removed.some(day => day.items.length > 0)) setPendingCount(count)
  else applyCount(count)
}

<AlertDialog open={pendingCount !== null} onOpenChange={open => !open && setPendingCount(null)}>
```

`onOpenChange` is called with `false` by Cancel, Escape and a tap outside: all three forget the pending number, and the select, which shows `draft.days.length`, goes back by itself.

### H3.22.3 The address and the history

`EditorOverview` and `EditorDays` know nothing about the address: they call `onNext()`, `onOpenDay(index)` and `onBack()`, and `PlanEditor` decides how to move:

```tsx
function goToDay(index: number) {
  if (index === openDay) return
  if (openDay === null) setSearchParams({ day: String(index + 1) }, { state: { fromPlan: true } })
  else setSearchParams({ day: String(index + 1) }, { replace: true, state: location.state })
}

function backToPlan() {
  if (fromPlan) void navigate(-1)
  else setSearchParams({}, { replace: true })
}
```

`setSearchParams(params, options)` is a navigation to the same page with another `?…`, and takes `navigate()`'s options: `replace` and `state`. The table in C1.16.7 shows the history after each step.

**Saving from the second step needs `await navigate(-1)`**, and whether that waits was not obvious: in the browser, going back is asynchronous. React Router's code says what it does with a number:

```sh
grep -rn 'typeof to === "number"' -A 5 node_modules/react-router/dist/development/lib/router/router.js
```

```
417:		if (typeof to === "number") {
418-			if (!pendingPopstateNavigationDfd) pendingPopstateNavigationDfd = createDeferred();
419-			let promise = pendingPopstateNavigationDfd.promise;
420-			init.history.go(to);
421-			return promise;
422-		}
```

With a router made by `createBrowserRouter` (the app's) or `createMemoryRouter` (the tests'), `navigate(-1)` returns a Promise kept until the history has moved (`pendingPopstateNavigationDfd`, a "deferred": a Promise resolved later, by the code that handles the browser's `popstate`). The other kind of router, `<BrowserRouter>`, has no such Promise (`navigator.go(to); return;` in `lib/hooks.js`): code moved to it would have to wait another way.

### H3.22.4 The tests, and proving they can fail

The eight tests of H3.14 drew the editor and found the exercises at once; now most of them first tap **Next: the exercises**. Three more test the steps:

```sh
npx vitest run src/pages/PlanEditorPage.test.tsx --reporter=verbose
```

```
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > creates a plan from exercises chosen in the library, then opens it
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > says what is wrong before sending anything, in the first step
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > shows the server's message under its field
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > saves a plan again with its version and its ids
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > warns on the plan's page when the plan had been changed elsewhere
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > keeps the draft when leaving, and discards it on request
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > joins two exercises in a superset
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > sets the number of days, naming the new ones with the next letters
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > asks before removing days that have exercises
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > goes from tab to tab, and Back returns to the first step
✓ src/pages/PlanEditorPage.test.tsx > PlanEditorPage > opens a day's tab from the address, and the first step for a day that does not exist
      Tests  11 passed (11)
```

**The phone's Back in a test** is the router's: `renderRoutes()` returns it, and `act()`, from `@testing-library/react`, lets React finish drawing before the next line runs:

```tsx
const { router } = renderRoutes(routes, '/plans')
await act(() => router.navigate('/plans/new'))   // the list, then the editor: an entry before it
// … Next, exercises, Create plan …
await act(() => router.navigate(-1))
expect(router.state.location.pathname).toBe('/plans')   // not the editor
```

The first `navigate` is there so the history has something before the editor; started at `/plans/new`, Back would have nowhere to go and prove nothing.

**A tab with a red dot has a longer name.** The dot carries a hidden text for screen readers, so the tab of Day A with an error is named "Day A – Push Some fields need fixing: they are marked in red.": the test finds it by the start of its name, `{ name: /^Day A – Push/ }`, and checks the hidden text with `within(tab)`.

All 11 passed at the first run. Three lines broken on purpose, then put back:

| Line changed | Test that failed |
|---|---|
| `if (openDay !== null && fromPlan) await navigate(-1)` removed | `creates a plan…`: `AssertionError: expected '/plans/new' to be '/plans'`, Back from the saved plan reopening the editor |
| `replace: true` → `false` in `goToDay` from a tab | `goes from tab to tab…` (first pass, same line): `TestingLibraryElementError: Unable to find a label with the text of: Name`, Back landing on Day A instead of the details |
| `day.items.length > 0` → `< 0` in `chooseCount` (never asks) | `asks before removing days…`: `Unable to find role="alertdialog" and name "Remove Day B – Legs?"` |

### H3.22.5 Looking at it

Photographed as in [H3.15.10](#h31510-fourth-pass-looking-at-the-screen-for-real), this time on the Windows PC: a throw-away `frontend/preview-tmp/` drew `PlanEditorPage` in a memory router, in Italian, with the user and the tests' plan put straight into the query cache (`queryClient.setQueryData(planKeys.detail('plan-ppl', 'it'), testPlan())`), and `?day=` or `?new=1` in the page's address choosing the step. A host page held two `<iframe>`s, 360 and 1000 px wide. On Windows, Chrome is `C:\Program Files\Google\Chrome\Application\chrome.exe`; from Git Bash:

```sh
npx vite build --config preview-tmp/vite.config.ts
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --allow-file-access-from-files \
  --hide-scrollbars --window-size=1400,1100 --virtual-time-budget=5000 \
  --screenshot="D:/…/preview-tmp/dist/shot-plan.png" "file:///D:/…/preview-tmp/dist/host-plan.html"
```

The paths given to Chrome are Windows paths with forward slashes (`cygpath -m "$PWD"` turns Git Bash's `/d/…` into `D:/…`).

**What the photos showed.** Step 1 at 360 px: the fields one under the other, **Numero di giorni** with its select, a name field per day, **Avanti: gli esercizi** on the right; at 1000 px the day names two by two. Step 2: **Torna ai dati della scheda**, the tabs, the exercises under them, at both widths. One fault, in the first pass: on a new plan **two lime buttons**, **Crea scheda** in the bar and **Avanti** under the days, the very thing H3.15.10 had removed from workout mode. Save is now outlined in step 1 (`saveVariant` in `PlanEditor`), and lime again in step 2, where it is the last thing to do.

**An error met at the end:** `rm -r preview-tmp` answered `rm: cannot remove 'preview-tmp': Device or resource busy`. On Windows a folder cannot be deleted while a program has it as its current folder, and the shell had been left inside it by a `cd`. Once the shell was elsewhere, `rmdir preview-tmp` removed it (by then empty).

### H3.22.6 Checking in the browser

With `make start`, at http://localhost:5673/plans, at a phone's width too ([H3.8.1](#h381-phone-tablet-and-desktop-widths)):

- **New plan:** a name; **Number of days** → 3: "Day B" and "Day C" appear, renamed at will; **Create plan** is outlined, **Next: the exercises** lime. **Next**: the tabs, Day A open, the address ends in `?day=1`, **Create plan** lime. **Add exercises** on two tabs, **Create plan**: the plan's page. Back: the plan list, not the editor.
- **Edit** a plan: **Next**, the tab of the second day, the third. The phone's (or browser's) Back: the details, not the second day.
- **Fewer days:** from 3 to 2 when Day C has exercises: the dialog; **Cancel** keeps it, **Remove** removes it; **Discard changes** brings everything back.
- **The rules:** clear the plan's name, go to the exercises, **Save**: back on the details, the name red. Type `10-8` as reps on a tab and save from the details: that tab opens with a red dot, the set red.
- **Reload** on `?day=2`: the same tab, the draft kept; **Back to the plan's details** stays in the editor.

### H3.22.7 The checks

**`make toc` did nothing on Windows.** After adding C1.16.7 and this section, `make toc` answered `Contents up to date.`, and the lists had neither. On the Windows PC Git checks files out with CRLF line endings (`git config core.autocrlf` says `true`); `scripts/docs-toc.mjs` split the text on `\n`, so every line kept a `\r`, and its pattern for a heading, `/^(#{1,6}) (.+)$/`, never matched: in JavaScript `.` does not match `\r`, so `(.+)$` cannot reach the end of the line. No headings, no list to compare, "up to date", and `make check` passed on the PC with lists that would fail on the Mac. The script now turns `\r\n` into `\n` when it reads a file and writes it back with the endings it had:

```sh
node scripts/docs-toc.mjs --check
```

```
Contents out of date in: docs\concepts\C1-frontend.md, docs\how-to\H3-frontend.md
Run: make toc
```

Then `make toc` wrote both, and `--check` says `Contents up to date.` for real. Only these two were out of date: the lists written on the Mac were all correct.

`make check`: everything passes, with 245 backend tests (unchanged) and 228 frontend tests (3 new).

## H3.23 Creating an exercise from the picker, as built

Writing a real plan into the editor, some exercises were not in the library, or not under the name of the plan. The plan editor's picker now offers **Create «…»** after a search: the exercise editor's form opens inside the window, and the new exercise goes into the day ([C1.16.8](../concepts/C1-frontend.md#c1168-creating-an-exercise-from-the-picker)). It came with the search of [H1.16](H1-database.md#h116-the-search-text-as-built) and the extra exercises of [H1.17](H1-database.md#h117-the-extra-exercises-as-built), which make the button needed less often.

| File | Change |
|---|---|
| `src/components/plans/editor/ExercisePicker.tsx` | **Create «…»** under the list; the form in place of the list; the title "New exercise" |
| `src/components/exercises/ExerciseForm.tsx` | `onCancel`, for a form in a window; `@container` and `@xl:grid-cols-3` |
| `src/i18n/locales/*.json` | `plans.editor.picker.backToSearch`, `createDescription`; the button reuses the library's `exercises.createNamed` |
| `src/pages/PlanEditorPage.test.tsx` | 1 test |

### H3.23.1 The order of building

1. **`ExerciseForm` first:** `cancelTo` optional, `onCancel` added. With `onCancel` the Cancel button is a `<Button type="button">`: inside a `<form>`, a button without a type submits it.
2. **The picker:** a state `creating`, the button under the list, the form in its place. The state first lived in the list's component, `PickerBody`; the photos (H3.23.3) moved it up to `ExercisePicker`, which draws the title.
3. **The texts**, the test, a look at a phone's and a laptop's width.

### H3.23.2 The test, and proving it can fail

The test types a search that finds nothing, creates the exercise in the window, and checks both requests: the exercise's, then the plan's with the new exercise's id.

```tsx
'GET /api/exercises': exercisePage([]),
'POST /api/exercises': { status: 201, body: { data: testExercise({ id: 77, name: 'Frog stand', logging_type: 'time', photos: [], is_mine: true }) } },
…
await user.type(within(dialog).getByRole('searchbox', { name: 'Search exercises' }), 'frog stand')
await user.click(await within(dialog).findByRole('button', { name: 'Create «frog stand»' }))
expect(within(dialog).getByLabelText('Name')).toHaveValue('frog stand')
await user.selectOptions(within(dialog).getByLabelText('Logged as'), 'Time')
await user.click(within(dialog).getByRole('button', { name: 'Create exercise' }))
expect(await screen.findByRole('button', { name: /^Frog stand/ })).toBeInTheDocument()
```

`fixedLists` (from `src/test/exercise-helpers.ts`) gives the muscles and the equipment, which the form reads. `within(dialog)` keeps every query inside the window, where the form's "Name" is: the plan's own "Name" field is not on this step, but it would be ambiguous otherwise.

```sh
npx vitest run src/pages/PlanEditorPage.test.tsx
```

```
      Tests  12 passed (12)
```

It passed at the first run; broken on purpose, `onAdd(replacing ? [exercise] : chosen)` (the new exercise left out), it fails as it should:

```
× creates an exercise from the picker's search, and puts it in the day
TestingLibraryElementError: Unable to find role="button" and name `/^Frog stand/`
```

### H3.23.3 Looking at it

Photographed as in [H3.22.5](#h3225-looking-at-it), with two tricks more, since the picker reads the API and needs a search typed:

- **No server: a fake `fetch`.** The throw-away page replaced `window.fetch` with a function answering `/api/exercises` with an empty page and `/api/muscles`, `/api/equipment` with the tests' lists (`exercisePage([])`, `fixedLists`), the same answers the tests give.
- **Typing into a React field from outside.** Setting `input.value = '…'` is not seen by React, which tracks the value itself. The page used the browser's own setter, then an `input` event, as a keystroke does:

```ts
Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'ponte completo')
input.dispatchEvent(new Event('input', { bubbles: true }))
```

A second timer then clicked **Crea «ponte completo»**, and a third scrolled the window to its end.

**What the photos showed**, at 360 and 1000 px: the button under the empty list, under "Prova un'altra parola, oppure crealo come esercizio tuo."; then the form, scrolling inside the window. Two faults:

- **The title still said "Aggiungi esercizi"** over the form. The state moved up to `ExercisePicker`, which now shows "Nuovo esercizio" and "Viene salvato tra i tuoi esercizi.".
- **On the laptop the three selects sat side by side in a 512 px window**, "Peso × ripetizioni" cut off: `sm:grid-cols-3` looked at the screen. With container queries ([C1.16.8](../concepts/C1-frontend.md#c1168-creating-an-exercise-from-the-picker)) they stack in the window and stay side by side on the editor's page.

One photo of the four came out black: headless Chrome's virtual time sometimes ends before the window's opening animation. Taking it again, or a longer `--virtual-time-budget`, is enough.

### H3.23.4 Checking in the browser

With `make start`, a plan's exercises step, **Add exercises**:

- search "ponte completo": the full bridge of the extra exercises is there; search "ponte xyz": nothing, **Crea «ponte xyz»**;
- the form: the name filled, **Si registra a** → Tempo, **Crea esercizio**: the window closes, the exercise is in the day, with the other ones ticked before;
- **Annulla** in the form: back to the search, as it was;
- in the library, filter **Miei**: the new exercise is there.

### H3.23.5 The checks

`npx vitest run`: 229 tests, all passing; `npx tsc -b` and `npm run lint` clean. `make check` for the whole task: [H1.17](H1-database.md#h117-the-extra-exercises-as-built) and here.

## H3.24 Set types, the RPE switch and the stopwatch, as built

Three changes asked for while writing a real calisthenics plan into the app: the set types' letters (W, D, F) meant nothing to someone who did not know them; the RPE field took room in every row for a number never used; and an exercise done "as fast as possible", or held for 30 seconds, only had a box to type its seconds into. How they work: [C1.16.9](../concepts/C1-frontend.md#c1169-set-types-and-the-rpe-field) and [C1.17.8](../concepts/C1-frontend.md#c1178-the-stopwatch-of-a-timed-set); how they look: [D1.4.8](../design/D1-ui.md#d148-plan-editor), [D1.4.9](../design/D1-ui.md#d149-workout-mode).

> **Later:** the stopwatch described here was full screen, with a ring. After a real workout it was docked at the bottom, with a bar and Pause, and the column "Sec" became "Time" ([H3.32](#h332-workout-mode-after-a-real-workout-as-built)). This section stays as it was built: its commands and errors still teach.

| File | Change |
|---|---|
| `backend/database/migrations/…_add_show_rpe_to_users_table.php` | New: `users.show_rpe`, boolean, false |
| `backend/app/Models/User.php`, `database/factories/UserFactory.php` | `show_rpe` fillable, cast to boolean, false in the factory |
| `backend/app/Http/Requests/UpdatePreferencesRequest.php`, `Http/Resources/UserResource.php` | The rule `['sometimes', 'boolean']`; the field in `GET /api/user` |
| `backend/tests/Feature/Auth/CurrentUserTest.php` | `show_rpe` read, saved, refused when not a boolean |
| `frontend/src/components/plans/SetTypeSelect.tsx` | New: the set's number and its list of types |
| `frontend/src/components/plans/plan-draft.ts`, `components/workout/workout-session.ts` | `cycleSetType` replaced by `setSetType`; the stopwatch's type, actions, `stopwatchSeconds()`, `findSet()` |
| `frontend/src/components/plans/editor/*` | `showRpe` passed down; `EditorSet` uses `SetTypeSelect` and hides RPE |
| `frontend/src/components/workout/SetRow.tsx`, `WorkoutScreen.tsx` | `SetTypeSelect`; ▶ on a timed set; the panel drawn while the stopwatch runs |
| `frontend/src/components/workout/StopwatchPanel.tsx` | New: the stopwatch, full screen |
| `frontend/src/components/WorkoutPreferences.tsx`, `api/auth.ts`, `test/auth-helpers.tsx` | The row **RPE in plans**; `show_rpe` in the user's types and the tests' user |
| `frontend/src/i18n/locales/*.json` | `plans.setTypeChoices`, `preferences.rpe`, `rpeHint`, `workout.stopwatch`; the type buttons' names shortened ("…: change the type") |
| Tests | `plan-draft.test.ts`, `workout-session.test.ts` (5 new), `PlanEditorPage.test.tsx` (1 new), `WorkoutPage.test.tsx` (1 new), `ProfilePage.test.tsx` |

### H3.24.1 The order of building

1. **The list of set types**, the smallest: the component, the two reducers' action, the two rows, the tests that clicked the old button.
2. **The RPE switch**: the column first (backend and its test), then the frontend's types, the Profile row, the editor.
3. **The stopwatch**: the reducer's actions and their tests, then the panel, the ▶ button, the page's test.
4. **A look** at a phone's and a laptop's width, then the docs.

### H3.24.2 The column `show_rpe`

A preference is a column of `users`, as the five of workout mode ([H3.21](#h321-the-workout-preferences-as-built)). The migration, from the repository's root:

```sh
docker compose exec backend php artisan make:migration add_show_rpe_to_users_table --table=users
```

```
   INFO  Migration [database/migrations/2026_11_10_124025_add_show_rpe_to_users_table.php] created successfully.
```

`--table=users` writes `Schema::table('users', …)` in both `up()` and `down()`, ready for a change to an existing table. Filled in: `$table->boolean('show_rpe')->default(false)` and `$table->dropColumn('show_rpe')` ([D3.3](../design/D3-data-model.md#d33-users-and-preferences)).

```sh
docker compose exec backend php artisan migrate
```

```
   INFO  Running migrations.

  2026_11_10_124025_add_show_rpe_to_users_table ................. 52.53ms DONE
```

Then the four places a preference must be named, the same as for H3.21's five: `#[Fillable([...])]` and `casts()` on the model (without the first, `$user->update($request->validated())` would ignore it silently, the trap of H3.21.2), the factory's defaults, the request's rule, the resource's field. The test adds `['show_rpe' => true]` to the preferences saved one at a time, `'show_rpe' => 'maybe'` to those refused, and `assertJsonPath('data.show_rpe', false)` to the user read:

```sh
docker compose exec backend php artisan test --filter=CurrentUserTest
```

```
  Tests:    8 passed (54 assertions)
```

On the Mac, or any other copy of the database: `make migrate`.

### H3.24.3 The list of set types

**The component first.** Profile's Select (`components/ui/select.tsx`) was the starting point: a list with keyboard and screen-reader support, already tested in jsdom (H3.21). Its trigger, though, is a bordered field with a chevron; for a 48 px square the trigger is taken from Radix directly, with `asChild` on our `Button` ([C1.16.9](../concepts/C1-frontend.md#c1169-set-types-and-the-rpe-field)):

```tsx
import { Select as SelectPrimitive } from 'radix-ui'
…
<SelectPrimitive.Trigger asChild>
  <Button variant={variant} size="icon-xl" aria-label={label}>…</Button>
</SelectPrimitive.Trigger>
```

**Then the action.** `cycleSetType` worked out the next type; `setSetType` receives it. Both reducers changed the same way, and TypeScript listed every place still sending the old one:

```sh
npx tsc -b
```

```
src/components/plans/plan-draft.test.ts(139,41): error TS2322: Type '"cycleSetType"' is not assignable to type '"replace" | "addExercises" | … | "setSetType"'.
src/components/workout/workout-session.test.ts(120,35): error TS2322: Type '"cycleSetType"' is not assignable to type …
src/components/workout/workout-session.test.ts(215,35): error TS2322: Type '"cycleSetType"' is not assignable to type …
```

The actions being a discriminated union ([C1.16.2](../concepts/C1-frontend.md#c1162-the-draft-and-its-reducer)), a removed action is a compile error wherever it is still used, not a silent no-op.

**The tests that clicked the button.** The button is now a combobox, and choosing is two taps:

```tsx
await user.click(screen.getByRole('combobox', { name: 'Set 1, normal: change the type' }))
await user.click(await screen.findByRole('option', { name: /^Warm-up/ }))
expect(screen.getByRole('combobox', { name: 'Set 1, warm-up: change the type' })).toHaveTextContent('W')
```

`findByRole` waits for the list, which Radix draws a moment after the tap; the option's name is its whole text, "Warm-up Light, before the working sets; not counted", hence the regular expression. The names lost "tap to": "Set 1, normal: change the type".

### H3.24.4 The RPE field

`PlanEditor` reads `user.show_rpe` and passes it down as `showRpe`, beside `unit`, through `EditorDays`, `EditorDay` and `EditorItem` to `EditorSet`, which adds the RPE field only when told. `EditorItem` also shows it when a set already has an RPE, read once with `useState(() => …)` ([C1.16.9](../concepts/C1-frontend.md#c1169-set-types-and-the-rpe-field)).

The test edits a plan whose bench press has an RPE on its first set and whose squat has none, with the preference off (the tests' user, `testUser`, now has `show_rpe: false`, as a new account):

```tsx
expect(screen.getByLabelText('Set 1, RPE')).toHaveValue('8')
await user.clear(screen.getByLabelText('Set 1, RPE'))
expect(screen.getByLabelText('Set 1, RPE')).toHaveValue('')          // still there once emptied
expect(screen.getAllByLabelText(/^Set 1, Reps/)).toHaveLength(2)     // both exercises open
expect(screen.getAllByLabelText('Set 1, RPE')).toHaveLength(1)       // the squat has none
```

The first test of the file, which types an RPE, now signs in as `signedInAs({ ...testUser, show_rpe: true })`.

### H3.24.5 The stopwatch

**The reducer first, without React** ([C1.17.8](../concepts/C1-frontend.md#c1178-the-stopwatch-of-a-timed-set)): the `Stopwatch` type, `stopwatch?` on `ActiveSession` (optional: workouts already kept on a phone have none), `null` in `emptySession()`, the three actions and `finish` clearing it. The tests build a free workout with a timed exercise:

```ts
const hold = exerciseFrom(testExercise({ id: 90, name: 'Dead Hang', logging_type: 'time' }), [], { unit: 'kg', language: 'en', defaultRestSeconds: 60 })
const session = run(startFreeSession(START), { type: 'addExercises', exercises: [hold] }, …)
```

and check the moments with `at(seconds)`, ISO text that many seconds after the start: started at `at(10)`, stopped at `at(42.7)`, the set reads `'32'`, is done, and the rest ends at `at(102.7)`.

**Then the panel**, `StopwatchPanel.tsx`, and in `WorkoutScreen` the lookup of the set by its id and the panel drawn while `session.stopwatch` is set. `SetRow` got ▶ (lucide's `Play`, filled with `fill-current`) and `SetHeader` an empty title above it, so the columns stay aligned.

**The page's test** stores a free workout with a dead hang done 45 seconds last time, taps ▶, and reads the panel:

```tsx
await user.click(await screen.findByRole('button', { name: 'Start the stopwatch: Set 1' }))
const panel = screen.getByRole('dialog', { name: 'Dead Hang' })
expect(within(panel).getByRole('timer')).toHaveTextContent('0:00')
expect(within(panel).getByText('Target 0:45')).toBeInTheDocument()
expect(loadActiveSession()?.stopwatch?.target).toBe(45)
await user.click(within(panel).getByRole('button', { name: 'Stop' }))
expect(screen.getByRole('button', { name: 'Set 1, Sec: 1' })).toBeInTheDocument()
```

Stop comes a few milliseconds after ▶, so the set gets the minimum, one second: no fake clock is needed to check that the time reaches the set.

```sh
npx vitest run src/components/workout src/pages/WorkoutPage.test.tsx
```

```
 Test Files  3 passed (3)
      Tests  49 passed (49)
```

### H3.24.6 Proving the tests can fail

Everything passed at the first run, so each new rule was broken on purpose, the test run, the code put back.

- **Stop without the tick** (the line calling `toggleSet` removed):

```
     × stops: the time goes into the set, which is ticked, and the rest starts 5ms
     × times a hold with the stopwatch, which fills the set and ticks it 163ms
      Tests  2 failed | 47 passed (49)
```

- **RPE always shown** (`const withRpe = true`):

```
     × hides the RPE field unless wanted, or already filled in 256ms
TestingLibraryElementError: Found multiple elements with the text of: Set 1, RPE
```

- **An RPE already there hidden** (`const withRpe = showRpe`):

```
     × hides the RPE field unless wanted, or already filled in 272ms
TestingLibraryElementError: Unable to find a label with the text of: Set 1, RPE
```

### H3.24.7 Looking at it

Photographed as in [H3.22.5](#h3225-looking-at-it): a throw-away `frontend/preview-tmp/` with three pages (the editor with a plan put into the query cache, workout mode with a workout put into `localStorage`, Profile's card), a host page with two `<iframe>`s, 360 and 1000 px, and headless Chrome. The stopwatch was photographed running by storing the workout with `stopwatch.started_at` 21 seconds in the past and a target of 30. Two things met on the way:

- **The first photos had no styles at all**: text one line after another, the buttons bare. The preview's `vite.config.ts` had `root: 'preview-tmp'`, and Tailwind 4 looks for the classes to generate in the files under Vite's root: none of `src/` was scanned, so the CSS held almost nothing. With `root` set to `frontend/` (the pages given as `preview-tmp/editor.html`…), every class was found. The earlier previews had their root at `frontend/` for this reason.
- **Opening the list from a script.** Radix's Select opens on `pointerdown`, not on `click`, so `button.click()` did nothing; the page sent the events a finger does: `new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' })`, then `pointerup`.

**What the photos showed.** The editor at 360 px: the list under set 2, "Normale" ticked, the four types with their letters and lines, the hint wrapping on two lines for Drop set; the bench press with its RPE (one set has it) and the failure set's lime F. Workout mode: ▶ before ✓ on the sets not done, the done one keeping the place empty, the columns aligned with their titles at both widths. The stopwatch: 0:27 in a ring three quarters full, "Obiettivo 0:30", "Ultima volta 0:30", Stop lime and Cancel outlined. Profile: **RPE nelle schede** last in the card. One fault: its hint, which also explained the rule of an RPE already there, ran to four lines on a phone; it now says only what the field is ("Uno sforzo da 1 a 10 accanto alle ripetizioni, nell'editor della scheda.").

`rm -rf preview-tmp` at the end failed once more with `Device or resource busy`, the shell having been left inside its `dist/` by a `cd` ([H3.22.5](#h3225-looking-at-it)); out of it, the folder went.

### H3.24.8 Checking in the browser

With `make start` (and `make migrate` first on another computer):

- **Set types**: a plan's exercises step, open an exercise, tap a set's number: the list; **Riscaldamento**: the number becomes W, grey. Same in workout mode, on the first column.
- **RPE**: in a plan with no RPE, no RPE field. Profile → **RPE nelle schede** on: the field is there. Off again, a plan with an RPE saved: shown on that exercise only.
- **The stopwatch**: an exercise logged by time ("Appeso alla sbarra", or your own "50 push up" logged by time), Start: ▶ on each set. Tap it: full screen, the time running; with the set at 30, the ring fills, beeps at 0:30 (sound on in Profile), "Obiettivo raggiunto". **Stop**: the set has the seconds, ticked, the rest bar running. Start another, turn the screen off for a while, back: the time has kept counting. **Annulla**: the set as before.

### H3.24.9 The checks

```sh
docker compose exec backend php artisan test
npx vitest run
```

```
  Tests:    255 passed (17374 assertions)
 Test Files  28 passed (28)
      Tests  236 passed (236)
```

Then `make toc` for the new headings, and `make check`.

## H3.25 Exercises done as fast as possible, as built

A plan with 9 exercises out of 21 written "50 push-ups", "50 sit-ups", "50 squat jumps", each as fast as possible. A switch on the plan's item marks them; workout mode times them with the stopwatch of [H3.24](#h324-set-types-the-rpe-switch-and-the-stopwatch-as-built), and saves the reps and the time together. How it works: [C1.17.9](../concepts/C1-frontend.md#c1179-exercises-done-as-fast-as-possible); how it looks: [D1.4.8](../design/D1-ui.md#d148-plan-editor), [D1.4.9](../design/D1-ui.md#d149-workout-mode).

| File | Change |
|---|---|
| `backend/database/migrations/…_add_for_time_to_plan_items_table.php` | New: `plan_items.for_time`, boolean, false |
| `backend/app/Models/PlanItem.php`, `database/factories/PlanItemFactory.php` | Fillable, cast to boolean; false in the factory |
| `backend/app/Http/Requests/PlanRequest.php`, `Actions/Plans/SavePlan.php`, `Http/Resources/PlanItemResource.php` | The rule `['sometimes', 'boolean']`, the value saved (false when missing), the field sent |
| `backend/app/Http/Requests/SaveSessionRequest.php` | `duration_seconds` optional on `weight_reps` and `reps` |
| `backend/app/Actions/Workouts/FindLastSets.php` | Last time of each exercise **and kind** |
| `frontend/src/api/plans.ts`, `components/plans/plan-draft.ts` | `for_time`; `canBeForTime()`; the action `setItemForTime` |
| `frontend/src/components/plans/editor/EditorItem.tsx`, `plan-format.ts` | The switch; its words in the exercise's line |
| `frontend/src/components/workout/workout-session.ts` | `isForTime()`, `lastOfKind()`; `canComplete()` and `toSessionInput()` with the seconds |
| `frontend/src/components/workout/set-fields.ts`, `SetRow.tsx`, `SetStepper.tsx`, `WorkoutScreen.tsx`, `StopwatchPanel.tsx` | Reps and seconds, ▶, no Last; the stopwatch's race |
| `frontend/src/components/history/compare.ts`, `components/workout/set-text.ts` | `hasTimedSets()`, the score of a race, last time of the same kind; "50 in 1:12" |
| `frontend/src/i18n/locales/*.json` | `plans.editor.forTime`, `forTimeHint`, `plans.detail.forTime`, `workout.repsInTime`, `workout.stopwatch.toBeat`, `over`, `goal` |
| Tests | 2 backend tests new, 2 changed; 10 frontend tests new |

### H3.25.1 The order of building

1. **The backend:** the column, the plan's rule and save, the set's seconds, last time of each kind; their tests.
2. **The plan:** types, draft, switch, the exercise's line.
3. **Workout mode:** `isForTime()` and what follows from it, then the stopwatch's race.
4. **History:** the set's text, the comparison.
5. **The tests,** then each new rule broken on purpose; a look at a phone's and a laptop's width; the docs.

### H3.25.2 The backend: a column, a rule, and last time of each kind

```sh
docker compose exec backend php artisan make:migration add_for_time_to_plan_items_table --table=plan_items
```

```
   INFO  Migration [database/migrations/2026_11_10_131111_add_for_time_to_plan_items_table.php] created successfully.
```

`$table->boolean('for_time')->default(false)` in `up()`, `dropColumn('for_time')` in `down()`, then:

```sh
docker compose exec backend php artisan migrate
```

```
  2026_11_10_131111_add_for_time_to_plan_items_table ............ 56.37ms DONE
```

**The plan.** `PlanItem`'s `#[Fillable]` and `casts()` (`'for_time' => 'boolean'`), the factory's default, `PlanRequest`'s rule, `SavePlan`'s `fill()` with `$itemData['for_time'] ?? false`, the resource's field. The rule is `sometimes`, not `required`: a phone with the app of yesterday, which does not send it, still saves its plans, as false.

**The set.** A set of 50 push-ups in 1:12 has `reps` and `duration_seconds`. `SaveSessionRequest` refused that: on an exercise logged by reps, any field but the reps and the weight had to be empty (`OPTIONAL_BY_LOGGING`, [C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)). One line each:

```php
'weight_reps' => ['weight_kg', 'duration_seconds'],
'reps' => ['weight_kg', 'duration_seconds'],
```

One case of the test "asks for the values that fit how the exercise is logged" checked exactly what is now allowed, `'reps only, with a time'`; it became `'reps only, with meters'`, still refused, and a new test saves 50 in 72 seconds.

**Last time of each kind** ([D3.6.4](../design/D3-data-model.md#d364-how-the-screens-use-these-tables)). `FindLastSets` kept the latest workout of each exercise with `distinct on (exercise_id)`. Now the kind is a second key, an SQL expression true when one of the sets has seconds:

```php
$timed = 'exists (select 1 from logged_sets as timed_sets where timed_sets.session_exercise_id = session_exercises.id and timed_sets.duration_seconds is not null)';

->selectRaw("distinct on (session_exercises.exercise_id, {$timed}) session_exercises.id, …")
…
->orderBy('session_exercises.exercise_id')
->orderByRaw($timed)
->orderByDesc('workout_sessions.started_at')
```

Postgres asks that the expressions of `distinct on` be the first ones of `order by`, in the same order: hence the expression in a PHP variable, written twice. The table name `timed_sets` is an alias, so that the subquery's `logged_sets` is not confused with any other.

The test: push-ups 50 in 1:12 two days ago, 3 × 15 yesterday, two entries back. The 72 seconds are written with a plain update after `workoutOf()`, the test file's helper, which only knows reps.

```sh
docker compose exec backend php artisan test --filter='SavePlanApiTest|SaveSessionApiTest|SessionReadApiTest'
```

```
  Tests:    55 passed (233 assertions)
```

Broken on purpose, back to `distinct on (session_exercises.exercise_id)` without the `orderByRaw`:

```
  FAILED  Tests\Feature\Workouts\SessionReadApiTest > it gives last time of…
  Failed asserting that actual size 1 matches expected size 2.
```

On another computer: `make migrate`.

### H3.25.3 The plan: draft and switch

`PlanItem` gains `for_time`; `DraftItem` gains `for_time?`, optional because a draft kept in the browser (`atleoplan.planDraft.…`, [C1.16.4](../concepts/C1-frontend.md#c1164-the-draft-kept-in-the-browser)) before this change has none, and `undefined === true` is false: nothing breaks. One helper says where the switch makes sense:

```ts
export function canBeForTime(loggingType: LoggingType): boolean {
  return loggingType === 'weight_reps' || loggingType === 'reps'
}
```

`toPlanInput()` sends `item.for_time === true && canBeForTime(…)`. `EditorItem` draws the switch above the sets (they are what it changes), as a row with a timer icon, a `<Label htmlFor>` and the hint linked by `aria-describedby`; the test finds it as `getByRole('switch', { name: 'As fast as possible' })`.

**The texts came last, and TypeScript said so.** The keys were used before being written in the JSON files; i18next's types (C1.7) know every key, so:

```
src/components/plans/editor/EditorItem.tsx(172,81): error TS2345: Argument of type '["plans.editor.forTime"]' is not assignable to parameter of type …
      Type '"plans.editor.forTime"' is not assignable to type '"nav.label" | … | ("nav.label" | ... 486 more ... | TemplateStringsArray)[]'. Did you mean '"plans.editor.rpe"'?
```

A misspelt key is a compile error, not an English key shown on screen.

### H3.25.4 Workout mode

> **Later:** the stopwatch's ring is now a bar, the panel docked at the bottom, and the column "Sec" is "Time" ([H3.32](#h332-workout-mode-after-a-real-workout-as-built)).

One function, `isForTime(item)`, and every piece asks it: `fieldsFor()` gives `[reps, seconds]`; `SetRow` and `SetHeader` show ▶ and drop the Last column; `canComplete()` wants the seconds; `toSessionInput()` sends them. The row at 360 px was worked out first: the number 48 px, Last 64, ▶ and ✓ 48 each, five gaps of 8: two fields beside all that would be 32 px each, too narrow for a thumb; without Last, 68. Last time's time stays in sight: it fills the seconds' field, the time to beat.

**Last time of the same kind.** The answer of `last-sets` may now have two entries for one exercise. Every place that did `lastSets.find(entry => entry.exercise_id === id)` would take whichever came first; they go through `lastOfKind(lastSets, id, timed)` instead, with `hasTimedSets()` of `compare.ts`. Three places in `workout-session.ts` (start, Add exercises, Swap) and one in `compare.ts` (`compareWorkout`, for the summary and history). `grep` found them:

```sh
grep -rn "exercise_id === " src --include=*.ts --include=*.tsx
```

**The stopwatch's race.** `StopwatchPanel` gets `race: { reps } | null`: "Set 2 · 50 reps" under the title; "To beat 1:12", then "0:14 over"; no beep (`isRace` in the effect's dependencies, so the timer is not even set).

**"50 in 1:12"** comes from `set-text.ts`, a plain function used by the stepper's "Last", history and the summary. It has no hook to translate with, so it calls the i18next instance itself, with the language it is given:

```ts
import i18n from '@/i18n'
…
if (set.duration_seconds !== null) return i18n.t('workout.repsInTime', { lng: language, reps, time: clock(set.duration_seconds) })
```

### H3.25.5 The tests, and proving they can fail

They passed at the first run but one, a property that does not exist (`set.session_id` on a `LoggedSet`), which `npx tsc -b` caught before Vitest ran:

```
src/components/workout/workout-session.test.ts(206,42): error TS2339: Property 'session_id' does not exist on type 'LoggedSet'.
```

Then each rule broken, the tests run, the code put back:

- **`isForTime()` always false:**

```
     × starts with last time done the same way: its time is the one to beat 4ms
     × needs the seconds to tick a set, and sends them with the reps 2ms
     × races an exercise done as fast as possible against last time 37ms
      Tests  3 failed | 50 passed (53)
```

- **The race's score with the seconds not negated** (`[weight, reps, set.duration_seconds]`: the slower would win):

```
     × reps for time: the same reps in less time wins 4ms
     × compares with last time done the same way: for time, or for reps 3ms
      Tests  2 failed | 8 passed (10)
```

### H3.25.6 Looking at it

As in [H3.24.7](#h3247-looking-at-it), with Vite's root at `frontend/` from the start: the editor with a plan whose first exercise is push-ups for time, put into the query cache; workout mode with a day of push-ups 3 × 50 for time, last time 72, 75, 80 seconds, its first set done, and the stopwatch stored as running for 40 seconds, then 83.

**What the photos showed.** The editor, at 360 and 1000 px: the switch in a grey band above the sets, on, its hint on three lines on a phone; the exercise's line "1 × 50 · nel minor tempo · 90 s". Workout mode: "Serie, Rip., Sec" over the rows, 50 and 75 in each, ▶ and ✓, the done row lime; the fields wide enough at 360 px. The stopwatch at 0:46: "Serie 2 · 50 ripetizioni", the ring two thirds full, "Da battere 1:15". One fault, at 1:29: "0:14 in più" in red, but the ring **full and lime**, the colour of a target reached. Once a race's time is gone the ring now turns red as well (`stroke-destructive`).

**At the first real use** the line read "1 × 50 · for time · 90 s" (the app was in English), and "for time" said little to someone who had just turned on "As fast as possible". The line now uses the switch's own words in every language: "as fast as possible", "nel minor tempo possibile", "lo más rápido posible", "so schnell wie möglich" (`plans.detail.forTime`).

### H3.25.7 Checking in the browser

With `make start` (`make migrate` first on another computer):

- **The plan:** edit it, the exercises step, open push-ups: **Nel minor tempo possibile** on, the sets at 50. The line says "nel minor tempo possibile". Save; on the plan's page, the same line.
- **Workout:** Start that day. Push-ups: Rip. and Sec, no Ultima. ▶: "Serie 1 · 50 ripetizioni"; with no time yet, no ring target. **Stop**: the set ticked, 50 and the seconds, the rest running.
- **The next time:** the seconds' field holds last time's, the stopwatch says "Da battere …"; past it, red.
- **History:** the workout's page writes "50 in 1:12"; the verdict is better with less time. A day with push-ups for reps keeps comparing with the days done for reps.

### H3.25.8 The checks

```sh
docker compose exec backend php artisan test
npx vitest run
```

```
  Tests:    257 passed (17384 assertions)
 Test Files  28 passed (28)
      Tests  246 passed (246)
```

Then `make toc` and `make check`.

## H3.26 Plan files, export and import, as built

To move a real plan from the development server to production without writing it again: **Export** on a plan's page saves it as `<name>.atleoplan.json`, **Import plan** on the list makes a new plan of such a file. The file holds the plan and a description of each exercise it uses, so that the import finds each one, or creates it as the user's own, without photos. The format: [D3.5.8](../design/D3-data-model.md#d358-the-plan-file); why JSON: [D2.9](../design/D2-decisions.md#d29-plan-files); the endpoints: [C2.5.8](../concepts/C2-backend.md#c258-a-plan-as-a-file); the screens: [C1.15.6](../concepts/C1-frontend.md#c1156-a-plan-as-a-file-export-and-import).

| File | Change |
|---|---|
| `backend/app/Actions/Plans/ExportPlan.php` | New: the plan as the file's content |
| `backend/app/Actions/Plans/ImportPlan.php` | New: a file as a new plan, each exercise found or created |
| `backend/app/Http/Requests/ImportPlanRequest.php` | New: the file's rules |
| `backend/app/Http/Requests/PlanRequest.php` | The rules of an item and its sets moved into `static itemRules($prefix)`, shared |
| `backend/app/Http/Controllers/PlanController.php`, `routes/api.php` | `export()`, `import()`; `GET /api/plans/{plan}/export`, `POST /api/plans/import` |
| `backend/tests/Feature/Plans/PlanFileTest.php` | New: 8 tests, 12 runs with the dataset |
| `frontend/src/lib/download.ts` (+ test) | New: `downloadJson()`, `fileNameOf()` |
| `frontend/src/api/plans.ts` | `fetchPlanFile()`, `useImportPlan()` |
| `frontend/src/components/plans/ExportPlanButton.tsx`, `ImportPlanButton.tsx` | New: the two buttons; Import plan's window (H3.26.10) |
| `frontend/src/components/plans/plan-file.ts` (+ test) | New: the file looked at in the browser before it is sent (H3.26.10) |
| `frontend/src/pages/PlanDetailPage.tsx`, `PlansPage.tsx` (+ tests) | The buttons; the banner after an import |
| `frontend/src/i18n/locales/*.json` | `plans.detail.export`, `exportError`, `plans.import.*` |

### H3.26.1 The order of building

1. **The backend,** export first (it gives a real file to look at), then the import, then the tests.
2. **A round trip on the real plan,** in `tinker`, inside a transaction undone at the end.
3. **The frontend:** download, the two buttons, the banner, the tests.
4. **A look,** then the docs, and the spreadsheet idea in the backlog ([FEAT-8](../project/backlog.md#feat-8-write-a-plan-in-a-spreadsheet-and-import-it)).

### H3.26.2 Export, and the arrow function that lost the exercises

The classes, from the repository's root:

```sh
docker compose exec backend php artisan make:class Actions/Plans/ExportPlan
docker compose exec backend php artisan make:class Actions/Plans/ImportPlan
docker compose exec backend php artisan make:request ImportPlanRequest
```

Each writes an empty class at the path given; run a second time, `make:class` answers `ERROR  Class already exists.` and touches nothing.

`ExportPlan` walks the days and their items, and collects the exercises in an array as it meets them, the first time only (`$exercises[$id] ??= …`). The first try, in `tinker`, on the real plan:

```sh
docker compose exec backend php artisan tinker --execute="app()->setLocale('it'); \$p = App\Models\Plan::query()->latest('updated_at')->first(); \$f = app(App\Actions\Plans\ExportPlan::class)->export(\$p); echo json_encode(['days' => count(\$f['plan']['days']), 'items' => …, 'exercises' => count(\$f['exercises'])]);"
```

```
{"days":3,"items":23,"exercises":0,"own":[]}
```

23 exercises in the plan, none in the list. The days were mapped with an **arrow function**, `fn (PlanDay $day) => [...]`, and the items inside it with a `function (...) use (&$exercises)`. An arrow function captures the variables it uses **by value**: it had its own copy of `$exercises`, the inner function filled that copy by reference, and the copy was thrown away after each day. The outer one is now a `function (PlanDay $day) use (&$exercises) { return [...]; }`, and:

```
{"days":3,"items":23,"exercises":16,"own":[]}
```

16 different exercises, all public, the first one:

```json
{
    "ref": "e1",
    "external_id": "Pullups",
    "name": "Trazioni alla sbarra",
    "logging_type": "reps",
    "equipment": "body-only",
    "muscles": [ { "muscle": "biceps", "role": "secondary" }, { "muscle": "middle-back", "role": "secondary" }, { "muscle": "lats", "role": "primary" } ],
    "description": null,
    "instructions": "…",
    "youtube_url": null
}
```

**The lesson:** `fn () =>` is short for a function that only reads; one that must change an outer variable needs `function () use (&$variable)`, and so does every function around it that passes the variable on.

### H3.26.3 Import: rules shared, actions reused

**The rules.** The plan in a file must follow the editor's rules: the same set fields, limits, supersets of neighbours. They were in `PlanRequest::rules()` under `days.*.items.*.`; they moved into `PlanRequest::itemRules(string $item)`, `public static`, which gives them for any prefix. `PlanRequest` spreads `...self::itemRules('days.*.items.*.')`, `ImportPlanRequest` `...PlanRequest::itemRules('plan.days.*.items.*.')`. The 26 tests of `SavePlanApiTest` passed unchanged after the move, which is what proves a refactoring.

**The exercises.** `ImportPlan::find()` tries, in order: the public exercise with the same `external_id`, one of the user's own with the same name in any language, a public one with that name in the request's language (`whereRaw('lower(trim(name->>?)) = ?', [app()->getLocale(), $name])`: `->>` reads one key of the JSON column as text). None: `SavePersonalExercise::create()`, with muscles and equipment turned from slugs into this server's ids, unknown ones left out.

**The plan.** `SavePlan::create()` receives the editor's shape, the file's references turned into exercise ids. No ids for days and items: `SavePlan` makes them, as for a body sent without (H2.13).

**One transaction around everything.** `SavePlan` and `SavePersonalExercise` each open their own `DB::transaction()`; inside `ImportPlan`'s, Laravel makes them **savepoints**, so a failure at the last set undoes the exercises created at the start.

### H3.26.4 The tests, and a test that passed for the wrong reason

```sh
docker compose exec backend php artisan test --filter=PlanFileTest
```

```
  Tests:    11 passed (90 assertions)
```

The first run before that stopped at once: `ParseError`. `php -l` names the line:

```sh
docker compose exec backend php -l tests/Feature/Plans/PlanFileTest.php
```

```
PHP Parse error:  Unclosed '[' on line 183 does not match ')' in tests/Feature/Plans/PlanFileTest.php on line 189
```

One `]` short in a nested array of the dataset (`'reps upside down'`).

**Broken on purpose,** the first rule switched off (`if (false)` in place of the `external_id` test): all 11 still passed. The file had been exported in English and imported in English, so the third rule, the public exercise by name, found the push-ups anyway. The test now exports in Italian and imports in English (`['Accept-Language' => 'it']`, then `'en'`): "Piegamenti" is no English name, and only the external id can find it. A test of its own covers the third rule. Broken again, one at a time:

```
  ⨯ it imports a file as a new plan, finding the public exercise by its…
  Tests:    1 failed, 11 passed (87 assertions)

  ⨯ it finds a public exercise by its name when the file has it as a pe…
  Tests:    1 failed, 11 passed (92 assertions)
```

**A test name with an apostrophe.** `it('… as someone's own', …)` in single quotes ended the string at the apostrophe: `syntax error, unexpected identifier "s"`. PHP needs `\'` there, as the other tests write `someone else\'s`; the name was reworded.

### H3.26.5 A round trip on the real plan

Export, validate with the import's rules, import, count, and undo, in `tinker`:

```php
DB::beginTransaction();
$res = app(App\Actions\Plans\ImportPlan::class)->import($p->user, $v->validated());
// … count days, items and sets of the new plan and of the original
DB::rollBack();
```

```
valid: yes
days 3, items 23, sets 59, created []
original: days 3, items 23, sets 59
plans after rollback: 4
```

The same plan, every exercise found, nothing left in the database. `ImportPlanRequest::create('/', 'POST', $file)` builds a request from an array, so its `rules()` (which reads the body for the references) can run outside HTTP.

### H3.26.6 The frontend

`downloadJson()` and the two buttons ([C1.15.6](../concepts/C1-frontend.md#c1156-a-plan-as-a-file-export-and-import)). `FormBanner` takes text only (`children: string`), so the banner's sentence is built first:

```
src/pages/PlanDetailPage.tsx(145,13): error TS2322: Type 'string | false' is not assignable to type 'string'.
```

came from `{cond && ' …'}` inside it; a single expression, `cond ? `${a} ${b}` : a`, fixed it.

**Testing a file chosen.** `user.upload(input, file)` does what the picker does, and honours the input's `accept` like the picker: the first version of the test chose `plan.csv` to show a file that is not JSON, and nothing happened at all (`Unable to find role="alert"`). The not-JSON file is now `plan.json` with text that is not JSON. The input is hidden, so not found by role: `document.querySelector('input[type=file]')`.

**Testing a download.** jsdom has no `URL.createObjectURL` and saves nothing: the test gives one that keeps the Blob, and spies on every link's `click()` with `vi.spyOn(HTMLAnchorElement.prototype, 'click')`; `click.mock.contexts[0]` is the link clicked, its `download` the file's name, and the Blob's text the file.

Broken on purpose, a 422 shown as "try again":

```
     × says so when the file is not a plan: not JSON, or refused by the server 109ms
      Tests  1 failed | 6 passed (7)
```

### H3.26.7 Looking at it

As in [H3.24.7](#h3247-looking-at-it), the list and a plan's page with the import's `state` (an entry `{ pathname, state }` in `createMemoryRouter`'s `initialEntries`), at 360 and 1000 px. The list: **Nuova scheda** lime, **Importa scheda** outlined beside it, under it on a phone. The plan: the green banner "Scheda importata. 2 esercizi non c'erano e sono stati creati tra i tuoi: Frog stand, L-sit."; **Esporta** among the actions, before **Elimina**. Nothing to change.

### H3.26.8 Checking in the browser

With `make start`:

- **Export:** a plan's page, **Esporta**: a file `<name>.atleoplan.json` in Downloads. Open it: the days, the sets, `exercises` with `external_id`.
- **Import, same server:** **Importa scheda**, that file: a new plan with the same name, the banner "Scheda importata."; the original untouched.
- **Import, another server:** in production, after `make exercises-import` there (the library and its extras): the same file; exercises missing there appear in the banner and in the library under **Miei**.
- **A wrong file:** any other `.json`: "Questo file non è una scheda esportata da AtleoPlan."

### H3.26.9 The checks

```sh
docker compose exec backend php artisan test
npx vitest run
```

```
  Tests:    269 passed (17477 assertions)
 Test Files  29 passed (29)
      Tests  251 passed (251)
```

Then `make toc` and `make check`.

### H3.26.10 Later: a window before importing

The first Import plan opened the picker at once and sent whatever was chosen: the backend refused anything that was not a plan, but nothing said beforehand what file it wanted, and nothing showed what was about to be imported. Now a window ([C1.15.6](../concepts/C1-frontend.md#c1156-a-plan-as-a-file-export-and-import)):

1. **`plan-file.ts` first,** plain functions and their test, with no React: `readPlanFile(text, bytes)` and the four problems.
2. **`ImportPlanButton` rewritten** as a controlled `Dialog`: the text of what is expected, Choose the file, the preview, Import. The hidden input and the request stay as they were.
3. **The texts:** `plans.import.title`, `description`, `choose`, `chooseAnother`, `confirm`, `cancel`, `summary` (with a plural, and the days from `plans.days`), `refused`, `problems.*`; `plans.import.invalid` went.
4. **The tests** of the page rewritten for the window.

```sh
npx vitest run src/pages/PlansPage.test.tsx src/components/plans/plan-file.test.ts
```

```
      Tests  9 passed (9)
```

**A test that passed for the wrong reason, again** (as in H3.26.4). Broken on purpose, the format no longer checked, both tests still passed: the "file of another app" was `{ format: 'chronovault.export', version: 1 }`, refused anyway because it had no plan inside. The tests now use a real plan file with only its format changed, `{ ...file, format: 'chronovault.export' }`, and the same break gives:

```
     × names the problem of anything else 5ms
     × says why a file is not imported: in the browser first, then the server 1199ms
      Tests  2 failed | 7 passed (9)
```

**Looking at it.** The photos were taken as in H3.24.7, the window opened by a script, and the file "chosen" from the script too: a `DataTransfer` holds a `File`, its `files` are given to the input, and a `change` event makes React read it.

```ts
const data = new DataTransfer()
data.items.add(new File([JSON.stringify(plan)], 'calisthenics-dal-pdf.atleoplan.json', { type: 'application/json' }))
input.files = data.files
input.dispatchEvent(new Event('change', { bubbles: true }))
```

Inside the host page's two `<iframe>`s the window never appeared, whatever the delays; opening `page.html` itself, one window size at a time (`--window-size=1000,760`), it did. At 1000 px: the title, the text "Scegli un file creato con «Esporta» dalla pagina di una scheda: il nome finisce in .atleoplan.json…", **Scegli il file** lime and **Annulla**; then the preview "Calisthenics (dal PDF) · 3 giorni · 23 esercizi" and the file's name, **Importa** lime. At 360 the screenshot came out cut on the right: headless Chrome does not draw a window that narrow, which is why the photos go through `<iframe>`s. On a phone the buttons stack, **Importa** at the bottom (`DialogFooter` is a reversed column below 640 px).

**Checking in the browser:** **Importa scheda**: the window and its text; a photo or a `.csv` renamed `.json`: "non è nemmeno un file JSON", nothing sent (the browser's Network tab shows no request); an exported plan: the preview; **Importa**: the plan's page.

```sh
npx vitest run
```

```
 Test Files  30 passed (30)
      Tests  253 passed (253)
```

---

## H3.27 Loading signs, as built

Searching in the plan editor's picker took a couple of seconds with nothing moving: the old list stayed as it was, then the new one appeared all at once. Many buttons had the same fault: disabled while their request ran, but with nothing saying so. Now every wait has a sign: a spinner in the search box with the list dimmed, and a spinner in place of a button's icon. The rules: [D1.6](../design/D1-ui.md#d16-states-and-edge-cases); how it works: [C1.20](../concepts/C1-frontend.md#c120-showing-that-something-is-loading).

| File | Change |
|---|---|
| `frontend/src/components/ui/spinner.tsx` | New, from shadcn's CLI, then adapted: silent unless given a `label`; sized `h-4 w-4` |
| `frontend/src/components/ui/button.tsx` (+ new test) | `pending`: disabled, `aria-busy`, the spinner in place of the icon |
| `frontend/src/components/ui/alert-dialog.tsx` | `pending` on `AlertDialogAction` |
| `frontend/src/components/exercises/ExerciseSearchBox.tsx` | New: the search box of both screens, with `searching` |
| `frontend/src/components/exercises/ExerciseFilters.tsx`, `pages/ExercisesPage.tsx` (+ test) | The box, `searching` from the typing and from `isPlaceholderData` |
| `frontend/src/components/plans/editor/ExercisePicker.tsx` | The box, the list dimmed, Show more `pending` |
| 17 other pages and components | `disabled={x.isPending}` became `pending={x.isPending}` |
| `frontend/src/i18n/locales/*.json` | `exercises.searching` |

### H3.27.1 The order of building

1. **Where waits are silent.** `grep` for `isPending`, `isFetching`, `isFetchingNextPage`, `mutate(` and `busy` in `src/`, leaving out `src/api/` and the tests: every button that only became disabled, and the two searches.
2. **The pieces:** the spinner, then `pending` on `Button`, then the search box.
3. **Applying them,** page by page, then the tests, then a look.

### H3.27.2 The spinner, from shadcn's CLI

From `frontend/`:

```sh
npx shadcn@latest add spinner --yes
```

```
npm warn exec The following package was not found and will be installed: shadcn@4.23.0
✔ Checking registry.
✔ Created 1 file:
  - src\components\ui\spinner.tsx
```

shadcn's file is eight lines: Lucide's `Loader2Icon`, `size-4 animate-spin`, `role="status"` and `aria-label="Loading"`, in shadcn's own style (double quotes). It was rewritten whole, in the project's style and with the header and comments of [P1.2](../project/P1-conventions.md#p12-code), so `make fix` ([H3.9](#h39-a-shadcnui-component)) had nothing left to change; `npm run lint` passes on it. Two changes in what it does, explained in the file:

- **The label.** "Loading", in English, inside every button would be read by screen readers whatever the language, and on top of the button's own name. The spinner is now hidden from them (`aria-hidden`) unless given a `label`, and then it is a `role="status"` with that text, translated: `<Spinner label={t('exercises.searching')} />`.
- **The size, found by looking** (H3.27.7). With `size-4` the spinner stayed 16 px inside the 48 px buttons, whose icons are 20 px. The button sizes icons with `[&_svg:not([class*='size-'])]:size-5`: only those with no `size-` in their classes. Written `h-4 w-4`, the same 16 px alone, the spinner falls under that rule and takes each button size's icon size. Given `size-5` (the search box), `cn()` drops `h-4 w-4`. (**Corrected later:** the rule did not apply then, to the spinner or to any icon, because of the quotes written `\'` inside it; the spinner and the icons were 16 and 24 px. Fixed in [H3.28.6](#h3286-a-g-as-big-as-the-page).) From `frontend/`:

```sh
node -e "const {cn}=require('cn'); console.log(cn('h-4 w-4 animate-spin','size-5 absolute'))"
```

```
animate-spin size-5 absolute
```

### H3.27.3 `pending` on Button, and the Slot that counts a `false`

`Button` takes `pending`, sets `disabled={pending || disabled}` and `aria-busy={pending || undefined}`, and draws `{pending && <Spinner />}` before its children. One class added to its base, `aria-busy:[&>svg:not([data-slot=spinner])]:hidden`, hides the button's own icon while it waits (Tailwind's `aria-busy:` variant applies when `aria-busy="true"`).

**The trap:** with `asChild` (`<Button asChild><Link …/></Button>`), Radix's `Slot` takes exactly one child. Written as `{pending && !asChild && <Spinner />}{children}`, the children would be `[false, <Link>]`: `Slot` checks its child with `React.isValidElement`, an array is not one, and since `React.Children.count` counts the `false` as a node, it throws. So with `asChild` the children are passed alone, and only otherwise as `<>{pending && <Spinner />}{children}</>`. The third test of `button.test.tsx` draws a link through `asChild` to keep it so.

`AlertDialogAction` is a `Button asChild` around Radix's `Action`, so `Button` cannot add the spinner there: the Action gets `pending` itself, and puts the spinner inside.

### H3.27.4 The search box: two moments

The library and the picker had the same box, written twice; it became `ExerciseSearchBox`, with `searching`. Each screen computes it:

```ts
const searching = search !== debounced || list.isPlaceholderData
```

- `search !== debounced`: the 300 ms after a key, before any request (`useDebouncedValue`, [C1.14](../concepts/C1-frontend.md#c114-the-exercise-library-screens));
- `list.isPlaceholderData`: the request running, the old rows still on screen (`keepPreviousData`).

The same value dims the rows (`opacity-60`). The Exercises page already dimmed on `isPlaceholderData` alone, so the first 300 ms were silent there too; the picker showed nothing at all.

### H3.27.5 Applying it

Most changes were one attribute, from `disabled={x}` to `pending={x}`, made with `sed` from `frontend/src/`, for example:

```sh
sed -i 's|disabled={list.isFetchingNextPage} onClick=|pending={list.isFetchingNextPage} onClick=|' pages/HistoryPage.tsx
sed -i 's|^\(\s*\)disabled={remove.isPending}$|\1pending={remove.isPending}|' pages/PlanDetailPage.tsx pages/ExerciseDetailPage.tsx pages/HistoryDetailPage.tsx
```

`git diff --stat` afterwards showed one line in, one out, on each of those files: nothing else had moved. The list: Sign in, Create account, the two password forms, the exercise form's Save, the plan editor's Save, Start (Home and the plan's page: `disabled={busy || day… === 0} pending={starting}`, so the reason a start is impossible stays apart from the wait), Export, Import, Sign out, the three Deletes in their dialogs, Show more (library, picker, history), and Retry (library, plans, the guard of the signed-in pages).

**Two buttons, one request**, done by hand:

- A plan's **Set as active** and **Archive** share one mutation: both `disabled={action.isPending}`, but `pending={action.isPending && action.variables === 'activate'}` on the first and `!== 'activate'` on the second. `variables` is what `mutate()` was given.
- The summary's **Save** and **Delete** shared `busy: boolean`; it became `useState<'save' | 'delete' | null>(null)`, with `disabled={busy !== null}` and `pending={busy === 'save'}`.

### H3.27.6 The tests, and proving they can fail

```sh
npx vitest run src/components/ui/button.test.tsx src/pages/ExercisesPage.test.tsx
```

```
 Test Files  2 passed (2)
      Tests  13 passed (13)
```

Then, for a moment, the box always given `searching={false}`, and the button's `disabled={disabled}` without `pending`:

```
     × is disabled, busy and shows a spinner while pending 50ms
     × shows a spinner in the search box until the searched list is on screen 147ms
      Tests  2 failed | 11 passed (13)
```

Both put back. The search test types "panca", finds the status "Searching…" at once, then waits for it to go: `fakeApi` answers at once, so the spinner lives for the 300 ms of the pause.

### H3.27.7 Looking at it

A throw-away `frontend/preview-tmp/` with one page: the search box with `searching`, three dimmed rows, and the buttons `pending` and not, in Italian, light and dark (`?dark` in the address adds the `dark` class to `<html>`); its `vite.config.ts` has its `root` at `frontend/` (H3.24.7). Built and photographed as in H3.22.5:

```sh
npx vite build --config preview-tmp/vite.config.ts
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --allow-file-access-from-files \
  --hide-scrollbars --window-size=600,500 --virtual-time-budget=3000 \
  --screenshot="D:/…/preview-tmp/dist/shot-dark.png" "file:///D:/…/preview-tmp/dist/preview-tmp/page.html?dark"
```

Three things met:

- **The host page with two `<iframe>`s** gave `2816 bytes written`: an empty picture, as in H3.26.10. The page itself was photographed instead, once per theme.
- **At `--window-size=380,520` the right edge was cut**, the search box's spinner with it: headless Chrome does not draw a window that narrow (H3.26.10). At 600, with the content at most 420 px wide, it was whole.
- **The spinner was smaller than the icons** of the 48 px buttons: the `h-4 w-4` of H3.27.2.

**What the photos showed:** the circle on the right of "panca", the rows grey; **Salva** lime with its disk, beside a faded **Salva** with the circle in its place; **Esporta**, **Elimina** and **Mostra altri** the same, readable in both themes. `rm -rf preview-tmp` at the end, from `frontend/`.

### H3.27.8 Checking in the browser

A local server answers in milliseconds: to see the signs, slow it down. Developer tools (F12) → **Network** → the throttling list (**No throttling**) → **Slow 4G** ([H3.8](#h38-checking-in-the-browser)). Then, with `make start`:

- **The picker:** a plan, Edit, a day, **Aggiungi esercizi**, type "panca": the circle on the right of the box from the first letter, the rows grey, until the new list.
- **The library:** the same in its search box; a muscle chosen: the rows grey and the circle while the list loads.
- **A button:** a plan's **Esporta**, **Salva** in the editor, **Accedi** on the sign-in page: the circle in place of the icon, the button faded, a second tap does nothing.
- **Set as active** on a plan: the circle on it only, **Archivia** faded without one.

Back to **No throttling** at the end: the setting stays while the developer tools are open.

### H3.27.9 The checks

From the repository's root:

```sh
make check
```

The end of each part:

```
  Tests:    269 passed (17477 assertions)
> eslint .
> tsc -b
 Test Files  31 passed (31)
      Tests  257 passed (257)
Contents up to date.
```

Four frontend tests more than before (253): three in the new `button.test.tsx`, one in `ExercisesPage.test.tsx`.

---

## H3.28 Continue with Google, as built

"Continue with Google" under the sign-in and sign-up forms ([FEAT-9](../design/D1-ui.md#d141-sign-in-and-onboarding)), and the message shown when Google sends the person back with an error. How it works: [C1.13.7](../concepts/C1-frontend.md#c1137-continue-with-google); the Laravel side: [H2.15](H2-backend.md#h215-sign-in-with-google-as-built).

| File | Change |
|---|---|
| `frontend/vite.config.ts` | `/auth/` forwarded to Laravel |
| `frontend/src/components/GoogleSignIn.tsx` | New: `GoogleSignInButton` and `GoogleSignInError` |
| `frontend/src/pages/LoginPage.tsx` | The error at the top of the form, the button under it |
| `frontend/src/pages/RegisterPage.tsx` | The button under the form |
| `frontend/src/i18n/locales/*.json` | `auth.google`: the button, "or", four errors |
| `frontend/src/pages/auth-pages.test.tsx` | Six tests |
| `frontend/src/components/layout/AuthLayout.tsx`, `PageHeader.tsx`, the four sign-in pages | Tighter spacing, so sign-in fits a laptop's screen (H3.28.7) |
| `frontend/src/components/ui/button.tsx`, `select.tsx`, `tabs.tsx`, `alert-dialog.tsx` | `[class*=size-]` without quotes: the icon sizes now apply (H3.28.6) |

### H3.28.1 The order of building

1. The backend first ([H2.15](H2-backend.md#h215-sign-in-with-google-as-built)): the codes of `?error=` are decided there.
2. The proxy, the texts in four languages, the component, the two pages.
3. The tests, proving they can fail, then the checks.

### H3.28.2 The proxy

In `server.proxy`, beside `/api`, `/sanctum` and `/storage`:

```ts
'/auth/': backendUrl,
```

**With its final slash.** Vite compares the start of the address: `'/auth'` would also send a React page such as `/authors` to Laravel. Vite reads its configuration when it starts: after the change, stop `npm run dev` (Ctrl+C) and start it again. Production's Caddy will need the same path ([OPS-3](../project/backlog.md#ops-3-deploy-to-the-free-server)).

### H3.28.3 The component

- **A plain `<a href>`, drawn as a button** with `<Button asChild variant="outline" size="xl">`. Not React Router's `<Link>`, which would look for a React page at `/auth/…` and show Not found; and not a `fetch()`: the browser itself has to go to Google.
- **The address** is built with `URLSearchParams`: `/auth/google/redirect?locale=it&from=%2Fplans`. `from` is the page RequireAuth remembered in the router's state (the same that RequireGuest reads); `locale` the app's language, as RegisterPage sends it.
- **The wait.** Button's `pending` is not for `asChild` ([H3.27.3](#h3273-pending-on-button-and-the-slot-that-counts-a-false)), so the link does it by hand: `onClick` sets `leaving`, the "G" becomes `<Spinner />`, `aria-busy` is set. The button's own classes then hide its icons, but the spinner is marked `data-slot="spinner"` and stays.
- **Back from Google's page,** the browser may show the page from its back-forward cache, spinner and all. A `pageshow` event with `persisted: true` sets `leaving` back to false.
- **The "G"** is an inline SVG in Google's four colours: Google's sign-in guidelines ask for it, and Lucide has no brand logos.
- **The error** is read with `useSearchParams()`: `?error=unverified` gives `auth.google.errors.unverified`, a code it does not know gives `failed`. The keys sit in an object with `as const`, so `t()` checks them; `` t(`auth.google.errors.${code}`) `` would be a string TypeScript cannot check.

### H3.28.4 The texts

`auth.google` in the four files, written with a short Python script that loads each JSON, adds the block and writes it back with `indent=2` and `ensure_ascii=False`: `git diff --stat` then showed 10 lines added in each file and none changed. `npx vitest run src/i18n` checks that the four files have the same keys.

### H3.28.5 The tests, and proving they can fail

Six tests in `auth-pages.test.tsx`, under "Continue with Google": the link's address with the language and `from` (a visitor opening `/plans`), the link on the sign-up page, the wait and Back, the error in German, an unknown code, and no message without an error.

```sh
npx vitest run src/pages/auth-pages.test.tsx src/i18n
```

```
 Test Files  2 passed (2)
      Tests  30 passed (30)
```

**Clicking a real link in jsdom.** jsdom cannot leave the page: the click would only print "Not implemented: navigation". The test adds `document.addEventListener('click', e => e.preventDefault())`, which stops the browser's part of the click; React's `onClick` still runs. `window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))` then plays the return from the cache.

**Proving they can fail.** For a moment, in `GoogleSignIn.tsx`: `from` never added, every code read as `failed`, and `pageshow` ignored:

```
     × links to Laravel with the language and the page the user was going to
     × shows that it is on its way, and is ready again after Back
     × says why Google sign-in did not work, in the user's language
     × confirms that the email was sent
     × shows an unknown email under the field
     × sends the token and the email of the link, then goes to sign in
     × shows an expired link at the top, since the email is not a field here
```

The first three are the ones meant. **The other four were a fault of the test:** "ready again after Back" failed before its last line, `document.removeEventListener(…)`, so the listener stayed and cancelled the clicks of every test after it, Forgot password's and Reset password's included. Removing it with Vitest's `onTestFinished(() => document.removeEventListener('click', stayHere))`, which runs even when the test fails, fixed it; with only `pageshow` ignored:

```
     × shows that it is on its way, and is ready again after Back
      Tests  1 failed | 19 passed (20)
```

Put back: 20 passed.

**Node 22 instead of 24.** The first run, on the Mac, stopped before any test:

```
Error: require() of ES Module …/node_modules/@exodus/bytes/encoding-lite.js from …/node_modules/html-encoding-sniffer/lib/html-encoding-sniffer.js not supported.
 Test Files  no tests
```

`node -v` said `v22.9.0`: the shell had not switched to the project's Node 24 (`.nvmrc`), and jsdom's packages need it. `nvm use` in `frontend/` (or a new terminal, if nvm switches by itself) fixes it; `node -v` then says `v24.…`.

### H3.28.6 A "G" as big as the page

**What was seen.** The first look at the sign-in page, in the browser: the "G" about 650 px wide, over the form, and "Continua con Google" pushed out of the button on the right. The tests had passed: jsdom draws no CSS, so sizes are never checked there.

**Why.** The button sizes the icons inside it with a class such as `[&_svg:not([class*='size-'])]:size-5`. shadcn writes it in double-quoted strings; in this project's single-quoted ones it had become `[class*=\'size-\']`. JavaScript turns `\'` into `'`, so the page's element has the right class. But Tailwind does not run the JavaScript: it reads the file as text and makes a class out of what it finds, backslashes included. The compiled CSS showed it (`npx vite build`, then a search in `dist/assets/*.css`):

```
.\[\&_svg\:not\(\[class\*\=\\\'size-\\\'\]\)\]\:size-5 svg:not([class*="'size-'"]){width:calc(var(--spacing) * 5);…}
```

A class name with `\'` in it, which no element has, and a selector looking for the quote characters themselves. **The rule had never applied to any icon** of a button, tab, select or dialog. Nobody had noticed because Lucide's icons carry `width="24" height="24"` of their own; the "G" has only a `viewBox`, and an `<svg>` with no size grows to fill its container.

**The fix.** No quotes at all: `[class*=size-]` is valid CSS, since `size-` is a plain identifier, and Tailwind and the browser now read the same string. From `frontend/`:

```sh
perl -pi -e "s/\[class\*=\\\\'size-\\\\'\]/[class*=size-]/g" src/components/ui/{alert-dialog,button,select,tabs}.tsx
```

The same build then gave `svg:not([class*=size-]){width:calc(var(--spacing) * 5);…}` under the class the element really has. The "G" also got `width="20" height="20"`, a floor the CSS overrides.

**What changes elsewhere.** Every icon in a button without a `size-` class of its own goes from Lucide's 24 px to the size shadcn meant: 16 px, 20 px on the 48 px buttons, 12 and 14 px on the small ones. The spinner, written `h-4 w-4` so that this rule would size it (H3.27.2), now really does.

**To remember:** an arbitrary value of Tailwind (`[…]`) must not contain a `\` written for JavaScript. When a quote is needed inside one, write the string with the other quotes, or leave the quotes out where CSS allows.

### H3.28.7 Second pass: sign-in on a laptop's screen

**What was seen.** With the "G" fixed, the sign-in page scrolled on the Mac's screen: the Google block had added about 110 px, and the column was some 790 px tall on a wide window.

**What changed,** keeping every field, button and link at 48 px, the size a finger needs (D1.5):

| Where | Before | After | Saved |
|---|---|---|---|
| The two links under the form (`LoginPage`) | One under the other | Side by side when they fit (`flex-wrap`, `gap-x-6`); on a narrow phone the second wraps | 48 px |
| `AuthLayout`: space above, below, and between logo and card | 32 px | 24 px | 24 px |
| Space under the title (`PageHeader`, new `className` prop, `mb-6` from the four pages) | 32 px | 24 px | 8 px |
| The Google block: above it, and between "or" and the button | 24 px | 20 and 16 px | 12 px |
| Space above the links | 16 px | 8 px | 8 px |

`PageHeader` merges `className` with `cn()`, so `mb-6` replaces its `mb-8` there and nowhere else.

**Looked at** with Chrome without a window, on the running `make start`, from any folder (the address is the dev server's):

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --window-size=1280,720 --virtual-time-budget=4000 --screenshot=/tmp/login-720.png "http://localhost:5673/login"
```

At 1280 × 720 the whole sign-in card is on screen, its bottom at 677 px; at 600 px wide the two links still share a line. Narrower than about 500 px headless Chrome does not draw (H3.26.10), so the wrap was not photographed. Sign-up, two fields longer, still scrolls a little at 720 px.

### H3.28.8 Checking in the browser

`make start`, then http://localhost:5673/login in a private window (no session):

- **Under the form:** "or" between two lines, then **Continue with Google**, as wide as **Sign in**, outlined, with the coloured "G" at 20 px, the size of the icons on the other 48 px buttons. The same on **Create account**.
- **Developer tools → Network,** then the button: `redirect?locale=…` answered **302** with `Location: https://accounts.google.com/…` (with the credentials), or `Location: http://localhost:5673/login?error=failed` (without them, the Mac until S1.11.5).
- **The errors**, typed in the address: `/login?error=cancelled`, `?error=unverified`, `?error=disabled`, `?error=anything`; the message at the top of the form, in the app's language.
- **Coming back** to the page asked for: signed out, open http://localhost:5673/plans; on the sign-in page, the button's address ends with `from=%2Fplans` (right click → Copy link); after Google, the plans.

The whole journey to Google and back needs the credentials ([H2.15.7](H2-backend.md#h2157-checking-it-for-real)); it was not tried on the Mac where this was built.

### H3.28.9 The checks

From `frontend/`, with Node 24:

```sh
npm run lint
npx tsc -b
npx vitest run
```

```
> eslint .
 Test Files  31 passed (31)
      Tests  263 passed (263)
```

`tsc -b` printed nothing, which is success. Six frontend tests more than before (257).

---

## H3.29 The link to the admin panel, as built

An **Administration** card on Profile, for admins only, with **Open**: the admin panel in a new tab. Why it was needed, and the Laravel side (`admin_url` in `GET /api/user`, "Continue with Google" on the panel's login): [H2.16.8](H2-backend.md#h2168-the-way-in-the-link-and-google-on-the-panels-login). How it works: [C1.13.8](../concepts/C1-frontend.md#c1138-the-link-to-the-admin-panel).

| File | Change |
|---|---|
| `frontend/src/api/auth.ts` | `admin_url: string \| null` in the `User` type |
| `frontend/src/test/auth-helpers.tsx` | `admin_url: null` in `testUser` |
| `frontend/src/pages/ProfilePage.tsx` | The card, drawn only when `admin_url` is there |
| `frontend/src/i18n/locales/*.json` | `profile.adminTitle`, `adminPanel`, `adminHint`, `adminOpen` |
| `frontend/src/pages/ProfilePage.test.tsx` | Two tests; the sign-out tests' fake server now remembers signing out |

### H3.29.1 The order of building

1. The backend first: the field `admin_url` and its value come from Laravel ([H2.16.8](H2-backend.md#h2168-the-way-in-the-link-and-google-on-the-panels-login)).
2. The type, then the test helper: `testUser` is typed `User`, so once the interface has `admin_url`, TypeScript (`npm run typecheck`, part of `make check`) asks for it there too.
3. The texts in four languages, the card, the tests.

### H3.29.2 The card

In `ProfilePage.tsx`, between the workout's card and About:

```tsx
{user?.admin_url && (
  <section aria-labelledby="admin-title" className="rounded-3xl border bg-card/60 px-6 pt-6 backdrop-blur sm:px-8">
    <h2 id="admin-title" className="font-heading text-lg font-extrabold tracking-tight">{t('profile.adminTitle')}</h2>
    <SettingRow icon={ShieldCheck} label={t('profile.adminPanel')} description={t('profile.adminHint')}>
      <Button asChild variant="outline">
        <a href={user.admin_url} target="_blank" rel="noopener">
          {t('profile.adminOpen')}
          <ExternalLink aria-hidden="true" />
        </a>
      </Button>
    </SettingRow>
  </section>
)}
```

- **`cond && (…)`**: React draws nothing for `null`, so the card is absent for anyone who is not an admin.
- **The same look as the other cards:** the classes of Preferences and About, and a `SettingRow`, so nothing new had to be designed.
- **`<a>`, not `<Link>`,** `target="_blank"` and `rel="noopener"`: why, in C1.13.8. `ExternalLink` is lucide's arrow out of a box, the usual sign of a link that leaves the page.

The texts, under `profile` in each language file, e.g. Italian:

```json
"adminTitle": "Amministrazione",
"adminPanel": "Pannello admin",
"adminHint": "La libreria pubblica degli esercizi e gli utenti. Si apre in una nuova scheda.",
"adminOpen": "Apri"
```

`src/i18n/locales.test.ts` fails if a key is missing in one language.

### H3.29.3 The tests

```ts
it('links an admin to the admin panel, in a new tab', async () => {
  fakeApi({ 'GET /api/user': signedInAs({ ...testUser, is_admin: true, admin_url: 'http://localhost:8500/admin' }), 'GET /api/health': health })
  renderRoutes(routes, '/profile')

  const card = await screen.findByRole('region', { name: 'Administration' })
  const link = within(card).getByRole('link', { name: 'Open' })
  expect(link).toHaveAttribute('href', 'http://localhost:8500/admin')
  expect(link).toHaveAttribute('target', '_blank')
})
```

A `<section>` with `aria-labelledby` is a **region** named by its heading, so the test finds the card as a person using a screen reader would; `within(card)` then looks only inside it. The second test, `shows no admin panel to anyone else`, waits for the name first (`findByText('Ann')`), so the page is drawn, then checks with `queryByRole`, which answers `null` instead of failing when nothing is found.

```sh
npx vitest run src/pages/ProfilePage.test.tsx
```

```
      Tests  8 passed (8)
```

**Error met: a flaky test, not new.** `goes to the sign-in form even if the session had already ended` failed in some full `make check` runs and never alone:

```
 FAIL  src/pages/ProfilePage.test.tsx > ProfilePage > goes to the sign-in form even if the session had already ended
Error: expect(element).toBeInTheDocument()

element could not be found in the document
```

Its fake server answered `GET /api/user` with Ann even after signing out. The sign-in page reads the user again when it mounts, found Ann, and sent the browser back to Profile, sometimes before `findByText` had looked. The fix is a fake that remembers, as a real server does ([C1.13.6](../concepts/C1-frontend.md#c1136-testing-a-screen-with-the-api)):

```ts
let signedOut = false
fakeApi({
  'GET /api/user': () => (signedOut ? visitor : signedInAs()),
  'POST /api/auth/logout': () => {
    signedOut = true
    return visitor
  },
})
```

A flaky test is checked by running the whole suite several times, from `frontend/`:

```sh
for i in 1 2 3 4; do npx vitest run 2>&1 | grep -E "Tests  |FAIL"; done
```

```
      Tests  265 passed (265)
      Tests  265 passed (265)
      Tests  265 passed (265)
      Tests  265 passed (265)
```

### H3.29.4 Check it in the browser

1. Make your account an admin, if it is not: `is_admin` to `true` in TablePlus ([H4](H4-database-tools.md)), or in tinker ([C2.8](../concepts/C2-backend.md#c28-admin-panel-filament)). Reload the app: `GET /api/user` is read again.
2. Profile: the **Administration** card, under Workout. **Open**: the panel in a new tab, already signed in, in the app's language.
3. With an account that is not an admin, the card is not there.

---

## H3.30 The photos of an exercise, as built

The React side of `feat/exercise-media`: the small copies in every list, the photo section of the exercise editor, and Duplicate as mine. How it works: [C1.14.7](../concepts/C1-frontend.md#c1147-uploading-photos-and-duplicate-as-mine); the Laravel side: [H2.17](H2-backend.md#h217-the-photos-of-an-exercise-as-built).

| File | Change |
|---|---|
| `src/lib/http.ts` | `upload()`: a multipart request with its progress, through XMLHttpRequest |
| `src/api/exercises.ts` | `thumb_url`; `MAX_PHOTOS`, `MAX_PHOTO_BYTES`, `PHOTO_TYPES`; four hooks: upload, delete, reorder, duplicate |
| `src/components/exercises/ExercisePhotoManager.tsx` | New: the photos' section of the editor |
| `src/pages/ExerciseEditorPage.tsx` | The section under the form; on a new exercise, a line saying photos come after Create |
| `src/pages/ExerciseDetailPage.tsx` | **Duplicate as mine** on a public exercise |
| `ExerciseListItem`, `PlanItemRow`, `EditorItem`, `ExercisePicker`, `SessionExercises`, `WorkoutScreen` | The cover from `thumb_url` |
| `src/i18n/locales/*.json` | `exercises.photos.*`, `exercises.editor.photosLater`, `exercises.detail.duplicate*` |
| `src/test/exercise-helpers.ts` | `fakeUploads()`; the test exercise's photos with both addresses |
| `src/pages/ExercisePhotos.test.tsx` | New: 8 tests; two older tests now expect the copies' paths |

### H3.30.1 The order of building

1. The backend first ([H2.17](H2-backend.md#h217-the-photos-of-an-exercise-as-built)): the JSON of a photo and the endpoints decide the types and the hooks.
2. `thumb_url` in the type, then every `cover.url` that draws a small square becomes `cover.thumb_url` (`grep -rn "cover.url" src` found the six), and the test exercise gets both addresses. `npm run typecheck` then passes.
3. `upload()`, the hooks, the component, the two pages, the texts in four languages.
4. The tests, the checks.

### H3.30.2 upload()

```ts
const xhr = new XMLHttpRequest()
xhr.open('POST', path)
xhr.setRequestHeader('X-XSRF-TOKEN', readCookie('XSRF-TOKEN') ?? '')
xhr.upload.onprogress = event => onProgress?.(event.loaded / event.total)
xhr.onload = () => resolve({ status: xhr.status, data: JSON.parse(xhr.responseText) })
xhr.send(form)
```

wrapped in a `Promise`, plus the `Accept` and `Accept-Language` headers, a retry after a 419 and an `ApiError` for the rest (the whole function: `src/lib/http.ts`). No `Content-Type`: for a `FormData` the browser writes `multipart/form-data` with the boundary itself, and one set by hand would lack it.

### H3.30.3 The section of the editor

`ExercisePhotoManager` takes the exercise and keeps three pieces of state: the uploads under way (`pending`), a message about files refused before sending (`notice`), and whether files are dragged over the zone. Its parts are listed in C1.14.7; three details from building it:

- **Sending one after the other:** `for (const upload of uploads) await send(upload)`, where `send()` awaits `mutateAsync()`, moves the bar through `onProgress`, and on failure keeps the server's message for the field (`error.fieldErrors.photo[0]`).
- **Moving a photo:** the ids in a new order, then `reorder.mutate(ids)`. The first version swapped two items, `[ids[i], ids[j]] = [ids[j], ids[i]]`, which TypeScript refused (below); `splice()` out and in does the same.
- **Removing** opens an AlertDialog, as deleting an exercise does; the dialog stays open, with Remove pending, until the answer.

### H3.30.4 The tests

```sh
npx vitest run src/pages/ExercisePhotos.test.tsx
```

```
 ✓ the photos of my exercise > uploads a photo with its bar, then shows it as the cover
 ✓ the photos of my exercise > refuses a HEIC photo and one over 10 MB before sending them
 ✓ the photos of my exercise > shows the server's reason when an upload fails, and tries again
 ✓ the photos of my exercise > moves a photo earlier, sending the new order
 ✓ the photos of my exercise > removes a photo after asking
 ✓ the photos of my exercise > hides Add photos once there are five
 ✓ Duplicate as mine > copies a public exercise and opens the copy's editor
 ✓ Duplicate as mine > is not offered on my own exercise
      Tests  8 passed (8)
```

- **`fakeUploads(answer)`** replaces `XMLHttpRequest` with a class that has only what `upload()` uses; each `send()` reports 50% then 100%, then answers on the next turn of the event loop, and records the address, headers and form.
- **A fake server that remembers:** `'GET /api/exercises/7'` is a function reading a `state.photos` that the upload's answer and the test change, so the exercise read again shows the new photo ([C1.13.6](../concepts/C1-frontend.md#c1136-testing-a-screen-with-the-api)).
- **`user.upload(input, file)`** picks a file. A file of 11 MB without 11 MB of content: `Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })`. A HEIC file is hidden by the input's `accept`, so that test uses `userEvent.setup({ applyAccept: false })`.

**Errors met:**

| Message | Cause | Fix |
|---|---|---|
| `TS2322: Type 'number \| undefined' is not assignable to type 'number'` on the swap | The project's TypeScript has `noUncheckedIndexedAccess`: `ids[i]` may be `undefined` to it | `const [moved] = ids.splice(index, 1)`, a check that `moved` is there, then `ids.splice(index + step, 0, moved)` |
| ESLint `no-useless-assignment` in `http.ts` | `let data: unknown = null` was overwritten in both the `try` and the `catch` | `let data: unknown`, with no first value |
| `ExerciseDetailPage.test.tsx` and `ExercisesPage.test.tsx`: `expected src="/storage/1/0.jpg"` | The tests checked the old address | The large copy on the page, the small one in the list |

### H3.30.5 Check it in the browser

1. One of your exercises → **Edit** → under the form, **Photos**: **Add photos**, or drop files on the zone. Each shows its bar, then appears in the list; the first is **Cover**.
2. Move a photo up: the library's row shows the new cover. Remove one: the dialog shows which.
3. Pick a `.heic` or a large file from a computer: the message appears at once, nothing is sent (developer tools, Network tab).
4. A public exercise → **Duplicate as mine**: the editor of the copy, with its photos.
5. On a phone ([H3.8.2](#h382-a-real-android-phone-over-usb)): Add photos opens the camera roll or the camera; the photo arrives as JPEG.

---

## H3.31 Compact page headers and the Filters panel

`feat/compact-headers`: less empty room at the top of the pages. The title carries the page's main actions on its row, the description is smaller, the eyebrow that repeated the section's name is gone, and the library's muscle and equipment filters moved into a panel from the bottom. Why, and the options weighed: [D1.5](../design/D1-ui.md#d15-design-system) "Page header" and [D1.4.3](../design/D1-ui.md#d143-exercise-library); how the filters work: [C1.14.3](../concepts/C1-frontend.md#c1143-filters-in-the-address).

| File | Change |
|---|---|
| `src/components/PageHeader.tsx` | New `actions` prop, drawn at the right of the title; title 24/30 px instead of 30/36; description 14 px; 24 px under the header instead of 32 |
| `src/pages/ExercisesPage.tsx`, `PlansPage.tsx` | Their New buttons (and Import plan) passed as `actions`, no longer on a row of their own |
| `src/components/plans/ImportPlanButton.tsx` | Only its icon on phones, the name kept for screen readers and as a tooltip |
| `src/components/exercises/ExerciseFilters.tsx` | Search, **Filters** (a `Sheet` with the two selects) and the source on one row |
| Nine pages | `eyebrow={t('pages.….eyebrow')}` removed; the four sign-in pages lose their `className="mb-6"`, now the default |
| `src/i18n/locales/*.json` | `pages.*.eyebrow` removed (none is used any more); `exercises.filtersActive_one/_other`, `filtersText`, `showResults` added |
| `src/pages/ExercisesPage.test.tsx` | The two filter tests open the panel first |

### H3.31.1 A prop that takes JSX

`PageHeader` does not know which buttons a page has: the page passes them, ready-made, in a prop typed `ReactNode` (React's type for anything drawable):

```tsx
<PageHeader
  title={t('pages.plans.title')}
  description={t('pages.plans.description')}
  actions={(
    <>
      <Button asChild size="xl"><Link to="/plans/new"><Plus aria-hidden="true" />{t('plans.new')}</Link></Button>
      <ImportPlanButton />
    </>
  )}
/>
```

`<>…</>`, a fragment, groups the two buttons without adding an element. In `PageHeader` the title and `{actions}` sit in one `flex flex-wrap justify-between` row: side by side when they fit, the actions on a row of their own when they do not (a long plan name, German on a narrow phone).

**An icon-only button on phones** keeps its text for screen readers: the text in `<span className="max-sm:sr-only">`, the button `max-sm:w-12 max-sm:px-0` (a 48 px square), and `title` for the tooltip.

### H3.31.2 The commands, in order

From the repository's root, on a clean `main`:

```sh
make branch name=feat/compact-headers
```

```
git switch -c feat/compact-headers
Switched to a new branch 'feat/compact-headers'
```

The eyebrows that only repeated the section, removed from nine pages at once with Perl's search and replace (`-p` runs over each line, `-i` writes the file back), from `frontend/src/pages/`:

```sh
perl -pi -e "s/<PageHeader eyebrow=\{t\('pages\.(exercises|plans|progress|profile)\.eyebrow'\)\} /<PageHeader /" \
  ExerciseDetailPage.tsx ExerciseEditorPage.tsx ProgressPage.tsx ProfilePage.tsx PlanDetailPage.tsx PlanEditorPage.tsx
perl -pi -e "s/<PageHeader eyebrow=\{t\('pages\.progress\.title'\)\} /<PageHeader /" HistoryPage.tsx
grep -rn "<PageHeader" . | grep -v test        # what is left: the eyebrows that add something
```

The eyebrows kept: the sign-in pages (no navigation there), the workout summary, a past workout's date, "Edit plan". Then the keys no page reads any more, removed from the four locale files with a few lines of Node, which read the JSON, delete the field, and write it back with the same two-space indentation:

```sh
cd frontend
for l in en it es de; do node -e '
const fs=require("fs"),f=process.argv[1],j=JSON.parse(fs.readFileSync(f,"utf8"));
for (const k of Object.keys(j.pages)) delete j.pages[k].eyebrow;
fs.writeFileSync(f,JSON.stringify(j,null,2)+"\n");' src/i18n/locales/$l.json; done
git diff --stat src/i18n
```

```
 frontend/src/i18n/locales/de.json | 15 +++++----------
 frontend/src/i18n/locales/en.json | 15 +++++----------
 frontend/src/i18n/locales/es.json | 15 +++++----------
 frontend/src/i18n/locales/it.json | 15 +++++----------
 4 files changed, 20 insertions(+), 40 deletions(-)
```

`git diff` showed only the `eyebrow` lines and the commas before them. Then the components by hand (the table above), the new texts in the four files, and the checks, with Node 24 (`nvm use` in `frontend/`):

```sh
npx vitest run src/pages/ExercisesPage.test.tsx
npm run lint && npm run typecheck && npx vitest run
```

```
 Test Files  32 passed (32)
      Tests  273 passed (273)
```

Last, from the root, `make toc` and `make check`.

### H3.31.3 Testing a panel

The panel's content is drawn only while it is open (Radix mounts a dialog's content when it opens), so a test opens it first, then looks inside it with `within()`:

```tsx
await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
const panel = screen.getByRole('dialog', { name: 'Filters' })          // named by its SheetTitle
await within(panel).findByRole('option', { name: 'Barbell' })         // the list has loaded
await userEvent.selectOptions(within(panel).getByRole('combobox', { name: 'Equipment' }), 'barbell')
await userEvent.click(within(panel).getByRole('button', { name: 'Show exercises' }))
await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
expect(screen.getByRole('button', { name: 'Filters, 1 active' })).toBeInTheDocument()
```

**Errors met:**

| Message | Cause | Fix |
|---|---|---|
| `Unable to find an accessible element with the role "button" and name "Filters 1 active"`; the list of buttons printed under it showed `Name "Filters1 active"` | A button's accessible name is its texts joined, and two `<span>`s side by side are joined without a space: a screen reader would have read "Filters1 active" too | The hidden text starts with a comma and a space, as a template literal: `` {`, ${t('exercises.filtersActive', { count })}`} ``; the name is now "Filters, 1 active" |
| `Error: [vitest-pool]: Failed to start forks worker for test files …` | The terminal had Node 22.9; the project wants Node 24 (`.nvmrc`), [S1](../start/S1-setup.md) | `nvm use` in `frontend/`, then the same command |

### H3.31.4 Check it in the browser

Not looked at by the assistant: the development server could not be reached from its tools in this session. By hand, at a phone's width ([H3.8.1](#h381-phone-tablet-and-desktop-widths)) and on a wide window:

1. **Exercises:** the title with **New exercise** on its right, the small description under them; then the search box with the Filters icon beside it, and All / Mine / Public under them. Scroll: the search and Filters stay at the top, the source goes.
2. **Filters:** the panel rises from the bottom; choose a muscle, the list changes behind it; **Show exercises** closes it, and the button shows a lime **1**. **Clear filters** in the panel removes it. From 640 px the button says "Filters" and the source sits on the same row.
3. **Plans:** **New plan** and the Import icon on the title's row on a phone; hovering the icon with a mouse shows "Import plan".
4. **Exercise, plan, progress, profile pages:** no lime word above the title; a past workout still shows its date there, the summary "Workout finished".
5. Both themes, and German (the longest words): when the buttons do not fit, they go under the title, never over it.

## H3.32 Workout mode after a real workout, as built

`feat/workout-mode-feedback`: requests made after the app was used for a whole workout, five at first, then one at a time as each was tried. How each works: [C1.17.8](../concepts/C1-frontend.md#c1178-the-stopwatch-of-a-timed-set) (the stopwatch), [C1.17.10](../concepts/C1-frontend.md#c11710-after-a-real-workout-times-up-next-how-to-do-it) (times, up next, how to do it), [C1.17.11](../concepts/C1-frontend.md#c11711-removing-what-was-added-by-hand) (removing what was added), [C1.17.12](../concepts/C1-frontend.md#c11712-deleting-a-workout-in-progress) (deleting a workout in progress); what they look like: [D1.4.9](../design/D1-ui.md#d149-workout-mode).

**How to read this section.** H3.32.1 to H3.32.5 are the first five requests, built together; each later subsection is one more round, with its own files, commands, errors and checks, in the order they came. A round that changes something built earlier says so; the earlier subsection is left as it was, since its steps still teach.

| Request | Answer |
|---|---|
| The stopwatch is huge and covers the whole screen | Docked at the bottom, where the rest bar goes; the sets stay in sight, the one timed with a lime ring |
| A 14½-minute set shows "870" seconds | Written "14:30" past a minute (the value kept in seconds); the column titled "Time" |
| Show which exercise comes after this one | A reminder "Up next" under the sets, not a button (H3.32.6), and "Up next: …" in the rest bar once the exercise is done |
| Pause the stopwatch | Pause / Resume, the pause not counted |
| A tap on the exercise to see how it is done | A panel from the bottom with the photos, muscles and steps, from the photo or the name |
| *(H3.32.6)* A tap on Up next must not move to that exercise | A reminder only, no longer a button |
| *(H3.32.7)* What is added by hand during a workout cannot be removed | Removable again, the plan's sets and exercises not: a set from its stepper, an exercise from its menu |
| *(H3.32.8)* Deleting a workout means finishing it first | **Delete workout** in Finish's dialog, after a second question, in workout mode and in the banner |
| *(H3.32.9)* Delete hung outside the dialog | Inside the dialog's footer, the three answers in a column |

| File | Change |
|---|---|
| `src/components/workout/workout-session.ts` | `Stopwatch` gains `paused_at?` and `paused_ms?`; `stopwatchSeconds()` leaves the pauses out; new `stopwatchTargetAt()`, `upNext()`; actions `pauseStopwatch`, `resumeStopwatch` |
| `src/components/workout/StopwatchPanel.tsx` | Rewritten: a `<section>` docked at the bottom instead of a full-screen `Dialog`; a bar instead of the ring; Pause; the focus on Stop |
| `src/components/workout/SetRow.tsx` | `stopwatch` prop: the lime ring on the set timed, ▶ disabled while one runs; the time shown with `fieldText()` |
| `src/components/plans/plan-format.ts` | New `durationText()`; a plan's time targets use it |
| `src/components/workout/set-fields.ts` | The time's column titled "Time", spoken "Seconds"; new `fieldText()` |
| `src/components/workout/set-text.ts` | A logged time through `durationText()`: the Last column and history |
| `src/components/workout/SetStepper.tsx` | The time's title "Seconds · 14:30" |
| `src/components/workout/UpNextCard.tsx` | New: the reminder of the next exercise |
| `src/components/workout/RestBar.tsx` | `next` prop: "Up next: …" under the time |
| `src/components/workout/ExerciseInfoSheet.tsx` | New: "How to do it" |
| `src/components/exercises/MuscleChips.tsx` | Moved out of `ExerciseDetailPage.tsx`, to be shared |
| `src/components/workout/WorkoutScreen.tsx` | The photo and the name as buttons; the panel, the card, the rest bar's name, Pause wired |
| `src/i18n/locales/*.json` | `workout.colTime`, `upNext`, `upNextName`, `howTo.open`, `howTo.empty`, `stopwatch.title`, `pause`, `resume`, `paused`, `cancelShort`; `colSeconds` becomes "Seconds"; `stopwatch.stopHint` removed |
| `workout-session.test.ts`, `plan-format.test.ts`, `WorkoutPage.test.tsx` | The tests below |

The files of the later rounds are listed in their own subsections.
### H3.32.1 The commands, in order

From the repository's root, on a clean `main`:

```sh
make branch name=feat/workout-mode-feedback
```

```
git switch -c feat/workout-mode-feedback
Switched to a new branch 'feat/workout-mode-feedback'
```

The order of building, each step leaning on the one before:

1. **The workout's data first** (`workout-session.ts`): the pause's two fields, the readers, the two actions, `upNext()`. No screen yet, so the tests of H3.32.3 can be written against it at once.
2. **The text of a time** (`durationText()` in `plan-format.ts`, then `fieldText()`, `loggedSetText()`, the stepper's title).
3. **The pieces** (`StopwatchPanel`, `UpNextCard`, `ExerciseInfoSheet`, `RestBar`, `SetRow`), then `WorkoutScreen`, which wires them.
4. **The texts** in the four locale files. Several keys at once, in the right places of the `workout` object, are easier with a script than by hand: it reads each file as JSON keeping the order of the keys, rebuilds `workout` with the new keys beside their neighbours, and writes it back with two spaces, as in H3.31.2. `git diff --stat` then shows the same count in each language:

```
 frontend/src/i18n/locales/de.json | 16 ++++++++++++++--
 frontend/src/i18n/locales/en.json | 16 ++++++++++++++--
 frontend/src/i18n/locales/es.json | 16 ++++++++++++++--
 frontend/src/i18n/locales/it.json | 16 ++++++++++++++--
 4 files changed, 56 insertions(+), 8 deletions(-)
```

5. **The checks**, from `frontend/` (Node 24, `nvm use`):

```sh
npm run typecheck
npm run lint
npx vitest run src/pages/WorkoutPage.test.tsx src/components/workout src/components/plans/plan-format.test.ts
npx vitest run
```

```
> atleoplan-frontend@0.0.0 typecheck
> tsc -b

> atleoplan-frontend@0.0.0 lint
> eslint .

 Test Files  4 passed (4)
      Tests  71 passed (71)

 Test Files  32 passed (32)
      Tests  283 passed (283)
```

`tsc` and ESLint print nothing when all is well. Last, from the root, `make toc` (H3.32 and C1.17.10 are new headings) and `make check`, with the stack up:

```
Contents written: docs\concepts\C1-frontend.md, docs\how-to\H3-frontend.md
…
  Tests:    359 passed (17807 assertions)
 Test Files  32 passed (32)
      Tests  283 passed (283)
Contents up to date.
```

### H3.32.2 Pausing a moment

The stopwatch was already a moment, not a counter (C1.17.8): the time is "now − start". A pause cannot just stop a counter that does not exist; it keeps **when** it happened, and Resume turns the pause into a length:

```ts
case 'pauseStopwatch':
  if (next.stopwatch && !next.stopwatch.paused_at) next.stopwatch.paused_at = action.now
  break
case 'resumeStopwatch':
  if (next.stopwatch?.paused_at) {
    next.stopwatch.paused_ms = (next.stopwatch.paused_ms ?? 0) + Date.parse(action.now) - Date.parse(next.stopwatch.paused_at)
    next.stopwatch.paused_at = null
  }
  break
```

and the reader counts up to the pause while paused, minus the pauses before:

```ts
const end = stopwatch.paused_at ? Date.parse(stopwatch.paused_at) : now.getTime()
return Math.max(0, Math.floor((end - Date.parse(stopwatch.started_at) - (stopwatch.paused_ms ?? 0)) / 1000))
```

The same idea as the workout's own clock, `accumulated_seconds` and `running_since` (C1.17.3). Three things follow from it:

- **New fields are optional.** A workout stored on the phone before this change has a stopwatch without them; `?` in the type and `?? 0` in the code read it as never paused, and a test checks exactly that.
- **The signal at the target moves.** It was a `setTimeout` for "start + target"; it is now `stopwatchTargetAt()`, "start + pauses + target", and `null` while paused. The effect depends on the `stopwatch` object, which every action replaces (the reducer works on a copy), so Resume clears the old timer and sets the new one with no extra code.
- **A second Pause does nothing**: moving `paused_at` later would drop the seconds between the two from the pause, and add them to the time.

### H3.32.3 The tests, and the errors met

Written with the code, then run; three failed at the first run, each for a reason worth knowing:

| Message | Cause | Fix |
|---|---|---|
| `Unable to find role="button" and name '/^Up next Bent Over Barbell Row/'` | The card's lines are `<span className="block">`: a button's accessible name joins its texts **without spaces**, "Up nextBent Over Barbell Row…", as in H3.31.3. A screen reader would have read the same | The card named itself, `aria-label={t('workout.upNextName', { name })}`: "Up next: Bent Over Barbell Row". (The card is no longer a button since H3.32.6, and the problem went with it: `<p>`s, not a button's name) |
| `Found multiple elements with the text: How to do it` | The panel's description said "How to do it", and so does the title of its steps, `exercises.detail.instructions`, in English | The description became the equipment, "Equipment: Barbell": not a repeat, and useful |
| `Unable to find an element with the text: /Pushups · Set 1 · 50 reps/` | `getByText` reads an element's **own** text, without its children's: the line is `<p><span>Set 1</span> · 50 reps · Pushups</p>`, so the `<p>`'s own text is " · 50 reps · Pushups" | Match that part: `getByText(/· 50 reps · Pushups/)`; and `/Dead Hang/` rather than `'Dead Hang'`, which must match a whole text |

**A button inside a heading.** The exercise's name became a button, but the tests still find the heading by its name, `getByRole('heading', { level: 2, name: 'Barbell Bench Press' })`: a heading's name is computed from its content, and a button with no `aria-label` contributes its text. Had the button an `aria-label` ("How to do it: …"), the heading would take that as its name, and every test (and screen reader's list of headings) looking for "Barbell Bench Press" would break. That is why the photo's button has the `aria-label` and the name's has none.

**A panel that is not a dialog** is found by its role and name like any region: `getByRole('region', { name: 'Stopwatch' })`, as the rest bar's `{ name: 'Rest' }`. The old tests looked for `getByRole('dialog', { name: 'Dead Hang' })`; with the panel docked, they look for the region, and check what a dialog would have hidden: the set's row is reachable and marked, `closest('li')` with `aria-current="true"`.

**Proving they can fail.** The pauses taken out of `stopwatchSeconds()` (`- (stopwatch.paused_ms ?? 0)` removed), then put back:

```
 × pauses: the time stands still, and the pause is not counted
AssertionError: expected 35 to be 20 // Object.is equality
      Tests  1 failed | 36 passed (37)
```

35 is 45 − 10 seconds since the start, with the 15 of pause counted: exactly the mistake the test is there for.

### H3.32.4 Looking at it

Photographed without the server, as in [H3.15.10](#h31510-fourth-pass-looking-at-the-screen-for-real) and [H3.22.5](#h3225-looking-at-it): a throw-away `frontend/preview-tmp/` with a `main.tsx` drawing `WorkoutScreen` in Italian, a free workout with a plank whose last time was 870 seconds, and `?state=` choosing the moment (`stopwatch`, `paused`, `rest`, `info`); a `host.html` with three `<iframe>`s, 360, 390 and 900 px wide. It cannot import the tests' helpers (`src/test/exercise-helpers.ts` imports Vitest, which does not belong in a page), so the exercises are written in it. From `frontend/`, in Git Bash:

```sh
npx vite build --config preview-tmp/vite.config.ts
cd preview-tmp && D=$(cygpath -m "$PWD")
for s in stopwatch paused rest info; do
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --allow-file-access-from-files \
    --hide-scrollbars --window-size=1700,800 --virtual-time-budget=5000 \
    --screenshot="$D/dist/shot-$s.png" "file:///$D/dist/preview-tmp/host.html?state=$s"
done
cd .. && rm -r preview-tmp
```

**What the photos showed.**

- **Running**, at 360 px: three rows in sight above the panel, the second ringed in lime; in the panel the bar, "0:47" large, "Obiettivo 14:30", "Ultima volta 14:30", ⏸ and **Stop** side by side, **Annulla** quiet at the top right. Every time in the rows reads "14:30", the column "TEMPO". One fault: the first line said "Plank con sollevamento alterna…", the long name pushing **"Serie 2" off the screen**. The set's name now comes first: "Serie 2 · Plank con sollevament…".
- **Paused:** the time grey, "In pausa" under it, ▶ in place of ⏸.
- **Resting** after the plank: "Dopo: Crunch inverso" under the rest's time.
- **How to do it:** the first photo showed the *Finish* question instead. The preview clicked `[aria-haspopup=dialog]`, and the Finish button has that attribute too (it opens an alert dialog): the selector became `[aria-label^="Come si esegue"]`. Then the panel: the name, "Nessuna" under it, the muscles, the steps, the video link. "Nessuna" alone did not say of what: it became "Attrezzatura: Nessuna".

### H3.32.5 Checking in the browser and on a phone

With `make start`, at a phone's width ([H3.8.1](#h381-phone-tablet-and-desktop-widths)), and once on a real phone ([H3.8.2](#h382-a-real-android-phone-over-usb)) for what jsdom cannot do (the signal, the screen off):

1. **The stopwatch:** a timed exercise (a plank), ▶. The panel rises at the bottom; the sets stay visible, the set timed ringed; the other ▶ are greyed. **Pause**, wait ten seconds, **Resume**: the time goes on from where it stopped. A target of 30 s: the signal comes 30 s of *counting* after the start, pauses excluded. Pause, lock the phone, unlock: still paused, same time. **Stop**: the set ticked with its time, the rest starts.
2. **Times:** type 870 in a plank's set: the stepper's title "Secondi · 14:30", the row "14:30". The Last column and history of a long set: "14:30", not "870 s". A 45-second set: "45 s".
3. **Up next:** on the first exercise of a day, the reminder under Add set names the second, with the plan's line; a tap on it does nothing. Tick every set of an exercise: the rest bar says "Dopo: …". On the last exercise: no card.
4. **How to do it:** a tap on the photo, then on the name: the panel with photos, muscles, steps; a long list scrolls inside the panel, the title stays. Swipe down or tap outside: the workout as it was. With the network off (DevTools → Network → Offline): the panel still opens, the texts there.
5. Both themes, and German: "Als Nächstes: …", "So geht's: …".

### H3.32.6 Second pass: a reminder, not a button

The first version made the "Up next" card a button that opened the next exercise, as Next does. Asked back at once: **moving on is the bottom bar's job**; the card should only say what comes next. Two ways of leaving the exercise, one in the middle of the screen beside the sets, is one too many, and a tap meant to scroll could land on it.

The change, in three files:

| File | Change |
|---|---|
| `src/components/workout/UpNextCard.tsx` | `<button onClick={onOpen}>` → `<aside aria-label={t('workout.upNext')}>`; the `onOpen` prop, the hover and focus styles and the › arrow removed; the lines are `<p>`s |
| `src/components/workout/WorkoutScreen.tsx` | `<UpNextCard item={nextItem} summary={…} />`, without `onOpen` |
| `src/pages/WorkoutPage.test.tsx` | The card found as `getByRole('complementary', { name: 'Up next' })`, its text checked, **no button inside it** (`within(card).queryByRole('button')` is null); the tap on it removed; the screen still on the bench press after every set is ticked |

**Why an `<aside>`.** It is HTML's element for content beside the main one, which a reminder is. With a name (`aria-label`) it becomes a landmark of role `complementary` that a screen reader can jump to, and that a test finds by role and name like the rest bar's region. Without a name, inside a `<section>`, it would be an anonymous box.

The checks, from `frontend/`:

```sh
npx vitest run src/pages/WorkoutPage.test.tsx
npm run lint
npm run typecheck
```

```
 Test Files  1 passed (1)
      Tests  17 passed (17)
```

ESLint and `tsc` printed nothing. Then `make toc` (a new heading) and `make check` from the root.

### H3.32.7 Third pass: removing what was added by hand

The next request: a set or an exercise added during the workout could not be removed. The rule asked for, and kept: **what the plan holds cannot be removed, what was added by hand can.** How it works and why it reads "added" from the plan item rather than from a stored flag: [C1.17.11](../concepts/C1-frontend.md#c11711-removing-what-was-added-by-hand).

| File | Change |
|---|---|
| `src/components/workout/workout-session.ts` | `canRemoveExercise()`, `canRemoveSet()`; actions `removeSet`, `removeExercise` |
| `src/components/workout/SetStepper.tsx` | `onRemove?` prop: **Remove this set** under Done |
| `src/components/workout/ExerciseMenu.tsx` | `onRemove?` prop: **Remove from workout**, and a third view, `'remove'`, the question |
| `src/components/workout/WorkoutScreen.tsx` | The two `onRemove`, given only when the rule allows; the set's closes the stepper first |
| `src/i18n/locales/*.json` | `workout.removeSet`, `removeExercise`, `removeExerciseTitle`, `removeExerciseText`, `removeConfirm`; Back reuses `noteBack` |
| `workout-session.test.ts`, `WorkoutPage.test.tsx` | Five tests of the rule and the reducer, one of the page |

**The order:** the rule and the actions first, with their tests (`npx vitest run src/components/workout/workout-session.test.ts`); then the two props and the screen; then the texts, added with the same kind of script as in H3.32.1 (`removeSet` after `stepperDone`, the four others after `video`); then the page's test. From `frontend/`:

```sh
npx vitest run src/pages/WorkoutPage.test.tsx src/components/workout src/i18n
npm run lint
npm run typecheck
```

```
 Test Files  4 passed (4)
      Tests  78 passed (78)
```

All passed at the first run. **Proving they can fail:** `canRemoveSet()` changed to allow any set (`index >= planned` → `index >= 0`), then put back:

```
 × removes a set added to a planned exercise, never one of the plan's
 × removes a set or an exercise added by hand, never the plan's
AssertionError: expected true to be false // Object.is equality
Error: expect(element).not.toBeInTheDocument()
      Tests  2 failed | 58 passed (60)
```

The first is the rule's own test; the second, the page's, found **Remove this set** in the stepper of a plan's set.

**Two details of the tests.**

- **Finding the set added** without knowing its weight: Add set copies the last set's values, so its button's name is "Set 5, kg: …" with whatever was there; `getByRole('button', { name: /^Set 5, kg/ })` matches the start of the name.
- **Closing a panel from a test** with the keyboard, `await user.keyboard('{Escape}')`, as a person on a laptop would: Radix closes a Sheet on Escape, and the next step starts with the page as it was.

**Checking in the browser:** in a plan's workout, tap a set's value: no **Remove this set**. **Add set**, tap the new set's value: **Remove this set** in red under Done; tap it: the set is gone. ⋯ on a plan's exercise: no **Remove from workout**. **Add exercises**, pick one, ⋯: **Remove from workout** last, in red; the question; **Back** returns to the menu, **Remove** removes it and shows the exercise before. In a free workout, remove the only exercise: the empty screen, **Add exercises** and **Cancel workout**.

### H3.32.8 Fourth pass: deleting a workout in progress

The next request: deleting a workout meant finishing it, then **Delete workout** in the summary. Why it goes in Finish's dialog and what each piece does: [C1.17.12](../concepts/C1-frontend.md#c11712-deleting-a-workout-in-progress).

| File | Change |
|---|---|
| `src/components/workout/FinishButton.tsx` | `onDiscard?` prop; the dialog controlled (`open`), with two views, the second asking again |
| `src/components/workout/WorkoutScreen.tsx` | `discard()`, given to both Finish buttons; `cancel()` of the empty free workout is now the same function |
| `src/components/workout/ResumeBanner.tsx` | `discard()` and the `onDiscarded` prop |
| `src/pages/HomePage.tsx`, `PlanDetailPage.tsx` | `useState(loadActiveSession)` gains its setter; `onDiscarded={() => setActive(null)}` |
| `src/i18n/locales/*.json` | `workout.discard`, `discardTitle`, `discardText`, `discardConfirm`, after `finishConfirm`; Back reuses `noteBack` |
| `WorkoutPage.test.tsx`, `HomePage.test.tsx` | One test each |

**A dialog that changes its question.** Radix's `AlertDialogAction` and `AlertDialogCancel` close the dialog when clicked; that is their job. To go from the first question to the second, and back, the buttons are plain `Button`s that only set the view:

```tsx
const [open, setOpen] = useState(false)
const [view, setView] = useState<'finish' | 'discard'>('finish')

function change(next: boolean) {   // the dialog's onOpenChange
  setOpen(next)
  if (!next) setView('finish')     // closed: the next opening starts from the first question
}
```

Without `open` held here, the dialog would close by itself (Escape, a tap outside, Keep going) and come back on the second question next time.

**A test's dialog changes name.** An alert dialog is named by its title, so after **Delete workout** the same dialog is found as `getByRole('alertdialog', { name: 'Delete the workout in progress?' })`, and after **Back** as "Finish the workout?" again. On Home, the banner leaves after a state change, so the test waits for it: `await waitFor(() => expect(screen.queryByText('Workout in progress: …')).not.toBeInTheDocument())`.

From `frontend/`:

```sh
npx vitest run src/pages/WorkoutPage.test.tsx src/pages/HomePage.test.tsx src/pages/PlanDetailPage.test.tsx src/i18n
npm run lint
npm run typecheck
```

```
 Test Files  4 passed (4)
      Tests  54 passed (54)
```

**Proving they can fail:** `storeActiveSession(null)` commented out in `discard()`, then put back. Two tests failed, the new one and the old **Cancel workout** one, which now goes through the same function:

```
 × deletes the workout in progress from Finish's dialog, after a second question, sending nothing
 × cancels an empty free workout, keeping nothing
AssertionError: expected { …(13) } to be null
```

**Checking in the browser:** start a day, tick a set, **Concludi**: under **Continua** and **Concludi e salva**, **Elimina l'allenamento** in red. Tap it: "Eliminare l'allenamento in corso?"; **Indietro** returns to the first question; **Elimina**: the plan's page, no banner, **Inizia** usable. History has no new workout. Then ✕ out of another workout, and from the banner on Home: **Concludi**, **Elimina l'allenamento**, **Elimina**: the banner goes. Escape on the second question, then **Concludi** again: the first question.

### H3.32.9 Fifth pass: Delete inside the dialog

The first look on a real screen, after H3.32.8: **Delete workout** hung below the dialog, outside its box, under the grey band of Keep going and Finish and save. Every test passed: a test finds a button by its name, and does not see where it is drawn.

**Why it was outside.** `AlertDialogFooter` (`src/components/ui/alert-dialog.tsx`) is not just a row of buttons: it *is* the bottom of the box, pulled to its edges with negative margins (`-mx-4 -mb-4`), with a border on top, a grey background and the bottom corners rounded (`rounded-b-xl`). An element placed after it starts below that edge, in the box's padding, and looks detached from the card. **The fix:** the button goes *inside* the footer, as one more of its children.

**Where inside it.** First tried: first in the code with `sm:mr-auto`, so that on a phone (where the footer is a reversed column) it shows last, and from 640 px (where the footer is a row pushed to the right) it sits on the left edge, apart from the two answers. The dialog was widened to 448 px for the three of them (`data-[size=default]:sm:max-w-md`).

**Looked at, as in H3.32.4,** with a throw-away preview drawing `FinishButton` and clicking it, in four languages at 360 and 700 px:

- at 360 px, in every language: Finish and save, Keep going, then **Delete workout** in red, all inside the card. Good;
- at 700 px, in Italian and English: the three on one row, inside. In **Spanish**, "Eliminar el entrenamiento", "Seguir", "Terminar y guardar": the grey band **ran past the card's right edge**; German was cut off the photo, with longer words still;
- before that, the widening had done nothing at all: `sm:max-w-md` lost to the dialog's own `data-[size=default]:sm:max-w-sm`. A class with an attribute in its condition (`data-[size=default]:`) makes a more specific CSS selector, and the more specific rule wins whatever the order of the classes. The fix was to write it with the same condition, `data-[size=default]:sm:max-w-md`.

**The final choice: a column everywhere when Delete is there.** Fitting three buttons on one row in four languages meant chasing widths language by language; the phone's column already looked right. The footer takes `className={cn(onDiscard && 'sm:flex-col-reverse')}`: the class replaces the footer's own `sm:flex-row` (`cn()` merges Tailwind classes, the later one winning within the same property, [C1.8](../concepts/C1-frontend.md#c18-styles-and-theme)), and the widening is no longer needed. Without Delete (no `onDiscard`), the footer is the row it always was. The photos again, Spanish, German and Italian at 360 and 700 px: three buttons one under the other, inside the card, Delete last in red.

**Two traps of the preview.** The first round of photos showed the dialogs closed: the page clicked Finish 300 ms after loading, before React had drawn it; 1000 ms fixed it. And `rm -r preview-tmp` answered `Device or resource busy`, as in H3.22.5: the shell had been left inside the folder; from the repository's root, `rmdir frontend/preview-tmp` removed it.

From `frontend/`:

```sh
npx vitest run src/pages/WorkoutPage.test.tsx src/pages/HomePage.test.tsx
npm run lint
npm run typecheck
```

```
 Test Files  2 passed (2)
      Tests  29 passed (29)
```

The tests did not change: the buttons' names and the dialog's behaviour are the same. **The lesson,** as in H3.15.10: a layout is not checked by tests; it is checked by looking at it, at the narrowest phone and on a wide window, in the longest language.

**A last error, in the final pass on the comments.** `make check` stopped at ESLint:

```
  742:1  error  Expected indentation of 6 spaces but found 2  @stylistic/indent
✖ 1 problem (1 error, 0 warnings)
```

`make check` names the line but not the file; `npx eslint src`, from `frontend/`, names both: `workout-session.ts`, a comment inside the reducer whose second line, rewritten by a script, had lost its indentation. The project's style rules check comments' indentation as well as code's. Indented like the line above it, `make check` passed.

---

← [H2. Backend: how to](H2-backend.md) · [Contents](../README.md) · [H4. Opening the database](H4-database-tools.md) →
