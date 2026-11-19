# C1. Frontend

The architecture of the React app in `frontend/`: its pieces, how data flows, the conventions of each layer, and the decisions behind each feature's screens. [C1.1](#c11-the-pieces)–[C1.12](#c112-typescript-conventions) cover the whole app; [C1.13](#c113-signing-in-and-forms) onwards, one feature each.

The stack's rationale is in [D2.2](../design/D2-decisions.md#d22-stack), the screens in [D1. UI design](../design/D1-ui.md), setup and commands in [S1.7](../start/S1-setup.md#s17-the-frontend-on-the-host) and [S1.8](../start/S1-setup.md#s18-everyday-commands), step-by-step recipes in [H3. Frontend](../how-to/H3-frontend.md).

## Contents

- [C1.1 The pieces](#c11-the-pieces)
- [C1.2 Folder structure](#c12-folder-structure)
- [C1.3 What happens when the app opens](#c13-what-happens-when-the-app-opens)
- [C1.4 Component conventions](#c14-component-conventions)
- [C1.5 Routing](#c15-routing)
- [C1.6 Server data](#c16-server-data)
- [C1.7 Translations](#c17-translations)
- [C1.8 Styles and theme](#c18-styles-and-theme)
- [C1.10 Tests and checks](#c110-tests-and-checks)
- [C1.11 Known limits](#c111-known-limits)
- [C1.12 TypeScript conventions](#c112-typescript-conventions)
- [C1.13 Signing in and forms](#c113-signing-in-and-forms)
  - [C1.13.1 The one idea: who is signed in is server data](#c1131-the-one-idea-who-is-signed-in-is-server-data)
  - [C1.13.2 The guards](#c1132-the-guards)
  - [C1.13.3 Anatomy of a form](#c1133-anatomy-of-a-form)
  - [C1.13.4 Preferences on the account](#c1134-preferences-on-the-account)
  - [C1.13.5 Details that are easy to miss](#c1135-details-that-are-easy-to-miss)
  - [C1.13.6 Testing a screen with the API](#c1136-testing-a-screen-with-the-api)
  - [C1.13.7 Continue with Google](#c1137-continue-with-google)
  - [C1.13.8 The link to the admin panel](#c1138-the-link-to-the-admin-panel)
- [C1.14 The exercise library screens](#c114-the-exercise-library-screens)
  - [C1.14.1 The pages and their pieces](#c1141-the-pages-and-their-pieces)
  - [C1.14.2 A list one page at a time](#c1142-a-list-one-page-at-a-time)
  - [C1.14.3 Filters in the address](#c1143-filters-in-the-address)
  - [C1.14.4 The editor's form](#c1144-the-editors-form)
  - [C1.14.5 Photos](#c1145-photos)
  - [C1.14.6 Testing it](#c1146-testing-it)
  - [C1.14.7 Uploading photos, and Duplicate as mine](#c1147-uploading-photos-and-duplicate-as-mine)
- [C1.15 The plan screens](#c115-the-plan-screens)
  - [C1.15.1 The pages and their pieces](#c1151-the-pages-and-their-pieces)
  - [C1.15.2 One line per exercise](#c1152-one-line-per-exercise)
  - [C1.15.3 Tabs whose state is in the address](#c1153-tabs-whose-state-is-in-the-address)
  - [C1.15.4 Actions on a plan](#c1154-actions-on-a-plan)
  - [C1.15.5 Testing it](#c1155-testing-it)
  - [C1.15.6 A plan as a file: export and import](#c1156-a-plan-as-a-file-export-and-import)
- [C1.16 The plan editor](#c116-the-plan-editor)
  - [C1.16.1 The pieces](#c1161-the-pieces)
  - [C1.16.2 The draft and its reducer](#c1162-the-draft-and-its-reducer)
  - [C1.16.3 Drag and drop with dnd-kit](#c1163-drag-and-drop-with-dnd-kit)
  - [C1.16.4 The draft kept in the browser](#c1164-the-draft-kept-in-the-browser)
  - [C1.16.5 Saving](#c1165-saving)
  - [C1.16.6 Testing it](#c1166-testing-it)
  - [C1.16.7 Two steps, one draft](#c1167-two-steps-one-draft)
  - [C1.16.8 Creating an exercise from the picker](#c1168-creating-an-exercise-from-the-picker)
  - [C1.16.9 Set types and the RPE field](#c1169-set-types-and-the-rpe-field)
- [C1.17 Workout mode](#c117-workout-mode)
  - [C1.17.1 The pieces](#c1171-the-pieces)
  - [C1.17.2 Starting: the plan becomes a workout](#c1172-starting-the-plan-becomes-a-workout)
  - [C1.17.3 The workout and its reducer](#c1173-the-workout-and-its-reducer)
  - [C1.17.4 The rest timer: a moment, not a countdown](#c1174-the-rest-timer-a-moment-not-a-countdown)
  - [C1.17.5 The queue of workouts to send](#c1175-the-queue-of-workouts-to-send)
  - [C1.17.6 Testing it](#c1176-testing-it)
  - [C1.17.7 The big stepper and the exercise's menu](#c1177-the-big-stepper-and-the-exercises-menu)
  - [C1.17.8 The stopwatch of a timed set](#c1178-the-stopwatch-of-a-timed-set)
  - [C1.17.9 Exercises done as fast as possible](#c1179-exercises-done-as-fast-as-possible)
  - [C1.17.10 Times, up next, how to do it](#c11710-times-up-next-how-to-do-it)
  - [C1.17.11 Removing what was added by hand](#c11711-removing-what-was-added-by-hand)
  - [C1.17.12 Deleting a workout in progress](#c11712-deleting-a-workout-in-progress)
- [C1.18 Home](#c118-home)
  - [C1.18.1 The pieces](#c1181-the-pieces)
  - [C1.18.2 Starting from Home: one hook for two pages](#c1182-starting-from-home-one-hook-for-two-pages)
  - [C1.18.3 The card: choose, then start](#c1183-the-card-choose-then-start)
  - [C1.18.4 This week, by the device's clock](#c1184-this-week-by-the-devices-clock)
  - [C1.18.5 Testing it](#c1185-testing-it)
- [C1.19 The summary and history](#c119-the-summary-and-history)
  - [C1.19.1 The pieces](#c1191-the-pieces)
  - [C1.19.2 The summary: drawn from the phone](#c1192-the-summary-drawn-from-the-phone)
  - [C1.19.3 Better than last time, exercise by exercise](#c1193-better-than-last-time-exercise-by-exercise)
  - [C1.19.4 History: pages from the server](#c1194-history-pages-from-the-server)
  - [C1.19.5 Testing it](#c1195-testing-it)
- [C1.20 Showing that something is loading](#c120-showing-that-something-is-loading)
- [C1.21 Opening with no network](#c121-opening-with-no-network)

---

## C1.1 The pieces

| Piece | Role | Where |
|---|---|---|
| **React 19** | StrictMode in development | everywhere |
| **TypeScript 6** | Strict mode | `tsconfig.app.json` |
| **Vite 8** | Dev server with the API proxy, production build | `vite.config.ts` |
| **vite-plugin-pwa** (Workbox) | The service worker: the app opens with no network ([C1.21](#c121-opening-with-no-network)) | `vite.config.ts` |
| **React Router 8** | Data router (`createBrowserRouter`), guards as parent routes | `src/router.tsx` |
| **TanStack Query 5** | Every piece of server data, the signed-in user included; kept on the phone in IndexedDB (`react-query-persist-client`, `idb-keyval`) | `src/lib/query-client.ts`, `src/lib/query-persistence.ts`, `src/api/` |
| **react-hook-form + zod** | Forms, rules with translated messages ([C1.13.3](#c1133-anatomy-of-a-form)) | `src/pages/auth-schemas.ts`, `src/lib/form.ts` |
| **i18next + react-i18next** | Four languages, type-checked keys | `src/i18n/` |
| **Tailwind CSS 4** | Styling, design tokens as CSS variables | `src/index.css` |
| **shadcn/ui** (Radix base, Nova preset) | Accessible primitives, copied into the project | `src/components/ui/` |
| **dnd-kit** | Drag and drop in the plan editor | `components/plans/editor/` |
| **Lucide** | Icons | `lucide-react` |
| **Inter** | Bundled font, so it works offline | `@fontsource-variable/inter` |
| **Vitest + Testing Library** | Unit and component tests on jsdom | `*.test.ts(x)` next to the code |
| **ESLint** (stylistic rules) | Lint and code style, no Prettier | `eslint.config.js` |

In development (Caddy takes Vite's place in production, [D2.6](../design/D2-decisions.md#d26-hosting)):

```
Browser ── http://localhost:5673 ──▶ Vite ──┬── /api/*, /sanctum/*, /storage/*, /auth/* ──▶ Laravel (Docker, :8500)
                                            └── everything else ──▶ the React app (index.html + JS)
```

One origin for both is what lets Sanctum's session cookie work without CORS.

---

## C1.2 Folder structure

```
frontend/
├── index.html              applies the saved theme before React loads
├── vite.config.ts          plugins (the service worker's too), the @/ alias, dev server + proxy, preview, Vitest
├── components.json         shadcn/ui settings
├── public/                 favicon.svg, the logo's mark
└── src/
    ├── main.tsx            CSS, translations, renders <App />
    ├── App.tsx             providers: query client, theme, router
    ├── router.tsx          the route table
    ├── index.css           Tailwind + the colour tokens of both themes
    ├── api/                one file per API resource: types, cache keys, fetchers, hooks
    │   ├── auth.ts           the account (C1.13)
    │   ├── exercises.ts      the library (C1.14)
    │   ├── plans.ts          plans (C1.15, C1.16)
    │   ├── sessions.ts       workouts (C1.17, C1.19)
    │   ├── home.ts           Home's single request (C1.18)
    │   └── health.ts, muscles.ts, equipment.ts
    ├── components/
    │   ├── ui/               shadcn/ui components
    │   ├── layout/           AppLayout, AuthLayout, SideNav, BottomTabBar, nav-items, SyncIndicator, ConnectionBanner
    │   ├── brand/            BrandMark, Wordmark
    │   ├── home/             Home's pieces; week-summary.ts (C1.18)
    │   ├── history/          summary and history pieces; totals.ts, compare.ts, feeling.ts (C1.19)
    │   ├── exercises/        library pieces; exercise-form.ts (C1.14)
    │   ├── plans/            plan screens' pieces; plan-format.ts (C1.15), plan-draft.ts, draft-storage.ts (C1.16),
    │   │                     plan-file.ts (C1.15.6)
    │   │   └── editor/         the plan editor (C1.16)
    │   ├── workout/          workout mode: workout-session.ts, session-storage.ts, the screen's pieces (C1.17);
    │   │                     useStartWorkout.ts, usePrepareWorkouts.ts and ResumeBanner, shared with Home (C1.18)
    │   └── *.tsx             shared across pages: PageHeader, EmptyState, ComingSoon, SettingRow, FormField, FormBanner…
    ├── pages/              one component per route; auth-schemas.ts
    ├── routes/             RequireAuth, RequireGuest, useAccountPreferences (C1.13)
    ├── i18n/               setup, languages.ts, i18next.d.ts (typed keys), locales/{it,en,es,de}.json
    ├── lib/                framework-free helpers (http, query-client, query-persistence, form, format, week, download, alarm,
    │                       pending-sessions, sync-state, shown-data) and app-wide hooks (useDebouncedValue, useNow,
    │                       useWakeLock, usePendingSessions, useSyncState, useServerWatch)
    ├── theme/              theme logic, context, provider, hook
    └── test/               setup.ts; fake API and page rendering (auth-helpers.tsx); fixtures per area
                            (exercise-, plan-, session-helpers.ts)
```

**Naming.**

- **Components:** PascalCase files named after their export, one main component per file, named exports only.
- **Everything else:** kebab-case (`query-client.ts`); hooks are `useSomething.ts`.
- **shadcn/ui** files keep shadcn's names (`button.tsx`).
- **Tests** sit next to what they test.
- **Imports** use `@/` outside the current folder, a relative path for neighbours.

---

## C1.3 What happens when the app opens

1. **In a production build, the service worker** answers first: `index.html` and the app's files come from its cache, network or not ([C1.21](#c121-opening-with-no-network)).
2. **`index.html`**'s inline script reads the saved theme and sets `class="dark"` on `<html>` before first paint, so a light-theme user never sees a dark flash.
3. **`src/main.tsx`** imports `index.css` and `src/i18n` (language: saved choice, else browser's, else English), then renders `<App />`.
4. **`App.tsx`** nests `QueryClientProvider` → `ThemeProvider` → `RouterProvider`.
5. On a signed-in route, **`RequireAuth`** asks `GET /api/user` and shows skeletons until it answers (with no network, "Can't reach the server" at once); a visitor goes to `/login`, a user continues with the account's language and theme applied ([C1.13](#c113-signing-in-and-forms)).
6. **`AppLayout`** draws the navigation around the page's `<Outlet />`.

The frame, the query cache and component state survive navigation between screens.

---

## C1.4 Component conventions

**Where state lives.**

| Kind | Where | Example |
|---|---|---|
| Server data, the signed-in user included | TanStack Query's cache, never copied into `useState` | `useCurrentUser()`, `usePlan()` |
| State the address should keep (filters, open tab, editor step) | The query string, through `useSearchParams()` | `?q=panca`, `?day=2` |
| A screen's own workflow (the plan draft, the workout) | `useReducer` over a pure reducer in a plain module | `plan-draft.ts`, `workout-session.ts` |
| Local UI state (a dialog's view, a chosen chip) | `useState` | `FinishButton`, `ActivePlanCard` |
| Values the whole tree needs | Context, only for the theme | `src/theme/` |
| What must survive a reload | `localStorage`, behind one module per kind of data | `draft-storage.ts`, `session-storage.ts` |

**Logic lives outside components.** Anything worth testing on its own (conversions, rules, scoring, formatting) is a plain `.ts` module next to the components that use it, with no React: `plan-format.ts`, `compare.ts`, `stepper.ts`, `week-summary.ts`. Their tests render nothing.

**Reducers are pure.** They never read the clock, make ids or touch storage: "now" arrives in the action (`{ type: 'toggleSet', now }`), and anything that makes new UUIDs (`exerciseFrom()`, `swappedExercise()`) is built before dispatching. StrictMode calls reducers twice; a reducer that made ids would make two.

**Effects only talk to the world outside React:** the `<html>` element, timers, browser events, storage. Derived values are computed while rendering. A timer that changes state does so from its callback, never synchronously in the effect body.

**Controlled where the parent needs to know.** Dialogs opened from elsewhere (the swap picker, "How to do it", Finish's two views) take `open` and `onOpenChange`; self-contained ones keep their own state. `ExercisePicker` supports both (`open ?? ownOpen`).

**Optional callbacks as switches.** A prop such as `onRemove?: () => void` both enables a control and says what it does: the parent passes it only when the action is allowed, and the child draws the button only when it is there.

**Props** are typed by an `interface` next to the component.

---

## C1.5 Routing

- **The table** is `src/router.tsx`. Nesting is guard → frame → page: `RequireAuth` → `AppLayout` → signed-in pages; `RequireGuest` → `AuthLayout` → sign-in screens ([C1.13](#c113-signing-in-and-forms)). Workout mode (`session/:id`) is a sibling of `AppLayout` inside `RequireAuth`: signed in, full screen ([C1.17](#c117-workout-mode)). The public shared plan (phase 2) will be a top-level sibling; a comment marks where.
- **Navigation** uses `NavLink`. Links that leave the React app (Google sign-in, the admin panel) are plain `<a>`.
- **Parameters:** exercise ids are numbers (`Number(id)`), plan and workout ids UUID strings.
- **A tab stays lit on the pages under it**, since `NavLink` matches by prefix: history lives at `/progress/history` for that reason (`end` turns it off for Home's `/`).
- **The query string** holds the library's filters, the plan list's view (`?archived=1`), a plan's open day and the editor's step (`?day=2`) ([C1.14.3](#c1143-filters-in-the-address)).
- **Not found and crashes:** `path: '*'` renders `NotFoundPage` inside the frame; `errorElement` (`RouteErrorPage`) replaces a screen that throws.
- **The full map** of planned routes is [D1.3](../design/D1-ui.md#d13-information-architecture-and-navigation).

---

## C1.6 Server data

**`src/lib/http.ts` is the only door to the API.** `request<T>(path, { method, body, signal })` wraps `fetch` and:

- sends `Accept: application/json` (Laravel answers errors as JSON) and `Accept-Language` (Laravel answers in the user's language);
- for `POST`, `PUT`, `PATCH` and `DELETE`, makes sure the `XSRF-TOKEN` cookie exists (calling `/sanctum/csrf-cookie` if not) and echoes it in `X-XSRF-TOKEN`;
- retries once with a fresh cookie on a 419;
- turns every failure into an `ApiError`: `status` 0 when there was no answer, otherwise the HTTP status; `fieldErrors` with Laravel's 422 messages per field.

**TanStack Query.**

- **Keys** come from each resource's `xxxKeys` object and include the language wherever the server translates the answer.
- **`staleTime`** is 30 seconds (`query-client.ts`).
- **Kept on the phone** for a week, in IndexedDB, and restored when the app starts ([C1.21](#c121-opening-with-no-network)); `gcTime` matches it.
- **Retries:** twice, only for network and 5xx errors; a 4xx would fail the same way again.
- **Mutations** invalidate broadly (`['plans']`, not one plan): the server's answer is the truth, and only the optimistic preferences patch the cache by hand ([C1.13.4](#c1134-preferences-on-the-account)).
- **A 401 on any request** marks the user as signed out, and the guards go to `/login` ([C1.13.1](#c1131-the-one-idea-who-is-signed-in-is-server-data)).

**The `src/api/` pattern.** One file per resource: the response types, the cache keys, plain `fetchX` functions (usable outside React), `xQuery()` options where a hook and code outside it share a key (`planQuery()`, `lastSetsQuery()`, used by Start and the reading ahead of [C1.18.2](#c1182-starting-from-home-one-hook-for-two-pages)), and the hooks. `health.ts` is the smallest.

**Every component that reads server data handles three states:** loading (a skeleton, never a full-page spinner), error (a message and **Retry**), and success ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)). **The data wins over the error:** a refresh that fails leaves the query in `error` with its last answer, which `shownData()` (`lib/shown-data.ts`) still gives, so a screen shows a message only with nothing to show. Not after a 4xx: a 404 or a 403 says the thing is gone or not the user's, and showing it would lead to changes that fail. A request that runs while content is already on screen shows a smaller sign: [C1.20](#c120-showing-that-something-is-loading).

---

## C1.7 Translations

**No text is written in a component** ([D2.4](../design/D2-decisions.md#d24-languages)): every text comes from `src/i18n/locales/<language>.json` through `t()`. Plain modules that produce text (`set-text.ts`) call `i18n.t()` with an explicit `lng`, so they stay testable without React.

**The files** are nested by area:

| Group | Holds |
|---|---|
| `app`, `nav` | name, tagline; navigation labels |
| `pages.<page>` | each page's `title` and `description` |
| `home`, `plans`, `exercises`, `progress`, `profile`, `auth`, `workout`… | each screen's own texts |
| `common`, `preferences`, `theme`, `server` | texts shared by several components |
| `errors` | not-found and crash pages |

**Safety nets:** `i18next.d.ts` types the keys from `en.json`, so a typo is a type error; `locales.test.ts` fails if a language misses a key, has an extra or empty one, or drops a `{{placeholder}}`.

**Spanish and German** may be machine translated until someone checks them, as for the exercise library ([D2.3](../design/D2-decisions.md#d23-exercise-library)).

**Numbers and dates** go through `Intl`, via `src/lib/format.ts`: `formatWeight(82.5, 'it')` is "82,5 kg", in English "82.5 kg"; `formatLongDate`, `formatDayParts`, `formatDuration`, `formatDaysAgo` likewise.

**Markup inside a translation** uses `<Trans>` with a tag of our own (`"Ready to <hl>train</hl>?"`), so each language places the highlight on its own word. **Plurals** use `_one` / `_other`.

**A new language** needs its code in `SUPPORTED_LANGUAGES` and `LANGUAGE_NAMES` (`languages.ts`), `locales/<code>.json`, and the import in `i18n/index.ts` and `locales.test.ts`.

---

## C1.8 Styles and theme

**Mobile first.** Unprefixed classes are the phone layout; `sm:` (640 px) and `lg:` (1024 px) are the breakpoints of [D1.7](../design/D1-ui.md#d17-responsive-layout-and-accessibility). `dark:` is rarely needed, since the tokens change with the theme. Components that live in containers of varying width use container queries ([C1.16.8](#c1168-creating-an-exercise-from-the-picker)).

**Colour tokens.** No colour is written in a component. The values are in `src/index.css`, one set per theme, from [D1.5](../design/D1-ui.md#d15-design-system):

| Token (CSS variable) | Tailwind classes | Use |
|---|---|---|
| `background` / `foreground` | `bg-background`, `text-foreground` | page and text |
| `card` | `bg-card` | cards, sheets ("surface" in D1.5) |
| `primary` | `bg-primary`, `text-primary` | main actions, the lime |
| `muted-foreground` | `text-muted-foreground` | secondary text ("muted" in D1.5) |
| `muted`, `secondary`, `accent` | `bg-muted`… | quiet backgrounds; `accent` is shadcn's hovered-item background |
| `timer` | `bg-timer`, `text-timer` | the rest timer ("accent" in D1.5, renamed to avoid shadcn's `accent`) |
| `success` / `warning` / `destructive` | `text-success`… | record / offline, pending / delete |
| `border`, `input`, `ring` | `border`, `ring` | lines, fields, focus ring |

**The theme.** The `dark` class on `<html>` switches every token. `index.html` sets it before React loads, and `ThemeProvider` keeps it in step with the user's choice; `system` follows the OS live. The choice is saved on the account (it follows the user) and in `localStorage` under `atleoplan.theme` (so `index.html` can apply it before first paint, [C1.13.4](#c1134-preferences-on-the-account)). Read with `useTheme()`, change with `useUpdatePreferences()`.

**shadcn/ui.**

- **Generated files keep shadcn's shape:** no header or doc comments of ours; a comment marks only what we changed (the `xl` sizes and `pending` of `button.tsx`, the `closeLabel` of `dialog.tsx` and `sheet.tsx`), so an upstream update can be compared. Adding one: [H3.9](../how-to/H3-frontend.md#h39-a-shadcnui-component).
- **Default sizes are for mouse use** (32 px buttons). Touch targets are at least 48 px, 56 px in workout mode ([D1.5](../design/D1-ui.md#d15-design-system)): `size="xl"` or an explicit height.
- **`pending`** on `Button` is ours: disabled, spinner in place of the icon, `aria-busy`. Every button that sends a request uses it ([C1.20](#c120-showing-that-something-is-loading)).

**Our own style tools**, from the "Visual style" of [D1.5](../design/D1-ui.md#d15-design-system):

| Tool | What it does | Example |
|---|---|---|
| `text-gradient-primary` (utility) | Text painted with the lime gradient | the highlighted word on Home |
| `glow-primary` (utility) | A soft lime halo | the logo, the current tab |
| `border-glow` (utility) | Card background with a 1 px lime-to-transparent border | `EmptyState`, Home's week card, Profile's header |
| `Button size="xl"` | The 48 px main action, glowing when enabled | every call to action |
| `PageHeader` | Title, main actions on the right (`actions`), description; `eyebrow` only where it adds information ([D1.5](../design/D1-ui.md#d15-design-system) "Page header") | every page but Home |
| `EmptyState` | Illustration, title, sentence, actions; `comingSoon` adds the badge | Plans, Exercises, Progress, Home |
| `SettingRow` | Icon tile, label, hint, control, under the text on phones; `inline` keeps a small one (a switch) beside it | Profile |
| `SettingGroup` | A short title over a card of `SettingRow`s; a `<section>` named by its title | Profile, every tab |
| `WorkoutPreferences` | Profile's Workout tab ([C1.13.4](#c1134-preferences-on-the-account)) | Profile |
| `BrandMark`, `Wordmark` | The logo | sidebar, phone header |

The utilities are declared with `@utility` in `index.css`, so variants apply to them (`lg:border-glow`, `group-aria-[current=page]:glow-primary`).

**Icons** next to a text are `aria-hidden`; an icon alone in a button has an `aria-label` ([P1.2](../project/P1-conventions.md#p12-code)).

---

## C1.10 Tests and checks

Two layers, both Vitest on jsdom, next to the code:

- **Plain modules** (`plan-draft.ts`, `workout-session.ts`, `compare.ts`, `plan-format.ts`, `week.ts`, `http.ts`…) are tested as functions: every reducer action, every rule, every format, with the moment passed in.
- **Pages** are rendered with the real router and a fake API ([C1.13.6](#c1136-testing-a-screen-with-the-api)) and driven through `userEvent`. Queries go by role and accessible name, never by CSS class, so a control a test cannot find by name is one a screen reader cannot find either.

`src/test/setup.ts` sets English and cleans up after each test: the DOM, cookies, `localStorage`, the stubbed `fetch`, and stubs `ResizeObserver` (missing from jsdom, needed by Radix). Commands: [H3.11](../how-to/H3-frontend.md#h311-commands-at-a-glance).

**What jsdom cannot show** is checked in a browser against the real stack ([H3.8](../how-to/H3-frontend.md#h38-checking-in-the-browser)): cookies, CSRF and the proxy; layout (dnd-kit measures zero everywhere); sound, vibration, Wake Lock, timers on a sleeping phone.

---

## C1.11 Known limits

- **Bundle size.** The production build is one JavaScript chunk, above Vite's 500 kB warning. The first candidate for a `lazy` route is the plan editor (dnd-kit, Dialog).
- **A plan draft follows the unit of the moment.** An unsaved draft kept in the browser holds weights as typed; after a unit change it is read in the new unit. Unguarded, unlike a workout in progress ([C1.13.4](#c1134-preferences-on-the-account)).
- **A preference changed offline is not saved.** It stays on screen until reload, then the account's value returns. Preferences will join a general offline queue (FEAT-3); finished workouts already have one ([C1.17.5](#c1175-the-queue-of-workouts-to-send)).
- **Offline, only what was opened.** With no network the screens show the answers kept on the phone ([C1.21](#c121-opening-with-no-network)): a plan never opened cannot start, a library search finds nothing, an exercise added during a workout has an empty **Last** column, its sets read only then, and a photo neither seen online nor in the active plan does not show. A workout still in the queue is not last time yet: the server does not have it. Charts come in phase 2.
- **`fsevents`'s install script** is blocked by npm's install-scripts guard. It is an optional macOS watcher Vite does not need; leave it blocked.

---

## C1.12 TypeScript conventions

- **Strict mode,** no `any`. `as` and `!` only where the type system cannot know (a Select's string value back to its union, `#root` in `main.tsx`).
- **Closed lists are `as const` arrays** with their type derived: `LOGGING_TYPES`, `SET_TYPES`, `SUPPORTED_LANGUAGES` give `LoggingType`, `SetType`, `Language`. One source for values and type, iterable for selects and tests.
- **Anything from outside is checked, not cast.** Values from the address, `localStorage`, a chosen file or `i18n.resolvedLanguage` go through a type guard (`isLanguage()`, `isObject()`) or a fallback.
- **Results and actions are discriminated unions:** `readPlanFile()` returns `{ ok: true, … } | { ok: false, problem }`; the reducers take `DraftAction` and `WorkoutAction`.
- **API types mirror the Resources**, in `src/api/`; decimals the backend sends as exact text (`"80.000"`) stay `string` and are read with `Number()` where computed.
- **Fields added to a stored shape are optional.** A workout or draft saved by an older build lacks them (`stopwatch?`, `paused_ms?`, `notes?`, `for_time?`); readers default them (`?? 0`).
- **The API's answers are stored too,** in the cache kept on the phone. A field added to a Resource and read without a default would be missing from an answer saved by the older build: raise `CACHE_VERSION` (`lib/query-persistence.ts`) in the same change, and the old copy is dropped.

---

## C1.13 Signing in and forms

The React side of signing in; the server side is [C2.7](C2-backend.md#c27-signing-in-sanctum), the screens [D1.4.1](../design/D1-ui.md#d141-sign-in-and-onboarding).

### C1.13.1 The one idea: who is signed in is server data

There is no "signed in" flag. **Who is signed in is one query in the cache,** `authKeys.user` (`src/api/auth.ts`):

| Value in the cache | Means |
|---|---|
| `undefined` | Not known yet |
| `null` | A visitor: `GET /api/user` answered 401 |
| a `User` | Signed in |

```
signing in  ──▶ refetch GET /api/user ──▶ cache holds the User ──▶ RequireGuest moves into the app
signing out ──▶ cache holds null ────────────────────────────────▶ RequireAuth moves to /login
any 401     ──▶ cache holds null ────────────────────────────────▶ RequireAuth moves to /login
```

The forms never navigate after signing in, and no screen handles an expired session. The last line is in `src/lib/query-client.ts`. Both of the last two go through `forgetAccount()`: with the user, every other answer leaves the cache, and so the copy kept on the phone, so the next account on the device finds nothing of this one.

**`fetchCurrentUser` distinguishes errors.** A 401 means "nobody" and returns `null`. No connection or a 5xx stays an error: it says nothing about who is signed in, and must not send anyone to `/login`.

### C1.13.2 The guards

Guards are parent routes in `src/routes/`.

**`RequireAuth`:**

| The cache says | It renders |
|---|---|
| Still waiting | Skeletons ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)): rendering either the app or `/login` would flash the wrong one |
| `null` | `<Navigate to="/login" />`, the address kept in the router's `state` |
| Nothing, and the request failed | "Can't reach the server" and **Try again** |
| A `User` | `<Outlet />` |

It also calls `useAccountPreferences` ([C1.13.4](#c1134-preferences-on-the-account)) and `usePendingSessions` ([C1.17.5](#c1175-the-queue-of-workouts-to-send)).

**`RequireGuest`** is the opposite: a signed-in user goes to the remembered address, or Home.

Guards decide only what to show; the data is protected by `auth:sanctum` on the server.

### C1.13.3 Anatomy of a form

Every form has the same four pieces; `src/pages/LoginPage.tsx` is the reference.

**1. Rules: a zod schema** (`src/pages/auth-schemas.ts`), built by a function taking `t` so its messages are translated; the values' type is derived from it:

```ts
export function signInSchema(t: TFunction) {
  return z.object({
    email: z.email({ error: t('auth.errors.email') }),
    password: z.string().min(1, { error: t('auth.errors.required') }),
  })
}
export type SignInValues = z.infer<ReturnType<typeof signInSchema>>
```

**2. Fields: react-hook-form** with `zodResolver`, one `FormField` per field, `<form noValidate>`: the browser's own bubbles would be in the browser's language, not the app's.

**3. Request: a mutation** in `src/api/`; its `isPending` drives the submit button's `pending` ([C1.20](#c120-showing-that-something-is-loading)):

```tsx
signIn.mutate(values, {
  onError: error => showRequestError(error, form.setError, ['email', 'password'], t),
})
```

**4. Server refusals: `showRequestError`** (`src/lib/form.ts`). A message about a visible field goes under it; anything else goes to `errors.root`, shown by `FormBanner`: no connection, throttling, or an error on a field that is not on screen (the email in the reset link).

**Validated twice.** The browser's check is for speed and language; the server's is the one that counts. The rules match: `PASSWORD_MIN_LENGTH` here, `Password::default()` there.

`FormField` links label, 48 px input and error through `htmlFor`, `aria-invalid` and `aria-describedby`.

### C1.13.4 Preferences on the account

A choice made on the phone follows the user to the computer ([D1.4.14](../design/D1-ui.md#d1414-profile-and-settings)). Profile keeps the account on top and the settings in three tabs (shadcn's `Tabs`, controlled by `?tab=` in the address as a plan's days are, `replace` so Back leaves the page; no parameter or an unknown one is Workout): **Workout** (`WorkoutPreferences`), **App** (language, theme) and **About** (the server's status, and the admin panel for admins). Radix draws only the open panel, so About's health check runs when it is opened. Each panel is named by its tab (`role="tabpanel"`); in it, the rows sit in `SettingGroup`s, a small title over a card: Weights, Timers, Sound and vibration, Plans in Workout (one card of seven rows was hard to scan), Display in App, Server and Administration in About. Even a tab with two rows has its group, so the three look alike and the next setting has somewhere to go. All are saved by one hook, `useUpdatePreferences`, to `PATCH /api/user/preferences`, one field per request ([C2.7](C2-backend.md#c27-signing-in-sanctum)). Data flows one way:

```
LanguageSelect, ThemeSelect ──▶ useUpdatePreferences ──▶ the cache (at once) and the server
                                                              │
        i18next, ThemeProvider ◀── useAccountPreferences ◀────┘

WorkoutPreferences ──▶ useUpdatePreferences ──▶ the cache ──▶ workout mode and the editor read useCurrentUser()
```

The pickers only change the account; `useAccountPreferences`, called by `RequireAuth`, applies the account to i18next and the theme. A device with no saved choice gets the account's at sign-in; a visitor uses the browser's language and this browser's last saved theme.

**The race.** Two saves can be in flight together; writing each answer into the cache loses a change:

| Step | Language request | Theme request | Cache |
|---|---|---|---|
| 1. The user picks Italian, then Dark | sent | sent | `it`, dark |
| 2. The theme's request is handled first | not saved yet | answers: `de`, dark | **`de`**, dark |
| 3. The screen jumps back to German | | | |

So `useUpdatePreferences` is optimistic and never writes an answer into the cache (the endpoint answers 204); `onMutate` cancels reads in flight, which could hold old values; `onSettled` refetches only once the last request has finished. `src/api/auth.test.tsx` reproduces the race with one request held back.

**The workout preferences** need no `useAccountPreferences`: nothing outside React must be told. Readers use the cached user.

| Row | Control | Saved as | Read by |
|---|---|---|---|
| Weight unit | Select: kg, lb | `weight_unit` (with `weight_step`) | every weight shown and typed ([D3.2.3](../design/D3-data-model.md#d323-weights-are-always-in-kilograms)) |
| Default rest | Select: No timer, 30 s … 5 min | `default_rest_seconds` (0 for no timer) | workouts started afterwards, for exercises with no rest of their own |
| Countdown | Select: None, 3, 5, 10, 15, 30 s | `countdown_seconds` (0 for none) | the stopwatch's next ▶ ([C1.17.8](#c1178-the-stopwatch-of-a-timed-set)) |
| Weight step | Select: 0.5 … 5 kg, 1 … 10 lb | `weight_step`, text with two decimals (`"1.25"`) | the big stepper ([C1.17.7](#c1177-the-big-stepper-and-the-exercises-menu)) |
| Sound, Vibration | Switch | `timer_sound`, `timer_vibration` | end of rest, the stopwatch's countdown and a hold's end (`lib/alarm.ts`) |
| RPE in plans | Switch | `show_rpe` | the editor's RPE field ([C1.16.9](#c1169-set-types-and-the-rpe-field)) |

- **Select values are text.** The rest goes in as `String(90)` and back as `Number(value)`; the step is compared as `step.toFixed(2)`, the account's own text (`"2.50"`). A value not in the list is added to it (`withCurrent()`), so the Select always shows the account's value.
- **The unit carries its step.** Changing the unit sends `{ weight_unit: 'lb', weight_step: '5.00' }` in one request: a 2.5 step chosen in kilograms would be too fine in pounds.
- **Disabled during a workout.** A workout's fields hold weights as typed in the current unit ([C1.17.3](#c1173-the-workout-and-its-reducer)); converted at Finish in another unit, 80 kg would become 80 lb. With a workout on the phone (`loadActiveSession()`), the unit Select is disabled and its hint says why. Unsaved plan drafts have the same weakness without a guard ([C1.11](#c111-known-limits)).

### C1.13.5 Details that are easy to miss

- **`remember: true` is always sent.** A session lasts two hours, and a phone at the gym must not ask for a password; there is no checkbox.
- **A 419 gets a second try** (`request()`), so a sign-in page left open for hours still works.
- **`Accept-Language`** on every request makes Laravel answer in the user's language ([C2.7.7](C2-backend.md#c277-messages-in-the-users-language)).
- **Signing out empties the cache** except the user, which becomes `null`: the next user on this device must not see this one's data.
- **`autoComplete`** (`username`, `current-password`, `new-password`) on every credential field, for password managers.

### C1.13.6 Testing a screen with the API

Tests never call a real server. `src/test/auth-helpers.tsx` provides:

- **`fakeApi({ 'POST /api/auth/login': { status: 200, body: {} } })`**: replaces `fetch` with a table of answers; a function value answers differently per call; `'network'` fails as offline. A key with a query string matches before the bare path.
- **`renderRoutes(routes, '/login')`**: the real providers around the routes, with a fresh cache.
- **`sentBody(fake, path)`**: the body of the first call to `path` that sent one (a page often reads before it writes).

**A fake that remembers.** When a test changes server state, later answers must change with it, or the app sees a contradictory server and the test turns flaky. Answers read a variable the mutating answer sets: `'GET /api/user': () => (signedOut ? visitor : signedInAs())` (`ProfilePage.test.tsx`).

### C1.13.7 Continue with Google

The server does the OAuth exchange ([C2.7.8](C2-backend.md#c278-signing-in-with-google)); `src/components/GoogleSignIn.tsx` renders a link and reads an error.

- **A link, not a request:** a plain `<a href="/auth/google/redirect?…">` (via `<Button asChild>`), not a router `<Link>`, since the browser leaves the app.
- **Vite forwards `/auth/`** to Laravel, so the whole journey stays on `localhost:5673`, the address registered with Google and the one the cookies belong to.
- **The link carries** the app's language (for a new account) and `from`, the page `RequireAuth` remembered. Router `state` does not survive a trip to another site, so `from` travels through Laravel's session and Laravel redirects straight to it.
- **Back signed in,** the app boots normally: `GET /api/user` finds the session ([C1.13.1](#c1131-the-one-idea-who-is-signed-in-is-server-data)).
- **Back with an error,** the address is `/login?error=unverified`: `GoogleSignInError` reads it and shows the sentence in a `FormBanner`; unknown codes show the general one.
- **The wait:** `Button`'s `pending` does not work with `asChild` ([C1.20](#c120-showing-that-something-is-loading)), so the component swaps the "G" for a spinner and sets `aria-busy` itself; a `pageshow` listener resets it when Back restores the page from the bfcache.

### C1.13.8 The link to the admin panel

An admin sees an **Administration** group in Profile's About tab with **Open**: the Filament panel served by Laravel ([C2.8.4](C2-backend.md#c284-the-way-in-a-link-and-google-on-the-panels-login)). Its address is `admin_url` of `GET /api/user`, `null` for anyone else; the card renders only when it is set.

- **A plain `<a target="_blank" rel="noopener">`:** the panel is another application.
- **Hiding is not protecting:** `canAccessPanel()` refuses non-admins whatever the app shows.

---

## C1.14 The exercise library screens

[D1.4.3](../design/D1-ui.md#d143-exercise-library)–[D1.4.5](../design/D1-ui.md#d145-exercise-editor), on the API of [C2.5.4](C2-backend.md#c254-the-exercise-librarys-endpoints).

### C1.14.1 The pages and their pieces

| Route | Page | Made of |
|---|---|---|
| `/exercises` | `ExercisesPage` | `ExerciseFilters` (with `ExerciseSearchBox`, shared with the plan editor's picker), `ExerciseListItem`, `EmptyState`; `useExercises()` |
| `/exercises/:id` | `ExerciseDetailPage` | `ExercisePhotos`, `MuscleChips`, a description list, `AlertDialog` for delete; `useExercise()`, `useDeleteExercise()` |
| `/exercises/new`, `/exercises/:id/edit` | `ExerciseEditorPage` | `ExerciseForm` with `exercise-form.ts`; `ExercisePhotoManager` on edit; `useCreateExercise()`, `useUpdateExercise()` |

**Not built yet:** "Add to plan" ([UI-3](../project/backlog.md#ui-3-add-to-plan-from-an-exercises-page)), the "My history" tab ([FEAT-7](../project/backlog.md#feat-7-an-exercises-own-history)), videos ([FEAT-11](../project/backlog.md#feat-11-videos-of-an-exercise)), offline-disabled buttons ([FEAT-3](../project/backlog.md#feat-3-workout-mode-and-home)).

### C1.14.2 A list one page at a time

The API sends 50 exercises per page ([C2.5.2](C2-backend.md#c252-lists-filters-and-pages)). `useExercises()` is a `useInfiniteQuery` whose next page comes from Laravel's pagination `meta`.

- **Show more,** not infinite scroll: the end of the page stays reachable for the keyboard and the tab bar.
- **`placeholderData: keepPreviousData`** keeps the old list on screen while new filters load; the page dims it and shows a spinner in the search box ([C1.20](#c120-showing-that-something-is-loading)), instead of a skeleton per keystroke.
- **The language is in every key** (`['exercises', 'list', 'it', {…}]`), since names arrive translated. `useMuscles()` and `useEquipment()` likewise.
- **Mutations invalidate `['exercises']`**: every list and exercise, in every language.

### C1.14.3 Filters in the address

`/exercises?q=panca&muscle=chest&source=mine`, read and written with `useSearchParams()`: Back restores the list as it was, a reload keeps the filters, a filtered list can be bookmarked.

- **`replace: true`**, or Back would undo the search one letter at a time.
- **A filter at its default is removed**, so the unfiltered list is plain `/exercises`.
- **Muscle and equipment live in a bottom `Sheet`** ([D1.4.3](../design/D1-ui.md#d143-exercise-library)). Its open state is the component's only `useState`; the filters stay in the address and apply at once. **Show exercises** is a `SheetClose`; **Clear filters** empties both. The **Filters** button shows the active count as a badge, and "Filters, 1 active" to screen readers.
- **The controls stick to the top** (`sticky top-0`). From 640 px they fit one 48 px row: search, Filters, source. On phones the source wraps below and only search and Filters stick: the outer row is `max-sm:contents`, which drops its box (so its own `sticky` does nothing) and lets the inner row's `max-sm:sticky` take over. Making the inner row sticky without `contents` would not work, since sticky is bounded by its parent, which scrolls away.
- **The search is debounced:** the box shows every keystroke (its value is in the address), the request uses `useDebouncedValue(search, 300)`. While the two differ the page counts as searching (spinner, rows dimmed), so the pause does not look frozen ([C1.20](#c120-showing-that-something-is-loading)).

### C1.14.4 The editor's form

Form values are shaped for the screen, not for the API:

| On screen | Sent to the API |
|---|---|
| Instructions: one text, a step per line | `instructions`: a list, blank lines dropped |
| Main muscle: a select; secondary muscles: ticks | `muscles`: one list of `{ id, role }`, the main one never repeated as secondary |
| Equipment: a select whose "None" is `''` | `equipment_id`: a number or `null` |
| Empty texts | `null`, which empties the field on the backend |

`toExerciseInput()` and `formValuesFrom()` (`exercise-form.ts`) convert both ways, tested without React.

- **Native selects** (`components/ui/native-select.tsx`): on a phone they open the system picker, and they work with `register()` like an input.
- **The form awaits `mutateAsync`,** so `isSubmitting` covers the request and a 422 reaches `showRequestError`. Field names are the backend's (`equipment_id`, `youtube_url`), so each message lands under its field.
- **Editing waits for the data** before rendering the form: `useForm()` reads `defaultValues` once.

### C1.14.5 Photos

Each photo arrives as two same-origin paths ([C2.5.9](C2-backend.md#c259-the-photos-of-an-exercise)): `url` (≤ 1600 px) for the exercise's page and `thumb_url` (≤ 400 px) for every small square (lists, plans, picker, workout mode, history). A 56 px square drawn from a 1200 px JPEG downloads twenty times what it shows; the imported thumbnails are about 12 KB against 56 KB. Vite (in production, Caddy) forwards `/storage` to Laravel; why paths and not URLs: [C2.5.4](C2-backend.md#c254-the-exercise-librarys-endpoints).

- **In lists** the first photo is the cover: `alt=""` (the name beside it says the same), `loading="lazy"`.
- **On the page** both photos, each with an `alt` such as "Barbell Bench Press, photo 1".

### C1.14.6 Testing it

Beyond [C1.13.6](#c1136-testing-a-screen-with-the-api): `fakeApi` keys with a query string (`'GET /api/exercises?page=2&per_page=50'`) answer one page, the bare path every page, and `fake.mock.calls` tells what was asked. `src/test/exercise-helpers.ts` builds exercises and pages shaped as the API sends them.

### C1.14.7 Uploading photos, and Duplicate as mine

**The photos of a personal exercise** (`ExercisePhotoManager`), under the edit form ([D1.4.5](../design/D1-ui.md#d145-exercise-editor)). A photo is a file on the server, not a field: each change is its own request, apart from the form's Save, followed by `invalidateQueries`, so the list shows what the server has. A new exercise has no id until created, so photos are added from Edit ([UI-8](../project/backlog.md#ui-8-photos-while-creating-an-exercise)).

| Row | What it holds |
|---|---|
| A saved photo | Its thumbnail, **Cover** or "Photo n", **Move earlier**, **Move later**, **Remove** (confirmed) |
| An upload under way | A preview (`URL.createObjectURL`), its name, a `<progress>` bar |
| A failed upload | The reason (the server's own on a 422), **Retry**, **Dismiss** |
| The drop zone | **Add photos**, or files dropped on it; hidden at 5 photos |

- **Limits are checked before sending** (type, 10 MB, room left), then again on the server. `accept` lists JPEG, PNG and WebP, which also makes an iPhone send JPEG rather than HEIC.
- **Files upload sequentially,** not in parallel on a phone connection.
- **The drop zone is a `<label>`** for a hidden file input, so click and drop share one handler; `preventDefault()` on `dragover` and `drop` stops the browser opening the file.
- **Previews are revoked** (`URL.revokeObjectURL()`) when an upload ends or is dismissed, and on unmount.

**Upload progress needs XMLHttpRequest,** since `fetch()` cannot report it. `upload()` in `src/lib/http.ts` repeats what `request()` does: `Accept`, `Accept-Language` and `X-XSRF-TOKEN` (no `Content-Type`: the browser writes it with the multipart boundary), one retry after a 419, an `ApiError` for any failure.

**Duplicate as mine** on a public exercise: `useDuplicateExercise()`, then `/exercises/<copy>/edit`.

**Tests** (`ExercisePhotos.test.tsx`): `fakeUploads()` replaces `XMLHttpRequest` as `fakeApi()` replaces `fetch`, reporting progress then answering; `userEvent.setup({ applyAccept: false })` lets a test pick a HEIC that `accept` would hide.

---

## C1.15 The plan screens

The plan list and a plan's page ([D1.4.6](../design/D1-ui.md#d146-plan-list), [D1.4.7](../design/D1-ui.md#d147-plan-details)), on the API of [C2.5.5](C2-backend.md#c255-the-plans-endpoints). **New plan** and **Edit** open the editor ([C1.16](#c116-the-plan-editor)).

### C1.15.1 The pages and their pieces

| Route | Page | Made of |
|---|---|---|
| `/plans`, `/plans?archived=1` | `PlansPage` | `PlanCard`, `EmptyState`, `ComingSoon`, `ImportPlanButton`; `usePlans()`, `useImportPlan()` |
| `/plans/:id`, `/plans/:id?day=2` | `PlanDetailPage` | `Tabs` (one per day), `PlanDayView` → `PlanItemRow`, delete `AlertDialog`, `ExportPlanButton`; `usePlan()`, `usePlanAction()`, `useDeletePlan()`, `useCurrentUser()` |

```
PlanDetailPage                 header, badges, actions, notes
└── Tabs                       one per day, the open one from ?day=
    └── PlanDayView            "3 exercises · 7 sets", then the runs of groupSupersets()
        ├── PlanItemRow        a lone exercise
        └── <section>          a superset: lime bar, label, a PlanItemRow per exercise
```

Each day has **Start this day** ([C1.17](#c117-workout-mode)). Each card shows "Used 3 days ago" from `last_used_at`: `formatDaysAgo()` counts calendar days in the device's time zone and lets `Intl.RelativeTimeFormat` phrase them ("ieri", "vor 3 Tagen").

**Not built yet:** templates, sharing, duplicating (phase 2).

### C1.15.2 One line per exercise

[D1.4.7](../design/D1-ui.md#d147-plan-details) shows each exercise as one line, "4 × 8–10 · 90 s", warm-ups apart. The API sends sets one by one, so `itemSummary()` (`components/plans/plan-format.ts`) builds the line:

| The sets | The line, in English |
|---|---|
| 2 warm-ups, then 4 × 8–10 at 80 kg, 90 s rest | `4 × 8–10 · 80 kg · 90 sec` and `+ 2 warm-up` |
| 10, 8 and 6 reps at 60, 65, 70 kg (a pyramid) | `3 × 10/8/6 · 60–70 kg · 90 sec` |
| 3 sets to failure, no target, 120 s rest | `3 sets · 2 min` |
| A plank of 60 s (logged by time) | `1 × 1 min · 90 sec` |
| 8–10 at 82.5 kg, RPE 8.5, for a reader in pounds | `1 × 8–10 · 181.88 lb · RPE 8.5 · 90 sec`; in Italian `1 × 8–10 · 181,88 lb · RPE 8,5 · 90 s` |

- **Plain functions** taking `t`; `plan-format.test.ts` covers every row above.
- **Warm-ups never count** in the line or the day's set count ([D2.8](../design/D2-decisions.md#d28-workout-rules)): `workingSets()` drops them.
- **Units from `Intl`:** `formatSeconds()` and `formatDistance()` use `style: 'unit'`, so each language writes its own ("90 s", "90 sec", "90 Sek."). A time target past a minute that is not whole minutes is a clock, "1 × 14:30" (`durationText()`, [C1.17.10](#c11710-times-up-next-how-to-do-it)); rests stay in seconds. Weights go through `weightIn()` (1 lb = 0.45359237 kg) and `formatWeight()`.
- **User settings:** an exercise without its own rest shows `default_rest_seconds`; weights follow `weight_unit`; both from `useCurrentUser()`.
- **Supersets:** `groupSupersets()` splits a day into runs in order: neighbours with the same `superset_group` form one run. The backend guarantees neighbours ([C2.5.6](C2-backend.md#c256-validating-nested-data)), so a run is the whole superset. It renders as `<section aria-label="Superset">`: the label carries what the lime bar shows.

### C1.15.3 Tabs whose state is in the address

The open day is a controlled Radix `Tabs`, kept in `?day=` so that Back from an exercise returns to the same day:

```tsx
const requested = Number(searchParams.get('day') ?? '1')            // ?day=2, from 1
const dayIndex = Number.isInteger(requested) && requested >= 1 && requested <= plan.days.length
  ? requested - 1 : 0                                               // anything else: the first day

<Tabs value={String(dayIndex)} onValueChange={value => setSearchParams({ day: String(Number(value) + 1) }, { replace: true })}>
```

- **The address is not trusted:** `?day=9` on a three-day plan opens the first day rather than a tab bar with nothing selected.
- **On a phone** the tab row scrolls sideways (`overflow-x-auto`), each tab 48 px tall.

### C1.15.4 Actions on a plan

Activate, Archive and Restore are each a `POST` to the plan's address plus a verb, so one hook serves all three: `usePlanAction(plan.id).mutate('activate' | 'archive' | 'unarchive')`.

- **Every plan is refetched afterwards** (`['plans']`): activating one deactivates another, archiving moves it between lists. The page keeps no state of its own to reconcile.
- **Buttons follow the plan's state:** an archived plan offers Restore, not Set as active (`PlanPolicy::activate` refuses it).
- **Delete** is confirmed in an `AlertDialog`; the plan's cached copies are removed and the list opens with `replace: true`, so Back does not return to a deleted plan.
- **A failed action** shows a `role="alert"` banner under the buttons; the plan stays as it was.

### C1.15.5 Testing it

`src/test/plan-helpers.ts` builds API-shaped plans: `testPlan()` has two days, the first with a bench press (two warm-ups, four working sets) and a two-exercise superset. Actions are tested with a fake that remembers ([C1.13.6](#c1136-testing-a-screen-with-the-api)): `activate` flips a variable that the plan's `GET` reads, and the Active badge appearing proves the refetch. `GET /api/user` is in every plan-page table, since the page reads the unit; one test answers `weight_unit: 'lb'`.

### C1.15.6 A plan as a file: export and import

**Export** (`ExportPlanButton`, on a plan's page) and **Import plan** (`ImportPlanButton`, on the list), in `components/plans/`; the file's shape is [D3.5.8](../design/D3-data-model.md#d358-the-plan-file), the endpoints [C2.5.8](C2-backend.md#c258-a-plan-as-a-file).

**Export:** `fetchPlanFile(id)` on tap, no query cache; `downloadJson()` (`lib/download.ts`) saves it through a Blob, an object URL and a generated `<a download="push-pull-legs.atleoplan.json">`; `fileNameOf()` makes the plan's name file-safe.

**Import is a three-step controlled `Dialog`,** so nothing is sent by surprise: what is expected; **Choose the file** (a hidden `<input type="file" accept=".json,application/json">`); the preview and **Import**. Closing it forgets the file.

**A first look in the browser:** `readPlanFile(text, bytes)` (`plan-file.ts`) returns the content and a summary, or a problem:

| Problem | When |
|---|---|
| `tooBig` | Over 1 MB (`MAX_PLAN_FILE_BYTES`), from `file.size`, before reading. The largest valid plan is about a third of that |
| `notJson` | `JSON.parse()` throws |
| `notPlan` | Not an object with `format: "atleoplan.plan"`, version 1, a named plan whose days have item lists |
| `newer` | A version above the one this build reads: "update the app" |

- **Only a first look:** `ImportPlanRequest` checks every field. A 422 says the file "looks like a plan, but holds values that are not valid: it may have been edited by hand"; anything else, "try again".
- **The input is reset** (`event.target.value = ''`) after each choice, so choosing the same file again fires `change`.
- **The new plan's page reports the outcome** from the navigation `state`, as the editor does with `changedElsewhere` ([C1.16.5](#c1165-saving)): "Plan imported. 2 exercises were missing and are now among yours: Frog stand, L-sit." (`plans.import.created_one` / `_other`).
- **The library is refetched** when exercises were created.

**Tests:** `PlanDetailPage.test.tsx` stubs `URL.createObjectURL` and spies on `HTMLAnchorElement.prototype.click`, then checks the link's `download` and the Blob's text; `PlansPage.test.tsx` checks the preview, that nothing is sent before Import, each problem and a 422; `plan-file.test.ts` the summary and problems.

---

## C1.16 The plan editor

[D1.4.8](../design/D1-ui.md#d148-plan-editor), at `/plans/new` and `/plans/:id/edit`, on `POST` and `PUT /api/plans` ([C2.5.5](C2-backend.md#c255-the-plans-endpoints)). A tree of days, exercises and sets, edited in many ways and saved in one request.

### C1.16.1 The pieces

```
PlanEditorPage            /plans/new: an empty draft; /plans/:id/edit: loads the plan, drafts it
└── PlanEditor            the draft (useReducer), persisted; the sticky Save / Discard bar; the step from ?day= (C1.16.7)
    ├── EditorOverview    step 1: name, goal, notes; number of days and their names; confirm before removing
    │                     days with exercises; "Next: the exercises"
    └── EditorDays        step 2: "Back to the plan's details"; the days as tabs
        └── EditorDay     the open tab: drag and drop; "Add exercises" (ExercisePicker); "Make a superset"
            ├── EditorItem    an exercise: drag handle, summary; expanded: "As fast as possible" (C1.17.9), sets, rest,
            │   │             notes, move to another day, leave the superset, remove
            │   └── EditorSet a set: number and type (SetTypeSelect, C1.16.9); targets; RPE when wanted; remove
            └── ExercisePicker the library in a Dialog, tick boxes, "Add (n)"; "Create «…»" (C1.16.8)
```

| File | Holds |
|---|---|
| `components/plans/plan-draft.ts` | Draft types, conversions to and from the API, validation, the reducer; no React |
| `components/plans/draft-storage.ts` | The persisted draft |
| `components/plans/SetTypeSelect.tsx` | Set number and type list, shared with workout mode |
| `api/plans.ts` | `useCreatePlan()`, `useUpdatePlan(id)`, the body type `PlanInput` |

**Not built yet:** the desktop layout with the library beside the plan ([UI-2](../project/backlog.md#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan)); "Add to plan" from an exercise's page ([UI-3](../project/backlog.md#ui-3-add-to-plan-from-an-exercises-page)). On every width, exercises come from the picker.

### C1.16.2 The draft and its reducer

Most changes to a plan are not typing: a set's type changes, an exercise moves day, two exercises join a superset, a drag reorders. So the editor is a `useReducer` over named actions, not a react-hook-form form:

```tsx
dispatch({ type: 'setSetType', day: 0, item: 1, set: 2, setType: 'drop' })
dispatch({ type: 'moveItem', day: 0, from: 3, to: 0 })           // the end of a drag
```

- **Pure,** in `plan-draft.ts`; `plan-draft.test.ts` runs every action ([C1.4](#c14-component-conventions)).
- **Copies first** (`structuredClone()`): the draft as opened stays intact, which makes Discard a `replace` action.
- **Components hold no copy of the plan.** `EditorDay`, `EditorItem`, `EditorSet` receive their slice and `dispatch`, and address actions by index (`{ day, item, set }`).
- **The draft is text, as typed:** `"8-10"`, `"82,5"`, in the user's unit and decimal separator. `toPlanInput()` parses at save: reps into `target_reps_min`/`_max`, pounds into kilograms with three decimals (135 lb → 61.235 kg, [D3.2.3](../design/D3-data-model.md#d323-weights-are-always-in-kilograms)), only the targets that fit the exercise's logging type. `draftFromPlan()` is the inverse.
- **Supersets stay valid by construction.** After every action `normalizeSupersets()` runs on each day: an exercise dragged out leaves its superset, a superset left with one exercise ends, groups are renumbered 1, 2, 3. The backend accepts only neighbours ([C2.5.6](C2-backend.md#c256-validating-nested-data)), and the editor cannot send anything else.
- **New rows get a UUID in the browser** (`newId()`: `crypto.randomUUID()`, or a v4 UUID from `crypto.getRandomValues()` where `randomUUID` is missing, as on plain HTTP outside `localhost`), as [D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id) requires; saved rows keep theirs, so workouts stay linked.

### C1.16.3 Drag and drop with dnd-kit

A day's exercises are reordered by dragging a handle (`@dnd-kit/core`, `sortable`, `utilities`, `modifiers`; [D2.2](../design/D2-decisions.md#d22-stack)): `closestCenter`, `restrictToVerticalAxis`, `verticalListSortingStrategy`.

- **Only the handle gets `listeners`,** so the row stays tappable and the page scrolls with a finger; `touch-none` on the handle stops scrolling during a drag.
- **Sensors:** `PointerSensor` with a 5 px activation distance (a tap is not a drag), and `KeyboardSensor`.
- **The draft changes once,** on `onDragEnd`, with one `moveItem`; during the drag dnd-kit only applies a CSS transform.
- **Screen-reader announcements** are translated through `accessibility.announcements` and `screenReaderInstructions`; dnd-kit's defaults are English.
- **Moving to another day** is a list inside the expanded exercise: one tap, keyboard-friendly. Days are not reordered on screen; the reducer has a tested `moveDay` that no control dispatches.

### C1.16.4 The draft kept in the browser

D1.4.8 asks for auto-saved drafts. After every change an effect writes the draft to `localStorage` under `atleoplan.planDraft.<plan id>` (`…new` for a new plan).

- **Reopening the editor** restores the draft with a banner; **Discard changes** and a successful save forget it.
- **`dirty`** compares the two trees serialised with `JSON.stringify`.
- **`localStorage`, not IndexedDB** ([D3.5.6](../design/D3-data-model.md#d356-saving-a-plan)): a draft is a few kilobytes; IndexedDB comes with the offline work, which needs it for much more.
- **Every access is in `try`/`catch`:** a private window or full storage throws, and the editor must still work without persistence.
- **A draft is per browser, not per account.** A saved plan follows the user; a draft does not.

### C1.16.5 Saving

**Save** runs:

1. **`validateDraft()`**: the backend's rules ([C2.5.6](C2-backend.md#c256-validating-nested-data)) in the browser (a name, reps as `8` or `8-10` within 1–999, RPE 1–10 with one decimal, rest up to an hour…). It returns a translation key per field path in the draft (`days.0.items.1.sets.2.reps`). With any error nothing is sent: fields turn red, a banner appears, and the step holding the first error opens (C1.16.7).
2. **`toPlanInput()`** builds the body; `useCreatePlan()` sends `POST`, `useUpdatePlan(id)` sends `PUT` with the `version` the editor started from.
3. **A 422** carries Laravel's field names: `draftField()` maps `days.0.items.1.sets.2.target_reps_max` to `days.0.items.1.sets.2.reps` (same indexes, since order is position), and the message lands under that field.
4. **Success** forgets the draft and opens the plan's page with `replace: true` (from the second step, after one step back first, C1.16.7). On a `PUT`, `meta.changed_elsewhere` travels in the navigation `state` (`{ changedElsewhere: true }`), and the plan's page shows "This plan was changed somewhere else in the meantime. Your version was saved over it." ([D3.5.7](../design/D3-data-model.md#d357-when-a-plan-is-changed-in-two-places)). The state belongs to that history entry, so a reload does not repeat the warning.

**One Save button,** in a bar that sticks to the top (`sticky top-0`) while a long plan scrolls.

### C1.16.6 Testing it

- **The reducer** (`plan-draft.test.ts`): `run(draft, action1, action2…)` applies actions in turn.
- **The page** (`PlanEditorPage.test.tsx`) types, opens the picker (`findByRole('dialog', { name: 'Add exercises' })`), ticks, changes set types, saves; `sentBody(fake, '/api/plans')` is compared with what the backend expects.
- **Persistence:** render, type, `unmount()`, render again, find the change and the banner.
- **History:** `await act(() => router.navigate(-1))` stands in for the phone's Back; `router.state.location.search` tells which step and tab are open.
- **Dragging** is not tested in jsdom (no layout); `moveItem` is tested in the reducer.

### C1.16.7 Two steps, one draft

Two steps over the same draft ([D1.4.8](../design/D1-ui.md#d148-plan-editor)), so a phone shows one level at a time: details with the number and names of days (`EditorOverview`), then the days as tabs with their exercises (`EditorDays`).

**The step is in the address:** no `?day=` is step one, `?day=2` is step two on the second day's tab.

```tsx
const requested = Number(searchParams.get('day'))
const openDay = searchParams.has('day') && Number.isInteger(requested) && requested >= 1 && requested <= draft.days.length ? requested - 1 : null
```

- **Steps are not routes.** `PlanEditor` stays mounted, so the draft, errors and an in-flight save survive the switch.
- **The address is not trusted:** `?day=9`, or a day removed by Discard, shows step one.
- **Each step starts at the top:** every `?day=` change is a history entry, and `<ScrollRestoration />` in `AppLayout` scrolls it.

**The number of days** is a native select, 1–14 (`LIMITS.days`, the backend's limit). More dispatches `addDay` per new day, named with the next letters (`dayLetter()`: "Day C"); fewer dispatches `removeDay` from the last down, so each index still names the day it meant. When a day to remove has exercises, the change waits in `pendingCount` and an `AlertDialog` controlled by it (`open={pendingCount !== null}`) asks first. Removing only from the end keeps the control simple; the cost is that a middle day cannot be removed and days cannot be reordered.

**Back always returns to the details**, whichever Back (phone, mouse, browser):

| Action | History (newest last) | How |
|---|---|---|
| Open the editor | … · details | |
| **Next: the exercises** | … · details · Day A | `setSearchParams({ day: '1' }, { state: { fromPlan: true } })`: a new entry |
| Tab Day B | … · details · Day B | same, with `replace: true` |
| Back, or **Back to the plan's details** | … · details | `navigate(-1)`, since `state.fromPlan` says the entry before is the details |

Step two reached another way (reload, a link to `?day=2`) has no `state`; **Back to the plan's details** then replaces the entry (`setSearchParams({}, { replace: true })`) instead of leaving the editor.

**Saving from step two.** The plan's page replaces the editor's entry so Back does not reopen the editor, but step two owns two entries. The editor first steps back, then replaces step one's entry:

```tsx
if (openDay !== null && fromPlan) await navigate(-1)
onSaved(saved)   // navigate(`/plans/${id}`, { replace: true, … })
```

`await` matters: with `createBrowserRouter`, `navigate(-1)` resolves once the browser has gone back. Without it the replace lands on step two's entry first, and the back then reopens the editor.

**One lime button at a time** ([D1.5](../design/D1-ui.md#d15-design-system)): in step one the way on is **Next: the exercises**, so Save is outlined there and lime in step two.

**Errors go to their step** (`showErrors`): a path matching `/^days\.(\d+)\.items\./` belongs to step two, anything else (the name, a day's name) to step one, which wins when both have errors. In step two a red dot marks every tab whose exercises have one.

### C1.16.8 Creating an exercise from the picker

A plan copied from paper meets exercises the library lacks or names differently. After a search, the picker always offers **Create «…»** below the results (the "ponte" of a plan may be the full bridge, while the library finds glute bridges). It opens the exercise form inside the same dialog with the search as the name; the exercise is created as the user's own (`useCreateExercise()`) and added with the ones already ticked, closing the dialog as Add does. When swapping in workout mode, it is the chosen exercise.

```tsx
<ExerciseForm
  defaultValues={emptyFormValues(typed)}
  save={create.mutateAsync}
  onSaved={exercise => onAdd(replacing ? [exercise] : [...chosen, exercise])}
  submitLabel={t('exercises.editor.create')}
  onCancel={() => onCreatingChange(false)}
/>
```

- **One form for page and dialog** (`ExerciseForm`, [C1.14.4](#c1144-the-editors-form)): Cancel is a link on a page (`cancelTo`) and a callback in the dialog (`onCancel`), which returns to the search with its ticks intact.
- **"Creating" state lives in `ExercisePicker`,** since the dialog's title changes too; closing resets it.
- **The library is refetched** after creation, so the exercise appears in the next search.

**Container queries.** The form lives on a full page and in a 512 px dialog, so its grid follows the form's width: the form is `@container`, its three selects `@xl:grid-cols-3`. A viewport breakpoint would squeeze them in the dialog on a laptop.

### C1.16.9 Set types and the RPE field

The letters W, D, F mean nothing to someone who does not know them, and an RPE field takes a third of every row for a number most people never set.

**The type, from a list.** The set's number opens `SetTypeSelect` (`components/plans/SetTypeSelect.tsx`), shared by the editor and workout mode: each type with its letter, name and a one-line explanation ("Warm-up: light, before the working sets; not counted").

```tsx
<Select value={value} onValueChange={type => onChange(type as SetType)}>
  <SelectPrimitive.Trigger asChild>
    <Button variant={variant} size="icon-xl" aria-label={label}>{SET_TYPE_SIGNS[value] ?? number}</Button>
  </SelectPrimitive.Trigger>
  <SelectContent position="popper" align="start">…</SelectContent>
</Select>
```

- **Profile's Select** (`components/ui/select.tsx`) **with its own trigger:** shadcn's `SelectTrigger` is a bordered field with a chevron, too wide for a 48 px square. `SelectPrimitive.Trigger asChild` passes the handlers, `role="combobox"` and `aria-expanded` to our `Button`.
- **`position="popper"`** opens the list below the button; the default (item-aligned) would cover the row.
- **In tests** the button is a combobox (`'Set 1, normal: change the type'`) and each type an option whose name includes its hint.

**RPE is a preference.** `users.show_rpe` ([D3.3](../design/D3-data-model.md#d33-users-and-preferences)), off by default, is passed down from `PlanEditor` like the unit. `EditorItem` adds one rule:

```tsx
const [hadRpe] = useState(() => item.sets.some(set => set.rpe !== ''))
const withRpe = showRpe || hadRpe
```

- **An existing RPE is always shown,** or the plan would be saved with a value nobody sees.
- **Read once on mount:** recomputed on every render, the field would vanish under the finger as its last value is erased.
- **The plan's page** always writes "RPE 8" when a target has one; only the editor's field depends on the preference.

---

## C1.17 Workout mode

[D1.4.9](../design/D1-ui.md#d149-workout-mode): **Start** on a plan's day opens `/session/:id`, a full screen where the user ticks sets with a rest timer between them; **Finish** sends the workout to `PUT /api/sessions/{id}` ([C2.5.7](C2-backend.md#c257-the-workouts-endpoints)). It runs in a gym with sweaty hands and a bad connection, so two rules come first: **nothing is ever lost**, and **one tap per set**.

### C1.17.1 The pieces

```
PlanDetailPage, HomePage  Start (useStartWorkout); "Workout in progress: <day>" with Resume (ResumeBanner)
└── navigate('/session/:id')
WorkoutPage              /session/:id: loads the workout from the phone; none → a message
└── WorkoutScreen        the workout (useReducer); top: ✕, day, clock, Finish; the dots and "＋ Add exercises";
    │                    one screen per run (an exercise, or a superset's all); Previous / Next (or Finish
    │                    workout); persists every change; Wake Lock
    ├── ExerciseBlock    an exercise on its own: its header, its sets, Add set
    │   ├── ExerciseHeader photo, name, plan's line, notes; skipped box
    │   │   └── ExerciseMenu "⋯": swap, skip, note, video; remove if added (bottom sheet, C1.17.7)
    │   ├── SetHeader    column titles: Set, Last, kg, Reps (or Time, m)
    │   └── SetRow       number or type letter (SetTypeSelect), last time, fields (buttons); ▶ on timed sets; ✓
    ├── SupersetRounds   a superset: its exercises' ExerciseHeaders (one line that opens on a phone, from three),
    │                    the round in progress open (each exercise's name and SetRow with units, "Then rest 90 s"),
    │                    the other rounds one line each, merged from two (superset-rounds.ts); Add round
    ├── ExerciseInfoSheet "How to do it" (bottom sheet, C1.17.10)
    ├── UpNextCard       a reminder of the next exercise, not a button (C1.17.10)
    ├── StopwatchPanel   timed sets, docked at the bottom (C1.17.8)
    ├── SetStepper       the big stepper for the tapped set (bottom sheet, C1.17.7)
    ├── ExercisePicker   Add exercises; Swap exercise
    └── RestBar          time left, shrinking bar, −15, +15, Skip; "Up next: …"
```

| File | Holds |
|---|---|
| `components/workout/workout-session.ts` | Types, `startSession()`, `startFreeSession()`, `exerciseFrom()`, `swappedExercise()`, readers (clock, rest left, can a set be ticked, what comes next), the reducer, `toSessionInput()`; no React |
| `components/workout/session-storage.ts` | The workout in progress, the queue, the finished workout, in `localStorage` |
| `components/workout/finish-workout.ts`, `FinishButton.tsx` | Finishing, and its confirmation: shared by workout mode and `ResumeBanner` |
| `components/workout/set-fields.ts` | `fieldsFor()`: a set's fields by logging type, shared by rows, header and stepper |
| `components/workout/stepper.ts` | The stepper's arithmetic (C1.17.7) |
| `components/workout/clock.ts`, `set-text.ts` | `clock(245)` is `"4:05"`; `loggedSetText()` writes a set as "80×8" |
| `components/workout/layout.ts` | `WORKOUT_COLUMN`, the side margins every part shares |
| `components/workout/useStartWorkout.ts`, `ResumeBanner.tsx` | Starting and resuming, shared with Home ([C1.18](#c118-home)) |
| `components/workout/usePrepareWorkouts.ts` | Online, reads ahead what Start needs offline: the plan and each day's last sets |
| `lib/pending-sessions.ts`, `lib/usePendingSessions.ts` | Sending the queue; the hook that sends it on start-up and on `online` |
| `lib/useNow.ts`, `lib/useWakeLock.ts`, `lib/alarm.ts` | The current moment at an interval; the screen kept on; beep and vibration |

**Full screen, app-like.** `session/:id` sits inside `RequireAuth` beside `AppLayout` ([C1.5](#c15-routing)). The screen is an `h-dvh` column (the height the browser really shows, toolbars excluded): the bars stay put and only the middle scrolls, so ✕, Finish, the rest timer and Next are always in reach; `env(safe-area-inset-top)` clears the notch. Every part uses `WORKOUT_COLUMN`, the app's page margins (`px-5 sm:px-8 lg:px-12`) at full width. Buttons follow [D1.5](../design/D1-ui.md#d15-design-system): 48 px (`xl`), lime only for Finish workout, outlined for the rest, plain for icons. The middle is `relative` so the absolutely positioned `sr-only` "Rest over" text stays inside it instead of stretching the page.

**Not built yet:** live records ([FEAT-5](../project/backlog.md#feat-5-new-records-during-a-workout)), a notification when the rest ends in the background, and the offline app ([FEAT-3](../project/backlog.md#feat-3-workout-mode-and-home)). The summary after Finish: [C1.19](#c119-the-summary-and-history).

### C1.17.2 Starting: the plan becomes a workout

**Start** calls `startDay(plan, day)` of `useStartWorkout` ([C1.18.2](#c1182-starting-from-home-one-hook-for-two-pages)):

1. **Reads last time's sets** of the day's exercises (`GET /api/sessions/last-sets?exercises=7,12,40`, `lastSetsQuery()`, the ids sorted so that a day always has the same key). Online from the server, with no retries, since a workout may have been done on another device; offline, or when the request fails, from the copy read ahead by `usePrepareWorkouts()`; with neither, none, and the workout starts with an empty Last column. Each exercise keeps the whole list (`previous`) for the summary's comparison, with no further request ([C1.19.3](#c1193-better-than-last-time-exercise-by-exercise)).
2. **Builds the workout** with `startSession(plan, day, options)`: one exercise per item, one set per planned set. Fields are pre-filled with **last time's values for the set in the same position**, else the **plan's target** (the lower end of `8-10`), so a set done as planned or as last time is one tap on ✓. Weights are written in the user's unit and locale.
3. **Assigns UUIDs** in the browser ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)); the backend keeps them, which makes resending harmless (C1.17.5).
4. **Persists it** and opens `/session/<id>`.

Nothing reaches the backend until Finish. Start is disabled while another workout is in progress and on a day with no exercises.

### C1.17.3 The workout and its reducer

The workout is one object, `ActiveSession`, changed only by `workoutReducer` actions, like the editor's draft ([C1.16.2](#c1162-the-draft-and-its-reducer)): pure, `structuredClone()` first, tested alone (`workout-session.test.ts`).

```tsx
dispatch({ type: 'toggleSet', exercise: 0, set: 2, now: new Date().toISOString() })
dispatch({ type: 'adjustRest', seconds: 15 })
```

- **Moments are ISO 8601 strings,** since the workout round-trips through JSON.
- **"Now" is a parameter** of actions and readers (`elapsedSeconds(session, now)`), so tests choose the moment.
- **The clock excludes pauses:** `elapsed = accumulated_seconds + (now − running_since)`, with `running_since` null while paused. ✕ dispatches `pause`; reopening, `resume`.
- **Values are text, as typed.** ✓ is enabled only when the fields of the exercise's logging type parse as numbers (`canComplete()`), so the backend never receives a set it would refuse.
- **The weight may stay empty:** on a weighted exercise, a set with the body alone; on a bodyweight one (pull-ups, `reps`), the column is **+kg**, the added weight. `toSessionInput()` sends `null` when empty ([D3.6.3](../design/D3-data-model.md#d363-logged_sets)).
- **One screen per run.** `stations(session)` splits the workout into runs, an exercise alone or a whole superset (`supersetOf()`, neighbours with the same `superset_group`), as `groupSupersets()` does for the plan's page. `current` stays an exercise's index, so stored workouts read the same; the screen shows its run. The dots, "Exercise 2 of 4", Previous and Next count runs, and go to a run's first exercise. A superset is `SupersetRounds`, a `<section>` named "Superset: A + B" with the plan's lime bar, **read by round** as it is done (hang → pull-ups → rest, three times). A round holds the sets at the same position of each exercise; one with fewer sets drops out of the last rounds. **What is not needed now is a line that opens**, so six rounds of four exercises fit a phone:
  - **Rounds.** `roundBlocks()` (`superset-rounds.ts`, tested on its own) decides what shows: the round of the set marked next is open, always on its own, a `<section>` named "Round 2", holding each exercise's set in a `role="group"` named by the exercise (which keeps a round's two "Tick: Set 1" apart for screen readers and tests), then "Then rest 90 s", the rest of the round's last exercise. The other rounds are buttons, "Round 1, done: 30 s · 5" (`aria-expanded="false"`), their text from `workoutSetText()` (`set-text.ts`, the in-progress sibling of `loggedSetText()`); `MERGE_ROUNDS_FROM` (2) or more closed rounds in a row of the same state merge, "Rounds 1–3". A tap adds the line's span to `opened`, local state, with its state then (`done`); a round whose state has changed since leaves it, so rounds unticked one by one fall back to lines "to do" and merge, and a round to do opened ahead closes once done: one round opens as its card, a merged span as one compact block (`kind: 'span'`) with every round's rows, each group named "Round 2: Pullups", and no rests between them. Lines and title bars are full-width buttons with a chevron (`aria-expanded`); a title bar closes what it heads (`closeRounds()`). The round in progress closes too: `currentClosed` holds its index, and `roundBlocks()` then shows it as a line of its own (`current: true`, never merged, outlined in lime). No reset is needed: when the round ends, the next set's round is not the one closed, so it opens.
  - **Headers.** From `GROUP_HEADERS_FROM` (3) exercises, a phone shows a button, "3 exercises" with the names and overlapping photos, that toggles the headers' list (`aria-expanded`, `aria-controls`); the list is one element whose `max-sm:hidden` comes and goes, so nothing is drawn twice. From the tablet up the headers sit side by side, up to four a row.
  - **Rows.** No `SetHeader` per exercise: `SetRow`'s `units` writes each value with its unit (`FieldSpec.suffix`: "5 reps", "+10 kg", an empty field showing "+kg"), and titles the Last column in place, shown from `sm` up.
  - **Add round** dispatches `addSet` for each exercise. The component is keyed by the superset's first exercise, so rounds and headers opened by a tap do not carry over to the next superset.
  Each exercise's table one under the other read as "all of A, then all of B". The stepper, How to do it and Swap stay one panel each on the screen, told which exercise opened them.
- **Ticking a set never moves the screen.** The ticked set stays in sight; jumping on ✓ would take it out of view and change the bar under the thumb. What depends on the exercise is the rest, and, in a superset, the set marked next:

| The set's exercise is | ✓ does | Marked next |
|---|---|---|
| on its own | starts its rest | nothing |
| in a superset, another exercise of the round with a set left | no rest | that exercise's set, scrolled into view |
| in a superset, the round's last | starts the rest | the next round's first set |

  `supersetNext(session, index)` is the next exercise of the round with work left, or `null` at the round's end, which is how the reducer decides whether the round is over. `nextInRound(session, run)` is the set marked: round by round, the first unticked set of each exercise in turn (A 1, B 1, A 2…), passed to `SetRow` as `upcoming` (a faint ring, `aria-current="step"`), its round outlined, and scrolled to by an effect when it changes on the same screen. Exercises with nothing left, or skipped, have no turn, since supersets often pair different set counts. A rest of 0 starts no timer.
- **Set numbers** come from `setNumbers()`: warm-ups are counted apart, so working sets are 1, 2, 3 after any warm-ups (`W W 1 2 3`). Screen readers hear the same names ("Set 1, kg: 80", "Tick: Set 1").
- **Header and rows align** because both build their fields with `fieldsFor()` and share widths (`w-12`, `w-16`, `flex-1`, `w-12`).
- **Added exercises.** **Add exercises** opens `ExercisePicker`; each pick is built by `exerciseFrom()` (one set per set of last time, or one empty set; the default rest; no plan item) outside the reducer, because it makes UUIDs, then dispatched as `{ type: 'addExercises', exercises }`.
- **A free workout** (`startFreeSession(now)`, from Home) has no plan, day or exercises. Until the first exercise is added it shows only **Add exercises** and **Cancel workout**, which discards it.
- **At Finish,** `toSessionInput()` sends every exercise with **only its ticked sets**, only the values its logging type uses, weights in kilograms. An exercise with none ticked is sent empty, as skipped; the menu's note goes as `notes`.

### C1.17.4 The rest timer: a moment, not a countdown

A countdown that decrements every second drifts, and stops when the phone sleeps or the tab is throttled. The rest is stored as **the moment it ends**, `rest.ends_at`, and the screen shows the difference:

```tsx
const now = useNow(1000)                  // re-renders every second
const left = restLeft(session, now)       // ends_at − now, whole seconds, never below 0
```

- **A phone that slept** shows the right time as soon as it wakes.
- **±15 s** moves `ends_at` and the bar's total; **Skip** dispatches `endRest`.
- **The end** is a `setTimeout` for that moment, in an effect keyed on `session.rest`:

```tsx
useEffect(() => {
  if (session.rest === null) return
  const delay = Math.max(0, Date.parse(session.rest.ends_at) - Date.now())
  const timer = setTimeout(() => {
    restOver({ sound, vibration })
    setAnnounce(t('workout.restOver'))     // read out by screen readers
    dispatch({ type: 'endRest' })
  }, delay)
  return () => clearTimeout(timer)
}, [session.rest, t, user])
```

  A new rest or ±15 s is a new `session.rest` object, so the old timer is cleared. Checking `left === 0` on each tick instead would set state synchronously in an effect.
- **The beep** is synthesised with Web Audio (`lib/alarm.ts`: 880 Hz, twice, faded to avoid a click), so there is no file to download. **Vibration** is `navigator.vibrate([200, 100, 200])`, ignored by iPhones. Both follow `timer_sound` and `timer_vibration`.
- **The screen stays on** (`useWakeLock`). The browser drops the lock when the page is hidden, so the hook re-requests it on `visibilitychange`.

### C1.17.5 The queue of workouts to send

`session-storage.ts` keeps three `localStorage` keys:

| Key | Holds | Written |
|---|---|---|
| `atleoplan.activeSession` | the workout in progress (one at a time) | after every action; removed at Finish |
| `atleoplan.pendingSessions` | finished workouts not yet on the server, id → body | at Finish; an entry leaves when the server has it |
| `atleoplan.finishedSession` | the workout just finished, its body and the send outcome | at Finish; removed by the summary's Save or Delete |

**Two Finish buttons** open the same confirmation (`FinishButton`), and only one is lime at a time: **Finish** at the top, outlined, to stop early; **Finish workout** in place of Next when it is time (on the last screen, or once every set is ticked). At 360 px it spans the bar and Previous shrinks to its arrow (`flex-1 sm:flex-none`, `max-sm:sr-only`).

The confirmation counts working sets (`countSets()`): "3 of 7 sets done, warm-ups excluded. The 4 sets not ticked will not be saved." **Finish and save** (`WorkoutScreen.finish()`) then:

1. dispatches `finish`: the clock stops, `finished_at` is set;
2. **queues the body first,** then clears the workout in progress: whatever happens next, the workout is on the phone;
3. `sendPendingSessions()` tries every queued workout with `PUT /api/sessions/{id}`;
4. stores the finished copy with its outcome, `saved`, `queued` or `refused` (`storeFinished()`), marks the workout lists and Home stale, and opens `/session/:id/summary` ([C1.19](#c119-the-summary-and-history)).

| Answer | Meaning | In the queue |
|---|---|---|
| 2xx | saved (201 first time, 200 after) | leaves |
| 410 Gone | deleted elsewhere meanwhile ([C2.5.7](C2-backend.md#c257-the-workouts-endpoints)) | leaves: resending will never work |
| none (offline), 5xx | network or server down | stays, retried later |
| other 4xx (403, 422) | refused | stays, so nothing is lost, and is reported by `SyncIndicator` |
| none within 30 s | a request hanging on a weak network | stays, retried later |

**A time limit per workout** (`AbortSignal.timeout`, CSRF cookie included): a request can hang for minutes on a weak network, and the round, with the indicator's spinner and its locked button, would wait as long.

**Resending is harmless.** The request is a `PUT` to the workout's own UUID: the first creates, the next replace with the same content. A request whose answer was lost is sent again, and the server never holds two copies. This is why ids are made on the device.

**When it retries:** `usePendingSessions(enabled)`, in `RequireAuth`, sends the queue when the signed-in app starts and on the `online` event; a round that sent something invalidates the cached lists. This is the part of offline sync ([D2.7](../design/D2-decisions.md#d27-offline-and-sync)) a workout needs; IndexedDB and background sync come with FEAT-3; the service worker that opens the app with no network is in [C1.21](#c121-opening-with-no-network).

**What the user sees: `SyncIndicator`** ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)), in `AppLayout` and `SideNav`. `useSyncState()` follows three things with `useSyncExternalStore`: the network (`onlineManager`), the queue (`subscribeToPending()`, called after every change here and on the `storage` event from another tab; `pendingSnapshot()` keeps the same object until the list changes), and the rounds of sending (`subscribeToSendProgress()`: whether one runs, what the last refused). `syncState()` picks one: offline first, since nothing can be done until the network returns; then refusals, which need a person; then what waits. Refusals live in memory only: every round goes over the whole queue, so the first one after the app opens finds them again. **Send** and **Try again** go through `useSendPending()`, the same round as the `online` event's. **One round at a time:** a round asked for while another runs starts after it and finds only what the first left, so two triggers at once (the server's return and the sign-in) never send a workout twice.

**A server that does not answer** looks like being online to the browser. `request()` (`lib/http.ts`) marks the server unreachable on no answer, a time limit, or a proxy's 502, 503 or 504, and reachable again on any other answer (`isServerReachable()`, `subscribeToServer()`). `syncState()` puts it right after offline, as `unreachable`, and `ConnectionBanner`, above every page in `AppLayout`, says what happens to the workouts meanwhile. Nothing would notice the server's return, since the browser fires no `online` event: `useServerWatch()`, in `RequireAuth`, asks `GET /api/health` every 10 seconds (`SERVER_CHECK_INTERVAL_MS`) while it is away and the network is there, and when it answers again sends the queue and marks every query stale. With the server there but the queue still waiting (a round that met a 500), `usePendingSessions` tries it again every 30 seconds (`QUEUE_RETRY_INTERVAL_MS`); not while the state is `refused`, since a 4xx would fail the same way.

**The indicator's window** is one `Dialog` for `offline`, `unreachable` and `pending`, so it stays open while the state moves between them; it lists `syncState()`'s `queued`, oldest first, and offers **Check again now** (`/api/health`) or **Send now**. A try that changes nothing (the server still unreachable, the queue still full) sets `failedTry`, shown as an error line with the try's time; it is forgotten when the window closes.

**Sending, then done.** Rounds started through `useSendPending()` (the opening, the `online` event, the server's return, the indicator's taps) are announced: `sendPendingSessions({ announce: true })` keeps in the progress whether one is running (`announcing`) and the last one's result, numbered (`announced`). `ConnectionBanner` shows "Sending…" while one runs with workouts waiting, then, for a round that ends while the page is open and saved something, "Sync done: N saved" for six seconds. Finish and the summary's Save call `sendPendingSessions()` plainly: their page says the outcome.

**Resuming.** ✕ pauses, persists and opens the plan's page (Home for a free workout), where `ResumeBanner` shows "Workout in progress: Day A – Push" with **Resume**; Home shows it too. A reload, a closed tab or a flat battery lead to the same place; the clock resumes only when the workout is reopened.

### C1.17.6 Testing it

- **The reducer** (`workout-session.test.ts`) uses the editor's `run()` helper; `at(60)` is the start plus 60 s, so "tick at 60, 50 s of rest left at 100" is exact.
- **The page** (`WorkoutPage.test.tsx`) stores a workout built by `startSession()`, renders `/session/<id>`, ticks, reads the timer by role (`timer`), reads storage back with `loadActiveSession()`, and finishes against a fake answering 201, or `'network'` to check the workout stays queued.
- **The queue** (`pending-sessions.test.ts`): five workouts answered 201, 410, `'network'`, 503 and 422; checks which leave.

### C1.17.7 The big stepper and the exercise's menu

Two bottom sheets ([D1.4.9](../design/D1-ui.md#d149-workout-mode)), shadcn's `Sheet` with `side="bottom"`: controls where the thumb is, focus trapped and returned.

**The stepper.** A set's fields are buttons styled as inputs (`SetRow`); a tap opens `SetStepper` on that set: each field between a − and a + 64 px wide, labelled with the step (`−2,5`, `+1`). The box between them still accepts typing for a distant value; the phone keyboard is slow with sweaty hands.

| Field | Step | Below zero |
|---|---|---|
| weight (kg or lb) | the user's `weight_step` | 0 becomes empty: body alone |
| reps | 1 | stays 0 |
| seconds | 5 | stays 0 |
| meters | 10 | stays 0 |

- **Values stay text.** `stepValue(text, field, delta, language)` (`stepper.ts`) parses, adds and writes back in the user's locale (`82,5` + 2,5 = `85`), so typing and tapping mix. Empty or unreadable starts from 0. Reps, seconds and meters round to integers (the backend accepts nothing else); the weight keeps at most two decimals via `formatNumber()`, which also hides float noise (`0.1 + 0.2`).
- **Each tap dispatches `setField` at once**, as typing does: no Cancel; **Done** only closes.
- **`stepping = { set, field }` is kept apart from `stepperOpen`,** so the closing animation still shows the right set.
- **Focus** goes to the tapped field's +, not Radix's default first button: `onOpenAutoFocus` is prevented and callback refs keep each + in a ref object.

**The exercise's menu** (`ExerciseMenu`, "⋯" beside the name): 48 px full-width rows rather than a small dropdown, easy to hit mid-set.

| Row | Does | Reducer action |
|---|---|---|
| **Swap exercise** | Opens the picker in swap mode; one tap replaces this exercise. Disabled once a set is ticked, with the reason: a ticked set belongs to the exercise it was done with | `swapExercise`, with `swappedExercise()` |
| **Skip exercise** / **Do it after all** | Marks it skipped and opens the next exercise; or undoes the skip | `skipExercise` |
| **Add a note** / **Edit the note** | The sheet becomes a text box (500 characters, the backend's limit); shown under the name, sent as `notes` | `setNote` |
| **Watch the video** | Only with a `youtube_url`; new tab, `rel="noreferrer"` | none |
| **Remove from workout** | Only on an exercise added by hand; confirmed (C1.17.11) | `removeExercise` |

- **Swap keeps the place, not the values.** `swappedExercise()` keeps the id, plan item, superset, rest and set count and types; values and "Last" come from the new exercise's own last time (none offline). With no last time the plan's reps fill the sets but **not the plan's weight**: 80 kg was meant for the barbell, not dumbbells. Built outside the reducer (it makes UUIDs). Note and skip stay with the old exercise.
- **The swap picker** is `ExercisePicker` with `replacing`: no ticks, one tap picks; the list starts filtered by the replaced exercise's first main muscle with an **Only Chest** chip (`aria-pressed`) to toggle it; the replaced exercise is excluded. Opened from the menu, so controlled ([C1.4](#c14-component-conventions)).
- **Skipping** sets `skipped: true`, which changes "work left" in one function, `hasWorkLeft(item)` (an unticked set on a non-skipped exercise). `supersetNext`, `nextInRound`, `allSetsDone`, the dots and `countSets` all read it. On screen: sets dimmed, a "Skipped" box with **Do it after all**, a greyer dot once the whole screen is skipped. Ticking one of its sets undoes the skip. Skipping opens the next screen once nothing on this one is left, so a superset partner with sets keeps it: the rule that the screen never moves *after a tick* still holds.
- **`notes` and `skipped` are optional,** for workouts stored by older builds ([C1.12](#c112-typescript-conventions)).

### C1.17.8 The stopwatch of a timed set

A set of an exercise logged by time has **▶** before ✓, which opens `StopwatchPanel` **docked at the bottom**, where the rest bar goes: first a countdown, then the time in large type, a bar, the target and **Last time**, **Pause**, **Stop**, **Cancel**. The table stays visible above, the timed set ringed in lime. A full-screen stopwatch would hide the table, the plan's notes and what comes next for the whole set.

**A moment, like the rest** (C1.17.4):

```ts
session.stopwatch = { set_id: '0192…', started_at: '2026-11-10T18:05:17.000Z', target: 30 }   // ▶ at 18:05:12, a 5 s countdown
countdownLeft(stopwatch, now)      // started_at − now, in whole seconds rounded up; 0 once counting
stopwatchSeconds(stopwatch, now)   // (now or paused_at) − started_at − paused_ms, in whole seconds; 0 during the countdown
```

- **Persisted with the workout,** so screen-off, app restart or reload lose nothing, the countdown included.
- **The countdown is a start in the future:** ▶ stores `started_at` the user's `countdown_seconds` ahead (`FALLBACK_COUNTDOWN_SECONDS`, 5, until the account is read; 0 starts at once), time to put the phone down and get into position. The screen passes it in the action, so the reducer reads no account. No extra field: the count simply has not begun. **Start now** (`skipCountdown`) moves the start to the moment of the tap.
- **The set by id,** not by index: exercises can be added meanwhile, and `findSet(session, id)` locates it.
- **The target** is the set's `seconds` when ▶ is tapped (the plan's target or last time's): where a hold ends, a time to beat for reps done as fast as possible (C1.17.9). Empty, there is none, and a hold counts up until Stop.
- **A hold stops at its target** and writes it: `stopStopwatch` caps a hold's seconds at the target (`isForTime()` false), so a stop that comes late (a timer fired with the screen off, the app reopened after it) still writes 30, not 34. A race is never capped: past the time to beat is the result.
- **Starting ends the rest,** if one was running.
- **Pausing stores `paused_at`;** Resume adds the pause to `paused_ms` and clears it. A second Pause is ignored (moving `paused_at` would lose the seconds between), and so is a Pause during the countdown, which counts nothing. Stop while paused writes the time at the pause.
- **One stopwatch at a time:** while one runs, every other ▶ is disabled (`SetRow`'s `stopwatch`: `'this'` or `'other'`).
- **✓ on the set being timed is Stop:** `toggleSet` hands over to `stopStopwatch`, so the time written is the one measured, not the one pre-filled from the plan or last time. That ✓ stays enabled while its seconds are empty, since the stopwatch fills them. During the countdown nothing was measured: the stopwatch goes and the set is ticked with its own field, as ✓ alone would.

| Action | Does |
|---|---|
| `startStopwatch` | `{ set_id, started_at: now + countdown, target }`, ends the rest; nothing on a completed set |
| `skipCountdown` | `started_at` = now, if still ahead |
| `stopStopwatch` | Writes the seconds (at least 1, the backend's minimum; a hold's at most its target), then calls `workoutReducer` recursively with `toggleSet`, so ticking has one set of rules; `toggleSet` on the timed set comes here first. During the countdown, writes nothing and ticks |
| `pauseStopwatch` / `resumeStopwatch` | As above |
| `cancelStopwatch`, `finish` | Forget it; the set is unchanged |

**The panel.**

- **The countdown:** "5, 4, 3…" in lime in place of the time, "Get ready" under it (also announced, `aria-live`), **Start now** in place of Stop, no Pause. `countdownStep()` (`lib/alarm.ts`) ticks at 3, 2 and 1 and plays a longer, higher tone at the start, from `setTimeout`s keyed on `started_at`: only those still ahead are set, so the app reopened mid-hold stays quiet, and Start now still gets the start's tone.
- **What the big number says:** a hold with a target, the time left ("0:12"), like the rest; a hold without one and a race, the time since the start.
- **The bar** is the rest bar's: shrinking to a hold's end; filling towards a race's time to beat, red once passed (C1.17.9); with no target, the seconds of the current minute.
- **Its own clock,** `useNow(250, started_at)`, so seconds change on time rather than up to a second late. The key refreshes it at once when Start now moves the start: a start ahead of the last tick would show "1" for a quarter of a second.
- **A hold's end** is a `setTimeout` at `stopwatchTargetAt(stopwatch)` (start + pauses + target; `null` while paused) that plays `restOver()` and calls `onStop`, which the panel reads through a ref (a new function each render would re-arm the timer four times a second). Resume makes a new `stopwatch` object, so the effect re-arms later by the pause's length. A moment already past (the app reopened after it) stops at once, in silence: the signal would come late, and the reducer writes the target. Races get no timer.
- **A region, not a dialog:** `<section aria-label="Stopwatch">`, like the rest bar's "Rest" region, so the table above stays reachable to screen readers. An effect focuses the main button on mount, since the ▶ that had focus is now disabled; Start now and Stop are one element, so the focus stays when the count begins. Pause toggles its label ("Pause/Resume the stopwatch"); paused, the time greys and pulses. **Cancel**'s accessible name is "Cancel, without saving the time", starting with the visible word so voice control finds it.
- **The first line** is "Set 2 · Plank", set first, name truncated.

### C1.17.9 Exercises done as fast as possible

Calisthenics plans are full of "50 push-ups, 50 sit-ups" as fast as possible: reps fixed, time is the result. The same exercise is done for reps on other days, so this is a property of the **plan item**, not the exercise.

**In the plan:** `plan_items.for_time` ([D3.5.3](../design/D3-data-model.md#d353-plan_items)), `for_time?` in `DraftItem`. `EditorItem` shows the switch only on rep-counted exercises (`canBeForTime(loggingType)`), action `setItemForTime`; `toPlanInput()` sends `true` only for those. `itemSummary()` adds "as fast as possible" to the line.

**In workout mode, one predicate: `isForTime(item)`** (plan item says so, exercise counts reps). Everything follows from it:

| Where | Done as fast as possible |
|---|---|
| `fieldsFor(loggingType, unit, t, forTime)` | `[reps, seconds]`. A weight, if any, stays the plan's or last time's: three fields beside ▶ and ✓ do not fit a phone |
| `SetRow`, `SetHeader` | ▶ before ✓; **no Last column**, so the two fields keep a thumb's width at 360 px. Last time's time is pre-filled in seconds, the stepper and the stopwatch |
| `canComplete(set, loggingType, forTime)` | Seconds required too |
| `toSessionInput()` | `duration_seconds` beside `reps` (`OPTIONAL_BY_LOGGING`, [C2.5.7](C2-backend.md#c257-the-workouts-endpoints)) |
| `StopwatchPanel`'s `race` | "Set 2 · 50 reps · Push-ups"; **To beat 1:12**, then "0:14 over" in red; no signal at the target |

**Last time of the same kind.** Push-ups 3 × 15 on Monday and 50 for time on Thursday: Thursday's time to beat is last Thursday's. The backend returns one last time per exercise **and kind** ([C2.5.7](C2-backend.md#c257-the-workouts-endpoints)); the app picks with `hasTimedSets(entry.sets)` (`compare.ts`): any set with seconds makes it timed. `lastOfKind()` does it at start, Add exercises and Swap; `compareWorkout()` in the summary and history. No flag is stored: a set with reps and seconds says it by itself.

**Written and compared:** `loggedSetText()` writes "50 in 1:12" (`workout.repsInTime`); `compare.ts` scores `[weight, reps, −seconds]`: more reps first, then less time (C1.19.3).

### C1.17.10 Times, up next, how to do it

**Times past a minute as m:ss.** "870" says nothing in a row; "14:30" does. Seconds stay the unit everywhere (typed, stored, sent as `duration_seconds`); only the text changes, in `durationText(seconds, language)` (`plan-format.ts`):

| Seconds | Text |
|---|---|
| 45 | "45 s" ("45 sec" in English): `formatSeconds()` |
| 120 | "2 min": `formatSeconds()` |
| 870 | "14:30": `clock()`, the stopwatch's format, so the time read on the stopwatch is the time written in the set |

- **Used by** the row's field (`fieldText()` in `set-fields.ts`, which leaves other fields and a time being typed alone), the Last column and history (`loggedSetText()`), plan targets (`formatSetTarget()`). **Not rests,** which stay in seconds as gyms count them.
- **The column is "Time"** (`workout.colTime`); its spoken name keeps the unit of the raw value ("Set 1, Seconds: 870").
- **The stepper** types seconds and shows the clock beside them: "Seconds · 14:30".

**Up next.** `upNext(session, index)` is the exercise after this screen: the first after it with work left, past a whole superset, which is on screen; with nothing after, the first from the top with work left; `null` when nothing is left. Shown in two places:

- **`UpNextCard`** under Add set: photo, "Up next", name, the plan's line. **A reminder, not a button:** moving on is the bottom bar's job, and a second exit mid-screen invites mis-taps. A named `<aside>`.
- **`RestBar`**: "Up next: Bent Over Barbell Row" when the rest leads there (no set left on this screen). The rest is when the next station is set up, and the bar is always visible. Mid-exercise it says nothing.

**How to do it.** A tap on the exercise's photo or name opens `ExerciseInfoSheet` (bottom sheet): equipment, photos, muscles (`MuscleChips`, shared with the exercise's page), steps, description, video.

- **No request:** the workout holds the library's full exercise JSON, copied at Start from the plan (`PlanItemResource` embeds `ExerciseResource`). It works offline; only photos need the network or the browser cache.
- **Two triggers, one sheet.** The photo is a `<button>` named "How to do it: Bench Press" (the image is `alt=""`), with a small ⓘ badge. The name is a `<button>` *inside* the `<h2>`, dotted underline, so the heading keeps the exercise name in the page's outline. Both have `aria-haspopup="dialog"`. Controlled by `infoOpen` on the screen.
- **At most 90 % of the viewport** (`max-h-[90dvh]`), title fixed, content scrolling, which in a flex column needs `min-h-0` on the scrolling child.
- **An exercise with nothing to show** says so in words.

### C1.17.11 Removing what was added by hand

**Only what was added during the workout can be removed.** The plan's exercises and sets stay, so the day is always whole; they can be skipped (C1.17.7) or left unticked, which already keeps them out of what is saved.

**Derived, not flagged:**

```ts
canRemoveExercise(item)       // item.plan_item === null
canRemoveSet(item, index)     // index >= (item.plan_item?.sets.length ?? 0) && item.sets.length > 1
```

- **An exercise** is the plan's when it has a plan item; those from **Add exercises** and every exercise of a free workout have none. Swap keeps the plan item.
- **A set** is the plan's when it is among the first *n*, *n* being the plan item's set count: `startSession()` makes one per planned set, Swap keeps the count, **Add set** appends.
- **Never the only set:** an exercise with no sets is removed whole, from its menu.
- **Why no flag:** an `added: true` would have to be set by every adding action, preserved by Swap, and would be missing from workouts stored by older builds. The plan item already says it.

Both reducer actions re-check the rule, so a stray dispatch cannot remove a plan's set:

| Action | Does |
|---|---|
| `removeSet` | Splices the set out; a stopwatch on it is forgotten |
| `removeExercise` | Splices the exercise out; a stopwatch on one of its sets is forgotten; the current index moves back when the removed one came before it or was last; an emptied free workout shows its empty state |

**On screen.**

- **A set:** **Remove this set** at the bottom of its stepper (`onRemove` passed only when `canRemoveSet` holds). The row has no room left at 360 px. Red text under **Done**, away from the thumb. No confirmation: a set added a moment ago is as quick to add again. The sheet closes first.
- **An exercise:** **Remove from workout**, the menu's last row; the sheet becomes a question ("Remove Barbell Squat?", its sets go too, ticked ones included) with **Remove** and **Back**. Confirmed here and not for a set because an exercise may hold completed sets.

### C1.17.12 Deleting a workout in progress

A workout started by mistake or abandoned is discarded from Finish's dialog, without sending it and deleting it afterwards.

**Nothing to undo on the server.** A workout in progress exists only on the phone (C1.17.5): deleting it is `storeActiveSession(null)` and a navigation; no request, nothing queued, nothing that can fail offline.

**One door for ending a workout.** Finishing and deleting share `FinishButton`'s dialog instead of adding a button to a top bar that already holds ✕, the day, the clock and Finish:

| The dialog shows | Buttons |
|---|---|
| "Finish the workout?" with the sets done | **Keep going**, **Finish and save**; below, in red, **Delete workout** |
| "Delete the workout in progress?": nothing will be saved, not even ticked sets; irreversible | **Back** (to the first view), **Delete** (red) |

- **Two views,** `view: 'finish' | 'discard'` in state. **Delete workout** and **Back** are plain `Button`s, since `AlertDialogCancel`/`Action` would close the dialog.
- **Controlled,** so any close resets `view` to `'finish'`: reopened, it always asks the first question.
- **`onDiscard?`** enables Delete (C1.4).
- **Layout:** Delete is the footer's first child in a reversed column, so it renders last; with it the footer stays a column above 640 px too (`sm:flex-col-reverse`), since three buttons in a row overflow the 384 px dialog in Spanish and German.

**Where it leads.**

- **In workout mode,** `discard()` in `WorkoutScreen` clears the workout and opens the plan's page (Home for a free workout) with `replace: true`. The empty free workout's **Cancel workout** is the same function.
- **From `ResumeBanner`** (Home, plan page): the page read the workout once into its state (`useState(loadActiveSession)`), so the banner calls `onDiscarded()` and the page does `setActive(null)`; **Start** and **Free workout**, disabled by `busy={active !== null}`, work again.

**Tests** check that nothing is left on the phone (`loadActiveSession()`, `loadPending()`, `loadFinished()`) and nothing is sent to `/api/sessions`, from workout mode and from the banner.

---

## C1.18 Home

[D1.4.2](../design/D1-ui.md#d142-home): the first screen says **what to do today** and starts it in one tap.

### C1.18.1 The pieces

```
HomePage                 route `/`, inside AppLayout
├── useHome()            GET /api/home: active plan, its days, suggested day, last day, recent workouts
├── FormBanner           after a summary: "saved" / "will be sent" / "refused" / "deleted"
├── ResumeBanner         a workout in progress on this phone: Resume, Finish
├── ActivePlanCard       the plan, the chosen day (the suggested one initially), Start, a chip per day
│   or EmptyState        no active plan: Create a plan, Browse exercises
├── Free workout         startFree()
└── This week            WeekStrip (days trained), WeekStats (workouts, sets, minutes), from weekSummary()
```

| File | Holds |
|---|---|
| `api/home.ts` | `HomeData`, `HomeDay`, `homeKeys`, `useHome()` |
| `components/home/ActivePlanCard.tsx` | The card: chosen day, its numbers, Start, chips |
| `components/home/week-summary.ts` | `weekSummary()`: this week's workouts by the device's clock; no React |
| `components/home/WeekStrip.tsx`, `WeekStats.tsx` | Seven days, three numbers |

**One request.** Home is opened on every visit, often on mobile data, where one answer arrives sooner than five. `GET /api/home` (`HomeSummary`, [C2.5.7](C2-backend.md#c257-the-workouts-endpoints)) carries the active plan, its days with a duration estimate, the suggested day, the last day done and the week's workouts. Days come **without exercises**: the card needs only a name, a count and minutes.

**States:** skeleton, error with **Try again**, the card, or the empty state ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)). Free workout and the week render in every state; Free workout needs no request.

**Invalidation.** `['home']` is marked stale after a workout is sent (`WorkoutScreen.finish()`, `usePendingSessions`) and after any plan change (`refreshPlans()` in `api/plans.ts`), since both change the card or the suggested day.

### C1.18.2 Starting from Home: one hook for two pages

Start on Home and Start this day on the plan's page run the same steps, so they share `useStartWorkout()`:

```tsx
const start = useStartWorkout()
// start.startDay(plan, day)           plan page: the plan is loaded
// start.startPlanDay(planId, dayId)   Home: fetches the plan first
// start.startFree()                   Home: Free workout
// start.starting, start.failed
```

**Home has only the days' names.** `startPlanDay()` loads the plan with `queryClient.ensureQueryData()` under the same key and function as `usePlan()`, so the plan page later finds it cached; then `startDay()` runs as in [C1.17.2](#c1172-starting-the-plan-becomes-a-workout). A cached plan is used even when stale and read again in the background (`revalidateIfStale`): the start never waits for the network, and offline it works from the copy kept on the phone. When the plan cannot be loaded (an error, or offline with no copy, said at once instead of waiting), `failed` is set, the card says so and nothing starts.

**Read ahead for offline.** `usePrepareWorkouts(planId)`, on Home for the active plan and on a plan's page for that plan, fetches the plan and prefetches each day's last sets while online, and, with a service worker in control, downloads its exercises' photos, both sizes, for the worker's photo cache ([C1.21](#c121-opening-with-no-network)). It runs again when the network returns, and on `controllerchange`: at the app's very first opening the worker takes control only after Home has read ahead. Prefetches, not queries: nothing on screen shows them, so a return to the window does not read them again; a sent workout marks them stale (`sessionKeys.all`) and the next visit reads them. Kept on the phone, they let Start work offline with the Last column filled ([C1.17.2](#c1172-starting-the-plan-becomes-a-workout)).

**Free workout** is `startFreeSession(now)`: no request, works offline ([C1.17.3](#c1173-the-workout-and-its-reducer)).

### C1.18.3 The card: choose, then start

- **The chosen day** is `useState`, initialised from `suggested_day_id`, the day after the last one done, computed by the backend ([D2.8](../design/D2-decisions.md#d28-workout-rules)). A **Suggested** badge marks it; "Last time you did Day A – Push" comes from `last_day`.
- **A chip selects a day; Start starts it.** One tap that starts a workout is too easy to make by mistake on a phone, and a stray workout stays in progress until finished. `aria-pressed` marks the selected chip.
- **The selected chip's look** must beat the outline button's `dark:border-input dark:bg-input/30`: a `dark:` class wins over the same property without it, so the selected style repeats border and tint under `dark:`.
- **Start is disabled** while a workout is in progress (the reason is written below it), while starting, and on a day with no exercises. A plan with no days shows **Edit the plan** instead.
- **One lime button:** Start. When Resume (also lime) is shown, Start is disabled.

### C1.18.4 This week, by the device's clock

A week starts Monday at midnight **in the user's time zone**, which only the device knows; the backend stores UTC ([D3.2.5](../design/D3-data-model.md#d325-times)). So the backend sends the finished workouts of the **last 8 days**, which cover the current week in any zone, and the app filters:

```ts
const week = weekSummary(home.data?.recent_sessions ?? [], new Date())
// { workouts: 2, sets: 29, minutes: 97, trainedDays: [Thu 5, Sat 7] }
```

`isInWeek(moment, today)` (`lib/week.ts`) compares with this Monday and the next, both built with the local `Date` constructor. A day with two workouts counts once. Sets are the backend's `sets_done` (no warm-ups); minutes sum `duration_seconds`, rounded once. No volume: it adds unlike exercises and counts nothing bodyweight ([D2.8](../design/D2-decisions.md#d28-workout-rules)). Minutes rather than "2 h 35 min", so the number fits a third of a phone's width. A trained day gets a lime ring, a dot and the hidden words "workout done": colour alone never carries meaning ([D1.7](../design/D1-ui.md#d17-responsive-layout-and-accessibility)).

**`ResumeBanner`'s Finish** asks the same question as workout mode (`FinishButton`), runs `finishWorkout()` and opens the summary: for a workout done but never finished.

**Not built yet:** the last three personal records (with Progress, phase 2).

### C1.18.5 Testing it

- **The week** (`week-summary.test.ts`, `week.test.ts`): "today" a Thursday, workouts on Thursday, twice on Tuesday and on the previous Sunday; the Sunday is excluded and Tuesday counted once.
- **The page** (`HomePage.test.tsx`): `homeAnswer()` with the test plan active and Day B suggested; the card is found as `region` named by its heading. Covers Start (plan and last sets fetched, workout mode on the right day), the reading ahead and Start offline from it, chip then Start, plan fetch failure, Resume, free workout, the week's numbers.
- **`WeekStats`** puts each `<dt>` before its `<dd>` in the DOM but renders it below (`flex-col-reverse`); tests find the label and read `nextSibling`.

---

## C1.19 The summary and history

[D1.4.10](../design/D1-ui.md#d1410-workout-summary), [D1.4.11](../design/D1-ui.md#d1411-history): **the summary** after Finish says what was done and asks how it felt; **history** lists past workouts.

### C1.19.1 The pieces

```
WorkoutScreen.finish()   queue, send, storeFinished({ id, session, input, outcome }), then /session/:id/summary
SummaryPage              /session/:id/summary: the finished workout from the phone; absent → its history page
├── WorkoutStats         time, exercises, sets, reps, from inputTotals(input)
├── ComparisonSummary    "Against last time: 2 better · 1 same", from compareWorkout()
├── Collapsible          "Exercises 3", closed: SessionExercises
├── FeelingPicker        1 to 5
├── Textarea             notes
└── Save / Delete        then Home, with "saved" / "will be sent" / "refused" / "deleted"

ProgressPage             /progress: the 3 latest workouts, All workouts; charts and records "coming soon"
HistoryPage              /progress/history: by month, 20 at a time, Show more
└── SessionRow           date, day, plan, time · sets · reps; links to its page
HistoryDetailPage        /progress/history/:id: numbers, verdict counts, feeling, notes, Delete
└── SessionExercises     each exercise against last time ("80×8 · last time 80×6"), its sets ("W1 40×10", "1 80×8";
                         "Skipped"), its own volume for weighted exercises
```

| File | Holds |
|---|---|
| `api/sessions.ts` | `useSessions()` (pages), `useSession()` (a workout and its last times), `useDeleteSession()` |
| `pages/SummaryPage.tsx` | The summary; `WorkoutEndState`, what Home is told afterwards |
| `components/history/totals.ts` | `inputTotals()` (from the phone's body), `sessionTotals()` (from the server) |
| `components/history/compare.ts` | `compareExercise()`, `compareWorkout()`, `countVerdicts()`, `bestSet()`, `exerciseVolume()` (C1.19.3) |
| `components/history/feeling.ts` | The five feelings, `feelingName()` |

### C1.19.2 The summary: drawn from the phone

Right after the last set the network may be down, so the summary is **drawn from the copy stored at Finish**, never from the server:

1. `finish()` queues and tries to send the body ([C1.17.5](#c1175-the-queue-of-workouts-to-send)), stores `{ id, session, input, outcome }` under `atleoplan.finishedSession` and opens the summary. `session` carries what the body lacks: exercise names, logging types, last time's sets.
2. `SummaryPage` reads it once (`useState(loadFinished)`). `inputTotals()` applies the backend's rules (exercises with a set, working sets and reps, time trained, [C2.5.7](C2-backend.md#c257-the-workouts-endpoints)), so history later shows the same numbers.
3. **The comparison needs no request:** each exercise kept `previous` from the start ([C1.17.2](#c1172-starting-the-plan-becomes-a-workout)). Started offline, every exercise reads "First time".

**Save** adds feeling and notes to the body and **resends the whole workout through the queue** (`addPending(id, { ...input, feeling, notes })`, `sendPendingSessions()`): a `PUT` to the same UUID replaces it, and offline the answers wait in the queue. With nothing to add, nothing is sent. Home opens with `WorkoutEndState` in the navigation `state`.

**Delete** removes it from the queue and sends `DELETE /api/sessions/{id}`:

| The workout was | DELETE answers | Then |
|---|---|---|
| sent at Finish | 204 | deleted; Home says so |
| sent, but the network is down now | no answer | the summary stays with "could not be deleted": it is on the server |
| still queued | no answer (offline) | deleted: it never reached the server |
| never arrived, or already deleted | 404 or 410 | deleted |

**Reopened** after Save, or on another device, the finished copy is gone: `<Navigate>` replaces the address with the workout's history page, which reads the server.

### C1.19.3 Better than last time, exercise by exercise

A workout's total volume says little: it adds a kilogram of squat to a kilogram of curl and counts nothing bodyweight, so a calisthenics workout weighs 0 ([D2.8](../design/D2-decisions.md#d28-workout-rules)). Each exercise is compared with itself instead, in `compare.ts`:

```ts
compareExercise(sets, previous, loggingType)
// → { verdict: 'better' | 'same' | 'worse' | 'first', best, previousBest }, or null for a skipped exercise
```

| Logged as | Best set: the one with | Example |
|---|---|---|
| weight × reps | the highest estimated one-rep max, Epley: weight × (1 + reps / 30) | 82.5×8 (104.5) beats 85×5 (99.2) |
| reps | most added weight, then most reps | +5×6 beats 12; 12 beats 10 |
| time, distance | the longest | 1:30 beats 1:15 |
| reps, as fast as possible | most reps, then shortest time; only against the same kind ([C1.17.9](#c1179-exercises-done-as-fast-as-possible)) | 50 in 1:05 beats 50 in 1:12 |

- **Warm-ups never count;** an exercise with only warm-ups, or skipped, gets `null` and is not counted.
- **Ties** between best sets go to the total reps of working sets: 3×8 beats 2×8 at the same weight.
- **Scores are tuples** compared item by item (`compareScores()`), with differences below 0.001 treated as equal: the same multiplication done twice can differ in its last bit.
- **Weights arrive as numbers** (the phone's body) **or exact text** (`"80.000"`, the API); `Number()` reads both.
- **On screen:** `ComparisonSummary` counts verdicts, lime when more improved than declined; `SessionExercises` shows the verdict and both best sets via `loggedSetText()`. A decline is grey, not red: a lighter day is not a failure.
- **Folded in the summary** (a Collapsible, closed): the count tells how it went, and the questions and Save stay near the top. It animates on `--radix-collapsible-content-height`; the arrow turns with `group-has-data-open:rotate-180`. On a history page the list is the content, so it is open.
- **Volume only per weighted exercise:** "Volume of this exercise: 1,280 kg" (`exerciseVolume()`), never summed across exercises.

### C1.19.4 History: pages from the server

- **The list** is `useSessions()`, an infinite query over `GET /api/sessions?status=finished&page=…&per_page=20` ([C1.14.2](#c1142-a-list-one-page-at-a-time)'s pattern).
- **By month:** `byMonth()` groups newest first; the heading is capitalised with `first-letter:uppercase`, since some locales write months in lower case ("novembre 2026").
- **A workout's page** is `useSession(id, language)` (names come translated). `meta.last_sets` carries last time for each exercise, counting only workouts **before** it ([C2.5.7](C2-backend.md#c257-the-workouts-endpoints)), fed to the same `compareWorkout()` as the summary. Sets are numbered with `setNumbers()` and written with `loggedSetText()`: one way of writing a set across the app.
- **Delete** (`useDeleteSession`) removes the workout's cached copies, marks the lists and Home stale, and opens history.
- **Progress** shows the first three rows of the same `useSessions()` query, so **All workouts** opens from the cache.

**Not built yet:** editing a past workout ([FEAT-6](../project/backlog.md#feat-6-edit-a-past-workout)), an exercise's own history ([FEAT-7](../project/backlog.md#feat-7-an-exercises-own-history)), records ([FEAT-5](../project/backlog.md#feat-5-new-records-during-a-workout)), Progress charts (phase 2).

### C1.19.5 Testing it

- **Totals** (`totals.test.ts`) and **comparison** (`compare.test.ts`): one case per logging type, ties, weights as numbers and text, first time, skipped.
- **The summary** (`SummaryPage.test.tsx`) builds a finished workout as Finish does (`startSession()`, `workoutReducer()`, `toSessionInput()`, `storeFinished()`), then checks the numbers, that the comparison made no request, the `PUT` with feeling and notes, no request with nothing to add, both delete paths, the redirect to history.
- **History** (`HistoryPage.test.tsx`) answers each page by its exact query string.
- **Workout mode's tests** end on a stand-in for the summary and read the finished workout back with `loadFinished()`.

---

## C1.20 Showing that something is loading

When nothing changes on screen during a request, the app looks frozen and the answer seems to jump in. Every wait has a sign, chosen by what is on screen meanwhile ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)):

| While waiting, the screen has… | The sign | Example |
|---|---|---|
| nothing yet (first read) | **`Skeleton`** where the content will be | plan list, a plan, the library's first page |
| old content being replaced | the old content **dimmed** (`opacity-60`) and a **`Spinner`** where the request started | the library's and the picker's search |
| a button that started the request | the button's **`pending`** | Save, Sign in, Delete, Export, Start, Show more, Retry |

- **`Spinner`** (`components/ui/spinner.tsx`), shadcn's with two changes: hidden from screen readers unless given a `label`, which makes it a translated `role="status"` (shadcn's always said "Loading" in English); and sized `h-4 w-4`, not `size-4`, so inside a button the button's rule for un-sized icons sizes it like the icon it replaces.
- **`Button`'s `pending`** (ours): `disabled`, `aria-busy="true"`, spinner first among the children; `aria-busy:[&>svg:not([data-slot=spinner])]:hidden` in the base class hides the button's own icon meanwhile. With `asChild` it does nothing: Radix's `Slot` requires exactly one child (and `React.Children.count` counts a `false`), so the button renders its child alone. **`AlertDialogAction`** has the same prop and places the spinner inside the Radix Action.
- **`ExerciseSearchBox`**, shared by the Exercises page and the picker: `searching` shows a spinner labelled "Searching…". It is true while `search !== debounced` (the 300 ms the box is ahead of the request, [C1.14.3](#c1143-filters-in-the-address)) or `list.isPlaceholderData`.

**Two buttons, one mutation.** Activate and Archive share `usePlanAction`: both are disabled while it runs, but only the pressed one is `pending`, read from `action.variables`. The summary's Save and Delete share `busy: 'save' | 'delete' | null` the same way.

**No sign** for background refetches (the data is already on screen and updates in place) or for workout actions (they are stored on the phone and never wait for the server, [C1.17](#c117-workout-mode)).

---

## C1.21 Opening with no network

The production build has a service worker, made by **vite-plugin-pwa** (Workbox, `generateSW`) from `vite.config.ts`. The first visit online stores the app's files; from then on the app opens with no network ([D2.7](../design/D2-decisions.md#d27-offline-and-sync)). Together with the data kept on the phone, below, the screens already opened work with no network too.

- **What it keeps:** the build's files, `index.html`, the JavaScript, the CSS, the Inter fonts and the favicon (`globPatterns`), about 1.3 MB, most of it the one JavaScript chunk ([C1.11](#c111-known-limits)). Nothing from the API: server data is TanStack Query's.
- **Exercise photos** (`runtimeCaching`, cache `photos`): images under `/storage/`, kept once seen online or downloaded ahead for the active plan ([C1.18.2](#c1182-starting-from-home-one-hook-for-two-pages)). Cache first, since a new photo gets a new address; at most 500, the least recently used going first, each for 30 days, so a conversion made again shows within a month. Images only: videos are read in ranges, which a cache-first route breaks.
- **Any address opens the app.** A navigation gets `index.html` from the cache and the router takes it from there, so `/plans/abc` opens with no network too. Not Laravel's paths, which share the origin in production (`navigateFallbackDenylist`: `/api/`, `/sanctum/`, `/storage/`, `/auth/`, `/admin`): Google's sign-in and the admin panel must reach the server, and offline they fail as any page would.
- **Updates without a reload** (`registerType: 'autoUpdate'`). A new build's worker installs in the background and takes over at once (`skipWaiting`, `clientsClaim`), but an open page keeps the code it loaded: the new version shows at the next opening, never in the middle of a workout or of an unsaved form. The registration is the plugin's `registerSW.js`, which the build adds to `index.html`.
- **Not in development.** `make dev` has no worker: it would serve old modules over Vite's. `make fe-preview` serves the build, worker included, on a port of its own, 4673: a worker registered on 5673 would outlive the preview and answer in place of the dev server ([H3.8.4](../how-to/H3-frontend.md#h384-the-app-with-no-network)).
- **No manifest yet.** The app opens offline in the browser; installing it on the home screen, with a manifest and icons, is phase 2 ([D1.8](../design/D1-ui.md#d18-release-phases-and-open-questions)).

**The data kept on the phone** (`lib/query-persistence.ts`, `PersistQueryClientProvider` in `App.tsx`). TanStack Query's cache is kept in IndexedDB (`@tanstack/query-async-storage-persister` over `idb-keyval`, database `atleoplan`, store `query-cache`). Offline, the guards find the signed-in user there and the screens their answers, as last seen online.

- **Read ahead:** the active plan and each day's last sets, which no screen shows but Start needs ([C1.18.2](#c1182-starting-from-home-one-hook-for-two-pages)).
- **What is kept:** the answers a screen would show (`shownData()`), for a week (`maxAge`): also one whose last refresh found no server, which is when the copy is needed; keeping only successful queries would drop the user and Home from the copy at the first failed refresh, and the next opening would find nothing. Not the library's searches, a new key for each word typed; not a request that failed with nothing kept, nor one a 4xx refused; not mutations: changes made offline have their own queue ([C1.17.5](#c1175-the-queue-of-workouts-to-send)).
- **`CACHE_VERSION`** is the persister's `buster`: a copy saved under another version is dropped instead of restored. Raised by hand when an answer changes shape ([C1.12](#c112-typescript-conventions)), not tied to the build, which would drop the copy at every update, maybe at the first opening offline at the gym.
- **Storage that fails** (blocked in a private window, a full disk) reads as empty and writes nothing: the app works online as without the copy.
- **Signing out, or a 401,** empties the cache and so the copy ([C1.13.1](#c1131-the-one-idea-who-is-signed-in-is-server-data)).

**Offline, the guards do not wait.** With no network TanStack Query pauses a request instead of failing it, so `GET /api/user` would stay pending, and the guards' skeletons on screen, until the network returns. `isAwaitingUser()` (`api/auth.ts`) counts a paused request as no answer: `RequireAuth` shows "Can't reach the server", `RequireGuest` the form. When the network returns, the request resumes and the app opens by itself.

---

← [D3. Data model](../design/D3-data-model.md) · [Contents](../README.md) · [C2. Backend](C2-backend.md) →
