# C1. Frontend

How the React app in `frontend/` is built, why, and how to work on it. It is written for someone who knows little React, TypeScript or modern JavaScript and wants to read the code and change it with confidence. Read [C1.1](#c11-the-pieces)–[C1.4](#c14-react-from-scratch) once, in order: the pieces, the folders, what happens when the app opens, and React's few core ideas. Keep [C1.12](#c112-javascript-and-typescript-you-will-meet) at hand for any syntax that looks strange, and [C1.9](#c19-recipes) while coding. Signing in and forms have a section of their own, [C1.13](#c113-signing-in-and-forms).

Every source file starts with a comment saying what it is for, and the code is commented line by line ([P1.2](../project/P1-conventions.md#p12-code)): the files are meant to be read next to this page. The decisions behind the choices are in [D2.2](../design/D2-decisions.md#d22-stack); the screens they serve in [D1. UI design](../design/D1-ui.md); setup and commands in [S1.7](../start/S1-setup.md#s17-creating-the-react-frontend) and [S1.8](../start/S1-setup.md#s18-everyday-commands).

**New to React itself?** [L2. React course](../learn/L2-react.md) teaches React and the libraries used here lesson by lesson, keeping apart what is React, what is a library and what this project adds; this page is about how the app is built with them.

## Contents

- [C1.1 The pieces](#c11-the-pieces)
- [C1.2 Folder structure](#c12-folder-structure)
- [C1.3 What happens when the app opens](#c13-what-happens-when-the-app-opens)
- [C1.4 React from scratch](#c14-react-from-scratch)
- [C1.5 Routing](#c15-routing)
- [C1.6 Server data](#c16-server-data)
- [C1.7 Translations](#c17-translations)
- [C1.8 Styles and theme](#c18-styles-and-theme)
- [C1.9 Recipes](#c19-recipes)
- [C1.10 Tests and checks](#c110-tests-and-checks)
- [C1.11 Known limits](#c111-known-limits)
- [C1.12 JavaScript and TypeScript you will meet](#c112-javascript-and-typescript-you-will-meet)
- [C1.13 Signing in and forms](#c113-signing-in-and-forms)
  - [C1.13.1 The one idea: who is signed in is server data](#c1131-the-one-idea-who-is-signed-in-is-server-data)
  - [C1.13.2 The guards](#c1132-the-guards)
  - [C1.13.3 A form, step by step](#c1133-a-form-step-by-step)
  - [C1.13.4 Preferences on the account](#c1134-preferences-on-the-account)
  - [C1.13.5 Details that are easy to miss](#c1135-details-that-are-easy-to-miss)
  - [C1.13.6 Testing a screen with the API](#c1136-testing-a-screen-with-the-api)
- [C1.14 The exercise library screens](#c114-the-exercise-library-screens)
  - [C1.14.1 The pages and their pieces](#c1141-the-pages-and-their-pieces)
  - [C1.14.2 A list one page at a time](#c1142-a-list-one-page-at-a-time)
  - [C1.14.3 Filters in the address](#c1143-filters-in-the-address)
  - [C1.14.4 The editor's form](#c1144-the-editors-form)
  - [C1.14.5 Photos](#c1145-photos)
  - [C1.14.6 Testing it](#c1146-testing-it)
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

---

## C1.1 The pieces

| Piece | Role | Where |
|---|---|---|
| **React 19** | Draws the interface out of components, functions that turn data into markup | everywhere |
| **TypeScript 6** | Types on top of JavaScript: mistakes show in the editor before the app runs | `tsconfig.app.json` (strict) |
| **Vite 8** | Development server (instant reload) and production build | `vite.config.ts` |
| **React Router 8** | Which screen each address shows, without reloading the page | `src/router.tsx` |
| **TanStack Query 5** | Fetches server data, caches it, keeps it fresh | `src/lib/query-client.ts`, `src/api/` |
| **react-hook-form + zod** | Forms: react-hook-form holds the fields, zod says what is valid ([C1.13](#c113-signing-in-and-forms)) | `src/pages/auth-schemas.ts`, `src/lib/form.ts` |
| **i18next + react-i18next** | Every text in four languages | `src/i18n/` |
| **Tailwind CSS 4** | Styling with utility classes in the markup | `src/index.css` |
| **shadcn/ui** (Radix base, Nova preset) | Ready-made components (buttons, selects, cards) whose code lives in the project | `src/components/ui/` |
| **Lucide** | Icons, as React components | `lucide-react` |
| **Inter** | The font, served by the app itself (works offline) | `@fontsource-variable/inter` |
| **Vitest + Testing Library** | Tests of functions and components | `*.test.ts(x)` next to the code |
| **ESLint** (with stylistic rules) | Likely bugs and one code style, no Prettier | `eslint.config.js` |

How a request travels in development (in production Caddy takes Vite's place, [D2.6](../design/D2-decisions.md#d26-hosting)):

```
Browser ── http://localhost:5673 ──▶ Vite ──┬── /api/*, /sanctum/*, /storage/* ──▶ Laravel (Docker, :8500)
                                            └── everything else ──▶ the React app (index.html + JS)
```

One address for both is what lets Sanctum's login cookie work without CORS.

---

## C1.2 Folder structure

```
frontend/
├── index.html              the only HTML page; applies the saved theme before React loads
├── vite.config.ts          plugins, the @/ alias, dev server + proxy, Vitest
├── eslint.config.js        lint rules and code style
├── components.json         shadcn/ui settings (where `npx shadcn add` writes)
├── tsconfig*.json          TypeScript: app (src/) and build config
├── public/                 files served as they are (favicon.svg, the logo's mark)
└── src/
    ├── main.tsx            entry point: CSS, translations, draws <App />
    ├── App.tsx             the providers: data cache, theme, router
    ├── router.tsx          the route table
    ├── index.css           Tailwind + the colour tokens of both themes
    ├── api/                one file per API resource: types, cache keys, hooks
    │   ├── health.ts         GET /api/health → useHealth()
    │   ├── auth.ts           the account: useCurrentUser(), useSignIn(), useSignOut()… (C1.13)
    │   ├── exercises.ts      the library: useExercises() (pages), useExercise(), create, update, delete (C1.14)
    │   ├── plans.ts          the plans: usePlans(), usePlan(), usePlanAction() (activate, archive, unarchive), useDeletePlan() (C1.15), useCreatePlan(), useUpdatePlan() (C1.16)
    │   ├── sessions.ts       the workouts: useLastSets(), fetchLastSets(), sendSession() (C1.17); useSessions(), useSession(),
    │   │                     useDeleteSession() (C1.19)
    │   ├── home.ts           Home's one request: useHome() (C1.18)
    │   └── muscles.ts, equipment.ts   the two fixed lists of the filters and the editor
    ├── components/
    │   ├── ui/               shadcn/ui components (generated, then ours to edit)
    │   ├── layout/           the frames: AppLayout (navigation), AuthLayout (sign-in screens); SideNav, BottomTabBar, nav-items
    │   ├── brand/            the logo: BrandMark and Wordmark
    │   ├── home/             pieces of Home: ActivePlanCard, WeekStrip, WeekStats; week-summary.ts, this week's numbers (C1.18)
    │   ├── history/          pieces of the summary and history: WorkoutStats, ComparisonSummary, FeelingPicker, SessionRow,
    │   │                     SessionExercises; totals.ts, a workout's numbers; compare.ts, better or not than last time;
    │   │                     feeling.ts, the five feelings (C1.19)
    │   ├── exercises/        pieces of the library: ExerciseListItem, ExerciseFilters, ExercisePhotos, ExerciseForm and exercise-form.ts (C1.14)
    │   ├── plans/            pieces of the plan screens: PlanCard, PlanDayView, PlanItemRow, and plan-format.ts, the summary of an exercise (C1.15);
    │   │                     plan-draft.ts, the editor's draft and reducer, draft-storage.ts (C1.16);
    │   │                     SetTypeSelect (C1.16.9); ExportPlanButton, ImportPlanButton, plan-file.ts: a plan as a file (C1.15.6)
    │   │   └── editor/         the plan editor: PlanEditor, EditorDay, EditorItem, EditorSet, ExercisePicker (C1.16)
    │   ├── workout/          workout mode: WorkoutScreen, SetRow, RestBar, clock.ts; workout-session.ts, the workout and its reducer;
    │   │                     session-storage.ts, the workout and the queue kept on the phone (C1.17);
    │   │                     useStartWorkout.ts and ResumeBanner, shared with Home (C1.18); set-text.ts, a set as "80×8"
    │   └── *.tsx             shared by several pages: PageHeader, EmptyState, ComingSoon, SettingRow, FormField, FormBanner, the pickers…
    ├── pages/              one component per screen (HomePage, LoginPage…), and auth-schemas.ts, the rules of the sign-in forms
    ├── routes/             the guards: RequireAuth, RequireGuest, useAccountPreferences (C1.13)
    ├── i18n/
    │   ├── index.ts          i18next setup and language detection
    │   ├── languages.ts      the supported languages and their names
    │   ├── i18next.d.ts      makes translation keys type-checked
    │   └── locales/          it.json, en.json, es.json, de.json
    ├── lib/                plain helpers: http (fetch wrapper), query-client, form (server errors on a form), format (numbers, dates), week, utils (cn);
    │                       pending-sessions (sending the queued workouts), alarm (beep and vibration),
    │                       download (a file saved from the browser, C1.15.6);
    │                       hooks: useDebouncedValue, useNow, useWakeLock, usePendingSessions
    ├── theme/              dark / light theme: logic, context, provider, hook
    └── test/               setup.ts runs before every test file; auth-helpers.tsx: a fake API and full-page rendering (C1.13); exercise-helpers.ts: exercises and lists to fake (C1.14); plan-helpers.ts: plans to fake (C1.15)
```

**Naming.**

- **Components:** PascalCase files named after the component they export (`AppLayout.tsx` exports `AppLayout`), one main component per file, named exports (`export function X`), not `export default`.
- **Everything else:** kebab-case (`query-client.ts`, `nav-items.ts`). Hooks are `useSomething` (`useTheme.ts`).
- **shadcn/ui** files keep shadcn's own names (`button.tsx`).
- **Tests** sit next to what they test: `format.ts` → `format.test.ts`.
- **Imports** use the `@/` alias for anything outside the current folder (`@/components/ui/button`), a relative path for neighbours (`./nav-items`).

---

## C1.3 What happens when the app opens

1. The browser loads **`index.html`**. Its small inline script reads the saved theme and puts `class="dark"` on `<html>` at once, before anything is drawn, so a light-theme user never sees a dark flash.
2. `index.html` loads **`src/main.tsx`**, which:
   - imports `index.css` (Tailwind and the colour tokens);
   - imports `src/i18n`, which sets up i18next and picks the language: saved choice, else the browser's, else English;
   - tells React to draw `<App />` inside `<div id="root">`.
3. **`App.tsx`** wraps everything in the providers, from the outside in: `QueryClientProvider` (server-data cache), `ThemeProvider` (theme), `RouterProvider` (screens).
4. The **router** reads the address. On `/profile` it matches the branch whose element is the guard `RequireAuth`, then `AppLayout`, then the child `profile`.
5. **`RequireAuth`** asks `GET /api/user` and shows grey shapes until the answer arrives. A visitor goes to `/login`; a signed-in user continues, with the account's language and theme applied ([C1.13](#c113-signing-in-and-forms)).
6. **`AppLayout`** draws the navigation and an `<Outlet />`; the router puts `ProfilePage` there.
7. **`ProfilePage`** draws its cards. `ServerStatus` inside it calls `useHealth()`. TanStack Query starts `GET /api/health`, and the component shows its loading skeleton. When the answer arrives, the component draws itself again with "Connected".

**Moving around.** A click on a `NavLink` does not load a new page: the router changes the address with the browser's History API and swaps the component in the `<Outlet />`. The frame, the cache and the state stay where they are.

---

## C1.4 React from scratch

React draws the interface out of **components**. Five ideas cover almost everything in the code: components, JSX, props, state and effects. Hooks and context build on them.

**1. A component is a function that returns what to draw.**

```tsx
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  )
}
```

- **The name starts with a capital letter,** and the component is used like an HTML tag: `<PageHeader title="Plans" />`.
- **Components nest:** a page is made of smaller components, which are made of smaller ones. The whole app is one tree, starting from `<App />`.

**2. JSX is the HTML-like part.** It looks like HTML but it is JavaScript, turned into function calls by Vite. The differences that matter:

| In JSX | Why |
|---|---|
| `className="…"` instead of `class` | `class` is a reserved word in JavaScript |
| `{expression}` | Inserts any JavaScript value: `{title}`, `{t('nav.home')}`, `{count + 1}` |
| `{cond && <X />}` | Draws X only when `cond` is true (there is no `if` inside JSX) |
| `{cond ? <A /> : <B />}` | A or B |
| `{list.map(item => <Row key={item.id} … />)}` | One element per item; `key` is required and unique among siblings, so React can tell items apart when the list changes |
| `onClick={() => save()}` | Events: a function to call, not a string |
| `<>…</>` | A Fragment: groups elements without adding a `<div>` |
| `{/* comment */}` | A comment inside JSX |
| `<Icon />` | Every tag must be closed; tags without content close themselves |

**3. Props are a component's inputs.** They are the attributes written on the tag (`<PageHeader title="Plans" />`), and they arrive as one object. Our code takes the object apart in the parameter list: `({ title, description })`. An `interface` above the component lists them with their types. A component never changes its own props: it receives them from its parent. Whatever sits between the opening and closing tag arrives as the special prop `children`; `ThemeProvider` uses it.

**4. State is a component's memory.**

```tsx
const [theme, setTheme] = useState<Theme>('dark')
```

- **`useState` returns two things:** the current value, and a function that changes it.
- **Calling the setter makes React render again.** React calls the component function once more with the new value, and updates only the parts of the page that changed.
- **Never change state directly** (`theme = 'light'` does nothing visible). Always call the setter.
- **The new value appears on the next render, not in the current one.** After `setCount(count + 1)`, `count` is still the old value until React calls the component again.
- **Server data is not kept in state:** TanStack Query keeps it ([C1.6](#c16-server-data)).

**5. Effects run code after drawing.**

```tsx
useEffect(() => {
  applyTheme(theme)                                  // runs after each render where `theme` changed
  return () => { /* cleanup: undo what the effect set up */ }
}, [theme])                                           // the dependency list
```

- **When it runs:** after React has drawn the screen, and again whenever a value in the dependency list changes.
- **What it is for:** talking to the world outside React, such as the page's `<html>` element, timers, or browser events.
- **The cleanup** is the function the effect returns. React runs it before the next run and when the component disappears, so listeners and timers do not pile up.
- **Most code needs no effect.** Values computed from props or state are computed directly in the function body.

**Hooks** are the functions whose name starts with `use`. Some are React's (`useState`, `useEffect`, `useMemo`, `useContext`, `useId`), some come from libraries (`useTranslation`, `useQuery`, `useNavigate`), some are ours (`useTheme`, `useHealth`). They have two rules, which ESLint enforces:

- **Call them only at the top level of a component or of another hook.** Never inside an `if`, a loop, or an event handler. React tells hooks apart by the order of the calls, so the order must be the same on every render.
- **Give `useEffect` and `useMemo` the complete list of values they use.** A missing value means stale data.

**Context** shares a value with a whole part of the tree without passing it through every component's props:
- a **provider** puts the value in, as `<ThemeContext value={…}>` does in `ThemeProvider`;
- any component below reads it with `useContext`, wrapped in our own hook `useTheme()`.

`src/theme/` is the complete example. In React 19 the context itself is the provider; older code and tutorials write `<ThemeContext.Provider value={…}>`.

**Controlled components.** A form control does not keep its value by itself. React gives it the value and is told about every change, which the component then applies: `<Select value={theme} onValueChange={setTheme}>`. `LanguageSelect` and `ThemeSelect` work this way.

**Things that surprise newcomers:**

- **Everything in the component's body runs on every render,** so keep it cheap and free of side effects. Code that touches the outside world goes in effects or event handlers.
- **StrictMode runs components and effects twice in development** (`main.tsx`), on purpose, to expose code that is not safe to repeat. A `console.log` printed twice in development is expected. Production runs everything once.
- **Objects and functions created in the body are new on every render.** Handed to a context or a dependency list, they cause extra renders. `useMemo` keeps them the same (`ThemeProvider`).

**If you know Vue,** the same ideas map one to one:

| Vue | React |
|---|---|
| `v-if` / `v-for` | `{cond && …}` / `{list.map(…)}` |
| `:prop` / `@click` | `prop={…}` / `onClick={…}` |
| `ref()` | `useState` |
| `computed()` | a plain variable, or `useMemo` |
| `watch()` / `onMounted()` | `useEffect` |
| `provide` / `inject` | context |
| composables | hooks |
| `v-model` | `value` + `onChange` |
| `<router-view>` | `<Outlet />` |

---

## C1.5 Routing

- **The table** is `src/router.tsx`, made with `createBrowserRouter([...])`. A route has a `path` and an `element`. `children` nest routes inside a parent, which draws them at its `<Outlet />`. `index: true` marks the parent's own address.
- **The frames and the guards:** `AppLayout` is the parent of every signed-in page, inside the guard `RequireAuth`. The sign-in screens have `AuthLayout`, inside `RequireGuest` ([C1.13](#c113-signing-in-and-forms)). Workout mode, full screen, is a sibling of `AppLayout` inside `RequireAuth`: signed in, with no navigation around it ([C1.17](#c117-workout-mode)). The public shared plan, also full screen, will be a sibling of these branches. Comments in the file mark where.
- **Links:** use `<Link to="/plans">`. Use `<NavLink>` in navigation: it knows whether it is the current page and then gets `aria-current="page"`. Use `useNavigate()` to move in code, for example after saving.
- **Parameters:** a route `exercises/:id` gives the page `const { id } = useParams()`, a string: `Number(id)` for a number (`ExerciseDetailPage`). A plan's id is a UUID, and stays a string (`PlanDetailPage`). `plans/new` and `plans/:id/edit` open the plan editor (C1.16); `session/:id` a workout in progress (C1.17), `session/:id/summary` its summary, `progress/history/:id` a past workout (C1.19).
- **A tab stays lit on the pages under it:** `NavLink` is active on every address that *starts* with its own, so history lives at `/progress/history` and the Progress tab stays lit there (`end` turns this off, as Home's `/` needs).
- **The query string** (`?q=panca`) is read and written with `useSearchParams()` ([C1.14.3](#c1143-filters-in-the-address)): the library's filters, the plan list's view (`?archived=1`), a plan's open day (`?day=2`).
- **A fixed segment wins over a parameter:** `exercises/new` and `exercises/:id` can both exist, and `/exercises/new` opens the editor, whatever their order in the table.
- **Not found and crashes:** the last child, `path: '*'`, catches unknown addresses (`NotFoundPage`, inside the frame). `errorElement` (`RouteErrorPage`) replaces a screen that throws while rendering.
- **The full map** of planned routes is [D1.3](../design/D1-ui.md#d13-information-architecture-and-navigation). Each feature adds its routes there and here.

---

## C1.6 Server data

**`src/lib/http.ts`: the only door to the API.** `request<T>(path, { method, body, signal })` wraps `fetch` and:

- sends `Accept: application/json`, so Laravel answers errors as JSON, and `Accept-Language`, so it answers in the user's language;
- for `POST`, `PUT`, `PATCH` and `DELETE`, makes sure Sanctum's `XSRF-TOKEN` cookie exists (calling `/sanctum/csrf-cookie` if not) and sends it back in the `X-XSRF-TOKEN` header. That is Sanctum's CSRF protection;
- tries once more with a fresh cookie when the token has expired (a 419);
- turns every failure into an `ApiError`:
  - `status` is 0 when there was no answer (offline, server down), otherwise the HTTP status;
  - `fieldErrors` carries Laravel's validation messages for a 422, per field.

**TanStack Query: server data in components.** Server data is never copied into `useState`. Components ask the query cache:

```ts
const health = useQuery({ queryKey: ['health'], queryFn: ({ signal }) => fetchHealth(signal) })
// health.isPending · health.isError · health.data · health.refetch()
```

- The **query key** names a piece of data in the cache. Every component that uses the same key shares one request and one copy.
- **Freshness:** data younger than 30 seconds (`staleTime`, `query-client.ts`) is served from the cache without asking again. Older data is shown at once and refreshed in the background, also when the tab regains focus.
- **Retries:** a failed request is retried twice, but only for network and 5xx errors. A 401, 403, 404 or 422 would fail the same way again.
- **Changing data** uses `useMutation`, as in `src/api/auth.ts`. On success it calls `queryClient.invalidateQueries({ queryKey })`, so the lists that show that data reload.
- **A 401 on any request** means the session has ended: `src/lib/query-client.ts` marks the user as signed out, and the guards go to `/login` ([C1.13](#c113-signing-in-and-forms)).

**The `src/api/` pattern.** One file per API resource, holding:

1. the TypeScript types of what the endpoint returns;
2. its cache keys (`healthKeys`);
3. the plain function that calls it (`fetchHealth`);
4. the hooks components use (`useHealth`).

`health.ts` is the model to copy.

**Every component that reads server data handles three states:** loading (a skeleton, never a full-page spinner), error (a message and **Retry**), and success. `ServerStatus` shows all three ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)).

**Seeing the cache:** in development, the TanStack Query Devtools button (top-right corner) opens a panel. It lists every query, its key, state and data.

---

## C1.7 Translations

**No text is written in a component** ([D2.4](../design/D2-decisions.md#d24-languages)): every text comes from `src/i18n/locales/<language>.json` through `t()`:

```tsx
const { t, i18n } = useTranslation()
t('nav.plans')                          // "Schede" in Italian
t('preferences.languageHint', { weight })      // fills {{weight}} in the text
i18n.changeLanguage('de')               // switches every text at once
```

**The files** are nested by area, and the dotted key follows the nesting (`nav.plans` is `"nav": { "plans": … }`):

| Group | Holds |
|---|---|
| `app` | name, tagline |
| `nav` | navigation labels |
| `pages.<page>` | each page's `title` and `description` |
| `home`, `plans`, `exercises`, `progress`, `profile`, `auth` | each screen's own texts (empty states, greeting, sign-in forms…) |
| `common`, `preferences`, `theme`, `server` | texts shared by several components ("Coming soon"…) |
| `errors` | not-found and crash pages |

New screens add their own group (`plans.editor.*`, …).

**Safety nets:**

- **Typed keys.** `i18next.d.ts` gives TypeScript the shape of `en.json`. `t('nav.plan')`, a typo, is a type error, and VS Code autocompletes the keys.
- **Test.** `locales.test.ts` fails if a language misses a key, has an extra or empty one, or drops a `{{placeholder}}`.

**Adding a text:** add the key to all four files, English first, then `make fe-test`. A machine translation is fine for Spanish and German until someone checks them (the same rule as the exercise library, [D2.3](../design/D2-decisions.md#d23-exercise-library)).

**Numbers and dates** follow the language through `Intl`, never string concatenation. Use `src/lib/format.ts`: `formatWeight(82.5, i18n.language)` gives "82,5 kg" in Italian, Spanish and German, and "82.5 kg" in English. `formatLongDate` and `formatDayParts` do the same for dates ("giovedì 5 novembre"); add more there, such as durations, as screens need them.

**Markup inside a translation,** such as one highlighted word, uses `<Trans>`: the text holds a tag of our own (`"Ready to <hl>train</hl>?"`) and the component says what it becomes: `<Trans i18nKey="home.hero" components={{ hl: <span className="text-gradient-primary" /> }} />`. Each language places the tag on its own word.

**Plurals,** when a screen needs them, use i18next's suffixes: `"sets_one": "{{count}} set"` and `"sets_other": "{{count}} sets"`, called with `t('sets', { count })`.

**Adding a language:**

1. Add its code to `SUPPORTED_LANGUAGES` and `LANGUAGE_NAMES` (`languages.ts`).
2. Add `locales/<code>.json`.
3. Import it in `i18n/index.ts` and in the test.

---

## C1.8 Styles and theme

**Tailwind.** Styling is written as classes in the markup: `className="flex items-center gap-2 text-sm"`. A few rules:

- **Mobile first.** Unprefixed classes apply everywhere; `sm:` from 640 px, `lg:` from 1024 px. For example, `hidden sm:flex` means hidden on phones, shown from tablets. These are the breakpoints of [D1.7](../design/D1-ui.md#d17-responsive-layout-and-accessibility).
- **`dark:`** applies with the dark theme. It is rarely needed, because the tokens already change.
- **Arbitrary values** go in brackets when no class exists, for example `pb-[env(safe-area-inset-bottom)]` for the iPhone's home bar.
- **The VS Code extension "Tailwind CSS IntelliSense"** autocompletes classes and shows their CSS on hover. Worth installing.

**Colour tokens.** Never write a colour in a component; use the token's class. The values are in `src/index.css`, one set per theme, from [D1.5](../design/D1-ui.md#d15-design-system):

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

**The theme.**

- **How it is applied:** the `dark` class on `<html>` switches every token to its dark value. `index.html` sets it before React loads, and `ThemeProvider` keeps it in step with the user's choice. With "Same as the device" (`system`), it follows the operating system live.
- **Where the choice is saved:** on the account, so it follows the user, and in this browser (`localStorage`, key `atleoplan.theme`), so `index.html` can apply it before anything is drawn ([C1.13.4](#c1134-preferences-on-the-account)).
- **To read it from a component:** `useTheme()`. **To change it:** `useUpdatePreferences()` (`src/api/auth.ts`).

**shadcn/ui.** These are not a library imported from `node_modules`. They are source files copied into `src/components/ui/`, and they are ours to change.

- **Adding one:** `npx shadcn@latest add dialog` (from `frontend/`), then `make fix` to bring the generated file to our code style (single quotes, no semicolons).
- **Their default sizes are for mouse use** (a button is 32 px tall). On touch screens use our `size="xl"` (48 px) or set the height yourself: tap targets are at least 48 px, and 56 px in workout mode ([D1.5](../design/D1-ui.md#d15-design-system)).
- **`cn()`** (`@/lib/utils`) joins class names, drops false ones, and resolves Tailwind conflicts: `cn('px-2', big && 'px-4')`.
- **`asChild`** lends a component's look to its child: `<Button asChild><Link to="/">…</Link></Button>` is a real link that looks like a button.

**Our own style tools.** The energetic style of [D1.5](../design/D1-ui.md#d15-design-system) ("Visual style") is built from a few pieces, to reuse rather than reinvent:

| Tool | What it does | Example |
|---|---|---|
| `text-gradient-primary` (utility, `index.css`) | Paints text with the lime gradient | the highlighted word on Home |
| `glow-primary` (utility) | A soft lime halo around an element | the logo, the current tab |
| `border-glow` (utility) | A card background with a 1 px lime-to-transparent border | `EmptyState`, Home's week card, Profile's header |
| `Button size="xl"` | The 48 px main action, glowing when enabled | every call to action |
| `PageHeader eyebrow="…"` | The lime capitals above a page title | every page but Home |
| `EmptyState` | Illustration, title, sentence, actions; `comingSoon` adds the badge | Plans, Exercises, Progress, Home |
| `SettingRow` | One settings row: icon tile, label, hint, control | Profile |
| `WorkoutPreferences` | Profile's Workout card: the unit, the default rest, the weight step (Selects), the timer's sound and vibration (Switches) | Profile ([C1.13.4](#c1134-preferences-on-the-account)) |
| `BrandMark`, `Wordmark` | The logo | sidebar, phone header |

Utilities like these are written in `index.css` with `@utility name { … }` and then work like Tailwind's own classes, prefixes included (`lg:border-glow`, `group-aria-[current=page]:glow-primary`).

**Seeing the result.** Screen size changes the layout: test every change at phone width (the browser's device toolbar, about 390 px wide, [H3.8.1](../how-to/H3-frontend.md#h381-phone-tablet-and-desktop-widths)) and on a wide screen, in both themes (Profile → Theme).

**Icons** come from Lucide: `import { Dumbbell } from 'lucide-react'`, used as `<Dumbbell aria-hidden="true" className="size-5" />`.

- An icon next to a text is decoration: `aria-hidden`.
- An icon alone in a button needs a label ([P1.2](../project/P1-conventions.md#p12-code)).

---

## C1.9 Recipes

The short versions. [H3. Frontend: how to](../how-to/H3-frontend.md) builds a real page step by step: data from the API, a form, tests, translations, packages, the browser's tools and the common errors.

**A new page:**

1. `src/pages/ThingPage.tsx`, exporting `ThingPage`, with a `PageHeader` (with its `eyebrow`) and its content; while there is no data, an `EmptyState`.
2. Its texts under `pages.thing` in the four locale files.
3. A route in `src/router.tsx`, inside the frame's `children`.
4. If it is a main section: an entry in `components/layout/nav-items.ts`. Both navigations update.

**Data from a new endpoint:**

1. **Backend:** the route in `backend/routes/api.php`, and a Pest test.
2. **Frontend:** `src/api/thing.ts`, copying `health.ts`, with the type, the keys, `fetchThing`, and `useThing`.
3. In the component, `const thing = useThing()`, handling `isPending`, `isError` and `data`.

**A form that saves,** copying `src/pages/LoginPage.tsx` ([C1.13.3](#c1133-a-form-step-by-step)):

1. A zod schema for the rules, built by a function taking `t`, with its messages in the four locale files.
2. `useForm` with `zodResolver`, and a `FormField` per field.
3. `useMutation` in `src/api/`, calling `request(path, { method: 'POST', body })`, with `invalidateQueries` on success.
4. `showRequestError` in `onError`, and a `FormBanner` for `errors.root`.
5. A test with `fakeApi` and `userEvent`.

**A list with filters, pages and an editor,** copying the exercise library ([C1.14](#c114-the-exercise-library-screens)):

1. `useInfiniteQuery` in `src/api/`, with the language in the key and `placeholderData: keepPreviousData`.
2. The filters in the address with `useSearchParams` (`replace: true`), the search through `useDebouncedValue`.
3. The form's own shape in a plain file (`exercise-form.ts`), with the conversions to and from the API, tested alone.

**A new shared component:**

1. `src/components/Thing.tsx`, with a header comment, typed props, and doc comments.
2. If it holds logic worth checking, `Thing.test.tsx` next to it.

**Before calling it done:** `make fix`, then `make check`.

---

## C1.10 Tests and checks

- **Vitest** runs the tests. `jsdom` simulates a browser, so components can be rendered.
- **Testing Library** looks at the result the way a user would: `screen.getByRole('link', { name: 'Plans' })`. Query by role and visible text, never by CSS class. The test then also checks accessibility: if a test cannot find a button by its name, a screen reader cannot either.
- **Where they live:** next to the code (`*.test.ts(x)`). `src/test/setup.ts` runs first: it adds matchers such as `toBeInTheDocument()`, sets English, and cleans up after each test, including cookies, `localStorage` and a replaced `fetch`.
- **Screens that call the API** use a fake one ([C1.13.6](#c1136-testing-a-screen-with-the-api)).

**The tests so far:**

| File | What it checks |
|---|---|
| `i18n/locales.test.ts` | the four languages have the same keys and placeholders, none empty |
| `lib/format.test.ts` | weights, numbers and dates in each language's format |
| `lib/week.test.ts` | the Monday-to-Sunday week, across months and years |
| `components/layout/BottomTabBar.test.tsx` | five tabs, the current one marked, labels translated (the model of a component test) |
| `lib/http.test.ts` | what every request carries, how failures become an `ApiError`, the second try on an expired token |
| `api/auth.test.tsx` | a visitor is not an error, and two preference changes close together both survive |
| `routes/guards.test.tsx` | who is sent where, and a server that is down not being taken for signed out |
| `pages/auth-pages.test.tsx` | the four sign-in screens, used as a person would (the model of a form's test) |
| `pages/ProfilePage.test.tsx` | shows the account, signs out |
| `pages/ExercisesPage.test.tsx` | the library: rows, search after a pause, filters in the address and the request, pages, empty states, an error |
| `pages/ExerciseDetailPage.test.tsx` | an exercise's facts and photos, the owner's actions, deleting after a confirmation |
| `pages/ExerciseEditorPage.test.tsx` | creating and changing an exercise, the form's and the server's messages |
| `components/exercises/exercise-form.test.ts` | the editor's conversions and rules, without React |
| `pages/PlansPage.test.tsx` | the plan cards, the two views in the address and the request, the empty states, an error |
| `pages/PlanDetailPage.test.tsx` | a day's exercises summed up, the day tabs in the address, the weight unit, activate, archive, delete, a plan not found; starting a workout, resuming one, the message after Done |
| `components/plans/plan-format.test.ts` | the line that sums up an exercise, in two languages and two units; the supersets |
| `components/plans/plan-draft.test.ts` | the editor's draft without React: reading what is typed, to and from the API, the rules, every action of the reducer |
| `pages/PlanEditorPage.test.tsx` | creating from the library, saving with the version and the ids, the rules and the server's messages, the warning of a plan changed elsewhere, the draft kept and discarded, supersets, the number of days and its dialog, the two steps and Back between them, an exercise created from the picker |
| `components/workout/workout-session.test.ts` | the workout without React: starting from a day with last time's values, ticking, the rest, supersets, the clock with its pauses, the body sent |
| `lib/pending-sessions.test.ts` | the queue of finished workouts: what leaves it on each answer of the server, what stays |
| `pages/WorkoutPage.test.tsx` | workout mode used as a person would: a set ticked and kept on the phone, the rest timer, Next and the dots, ✕ pausing, Done sending, the network down |

**Commands:**

| What | Command |
|---|---|
| Tests once | `make fe-test` (`npm test` in `frontend/`) |
| Tests rerun on every save | `npm run test:watch` in `frontend/` |
| Lint / fix the style | `make lint` / `make fix` |
| Types | `make typecheck` |
| Everything, backend included | `make check` |

---

## C1.11 Known limits

- **Bundle size.** The production build is one JavaScript file of 921 kB (286 kB compressed) since workout mode, and Vite warns above 500 kB. The plan editor, with dnd-kit and the Dialog, is the first candidate for a page loaded only when opened. When the screens grow, load each page only when opened: `lazy` routes in React Router, which split the bundle per page.
- **A plan draft follows the unit of the moment.** An unsaved plan draft kept in the browser holds weights typed in the unit of then; after changing the unit (Profile) it is read in the new one. Rare, and not guarded ([C1.13.4](#c1134-preferences-on-the-account)).
- **A preference changed with no connection is not saved.** It stays on screen until the page reloads, then the account's value returns. Finished workouts already have a queue of their own ([C1.17.5](#c1175-the-queue-of-workouts-to-send)); preferences will join a general one with the offline work (FEAT-3).
- **Workout mode needs the app loaded.** A workout in progress lives on the phone and survives a reload, but with no network the app itself does not open yet: the PWA's offline cache comes with FEAT-3.
- **Not yet in place**, each with the feature that needs it:
  - the PWA and offline support (FEAT-3);
  - charts (phase 2).
- **`fsevents`'s install script** is blocked by npm's install-scripts guard. It is an optional macOS file watcher that Vite does not need. Leave it blocked.


---

## C1.12 JavaScript and TypeScript you will meet

The syntax used in the code, with where to see it. TypeScript is JavaScript plus **types**: labels saying what kind of value a variable holds. They are checked by `npm run typecheck` and in the editor, and removed when the code runs.

**JavaScript**

| Syntax | Meaning | Seen in |
|---|---|---|
| `import { A } from 'pkg'` | A **named** import: takes what the file exported as `A` | everywhere |
| `import A from './a'` | A **default** import: the file's one main export, named freely | `import i18n from '@/i18n'` |
| `import './index.css'` | Runs a file for its effect only | `main.tsx` |
| `export function X` / `export const Y` | Makes X, Y importable by other files | everywhere |
| `const x = 1` / `let y = 2` | A variable never reassigned / one that is. Prefer `const`. | |
| `(a, b) => a + b` | An **arrow function**: a short way to write a function | `onClick={() => …}` |
| `const { t } = useTranslation()` | **Destructuring**: takes properties out of an object by name | every component |
| `const [theme, setTheme] = useState()` | Destructuring an array: takes items by position | `ThemeProvider` |
| `{ ...props }` / `[...list]` | **Spread**: copies all properties or items into a new object or array | shadcn components |
| `` `nav.${key}` `` | **Template literal**: a string with values inserted | `BottomTabBar` |
| `a?.b` | **Optional chaining**: `undefined` instead of an error when `a` is null or undefined | `theme.ts` |
| `a ?? b` | **Nullish coalescing**: `a`, or `b` when `a` is null or undefined | `http.ts` |
| `cond ? a : b` | One of two values | JSX |
| `list.map(x => …)`, `.filter`, `.find`, `.includes` | Array methods: transform, keep some, find one, test membership | everywhere |
| `async function` / `await promise` | A **Promise** is a value that arrives later, such as a server's answer. `await` waits for it inside an `async` function. | `http.ts` |
| `void promise` | Starts something asynchronous without waiting for it (and tells ESLint that is on purpose) | `LanguageSelect` |
| `try { … } catch { … }` | Runs code and handles its errors | `theme.ts` |
| `class X extends Error` | A class; here, our own kind of error | `ApiError` |

**TypeScript**

| Syntax | Meaning | Seen in |
|---|---|---|
| `x: number`, `(a: string): boolean` | The type of a variable, a parameter, a return value | everywhere |
| `interface Props { title: string; description?: string }` | The shape of an object. `?` marks an optional field. | every component's props |
| `type Theme = 'dark' \| 'light'` | A named type; `\|` is a **union**: one of these | `theme.ts` |
| `Record<K, V>` | An object with keys of type K and values of type V | `LANGUAGE_NAMES` |
| `function f<T>(…): Promise<T>` | **Generics**: a type chosen by the caller, here the shape of the answer | `request<T>` in `http.ts` |
| `['it', 'en'] as const` | Keeps exact values (`'it' \| 'en'`) instead of just `string` | `languages.ts` |
| `(typeof LIST)[number]` | The type of the items of LIST | `Language`, `Theme` |
| `value is Language` | A **type guard**: when the function returns true, TypeScript knows `value` is a Language | `isLanguage` |
| `x as Theme` | Tells TypeScript the type of a value it cannot know (use sparingly) | `ThemeSelect` |
| `x!` | "Not null, trust me" (use sparingly) | `main.tsx` |
| `import type { X }` | Imports a type only; removed from the running code | `i18next.d.ts` |
| `.d.ts` file | Types only, no code; here it adds our types to a library's | `i18next.d.ts` |

**Learning more:** React's own tutorial at https://react.dev/learn (start with *Describing the UI* and *Adding Interactivity*); TypeScript's handbook at https://www.typescriptlang.org/docs/handbook/intro.html; modern JavaScript at https://javascript.info.

---

## C1.13 Signing in and forms

The React side of signing in. The server side, including the same steps written by hand, is in [C2.7](C2-backend.md#c27-signing-in-sanctum). The screens are described in [D1.4.1](../design/D1-ui.md#d141-sign-in-and-onboarding).

### C1.13.1 The one idea: who is signed in is server data

The app never keeps a "signed in" flag of its own. **Who is signed in is one piece of server data, in the TanStack Query cache,** under the key `authKeys.user` (`src/api/auth.ts`):

| Value in the cache | Means |
|---|---|
| `undefined` | Not known yet, or the server has not answered |
| `null` | A visitor: `GET /api/user` answered 401 |
| a `User` | Signed in |

Everything follows from this one value, by itself:

```
signing in  ──▶ asks GET /api/user ──▶ cache holds the User ──▶ RequireGuest moves into the app
signing out ──▶ cache holds null ─────────────────────────────▶ RequireAuth moves to /login
any 401     ──▶ cache holds null ─────────────────────────────▶ RequireAuth moves to /login
```

So the forms never navigate after signing in, and no screen has to handle a session that has expired. The last line is in `src/lib/query-client.ts`: any request answered with 401 sets the value to `null`.

**`fetchCurrentUser` treats errors differently, on purpose.** A 401 means "nobody", so it returns `null`. No connection, or a server error, stays an error: it says nothing about who is signed in, and must not send anyone to `/login`.

### C1.13.2 The guards

A **guard** is a parent route that decides whether its children may open (`src/routes/`). In `src/router.tsx`, nesting decides the order: guard, then frame, then page.

**`RequireAuth`, around the signed-in app,** has four outcomes:

| The cache says | It draws |
|---|---|
| Still waiting | Grey shapes ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)): drawing either the app or `/login` here would flash the wrong one |
| `null` | `<Navigate to="/login" />`, remembering the address in the router's `state` |
| Nothing, and the request failed | "Can't reach the server" and **Try again** |
| A `User` | `<Outlet />`, the app |

**`RequireGuest`, around the sign-in screens,** is the opposite: a signed-in user goes to the remembered address, or Home.

**A guard is not security.** Anyone can change the code running in their own browser. The protection is on the server, where `auth:sanctum` refuses the data; the guard only decides what to show.

### C1.13.3 A form, step by step

Every form is built from the same four pieces. `src/pages/LoginPage.tsx` is the model:

**1. The rules: a zod schema** (`src/pages/auth-schemas.ts`). It says what is valid and what to say otherwise. A function taking `t` gives messages in the current language, and the type of the values is derived from it, so the two cannot drift apart:

```ts
export function signInSchema(t: TFunction) {
  return z.object({
    email: z.email({ error: t('auth.errors.email') }),
    password: z.string().min(1, { error: t('auth.errors.required') }),
  })
}
export type SignInValues = z.infer<ReturnType<typeof signInSchema>>
```

**2. The fields: react-hook-form.** It holds the values and the errors, and checks the schema on submit:

```tsx
const form = useForm<SignInValues>({
  resolver: zodResolver(signInSchema(t)),
  defaultValues: { email: '', password: '' },
})

<form onSubmit={form.handleSubmit(onSubmit)} noValidate>
  <FormField label={t('auth.fields.email')} type="email"
    error={form.formState.errors.email?.message} {...form.register('email')} />
</form>
```

- `register('email')` returns what connects a field to the form (`name`, `ref`, `onChange`, `onBlur`), and the spread hands it all over.
- `handleSubmit` calls `onSubmit` only when the fields are valid.
- `noValidate` turns off the browser's own bubbles, which would appear in the browser's language.

**3. The request: a mutation** (`src/api/auth.ts`), TanStack Query's tool for requests that change something. It runs when `mutate` is called, and reports `isPending`, which disables the button:

```tsx
function onSubmit(values: SignInValues) {
  signIn.mutate(values, {
    onError: error => showRequestError(error, form.setError, ['email', 'password'], t),
  })
}
```

**4. What the server refuses: `showRequestError`** (`src/lib/form.ts`). A message about a field on the screen goes under it. Any other goes at the top of the form (`errors.root`, shown with `FormBanner`): no connection, too many tries, or an error on a field that is not visible, such as the email in the reset link.

**Why validate twice.** The browser's check is for speed and comfort, in the user's language. The server's is the real one, because a browser can be made to send anything. Keep their rules the same: `PASSWORD_MIN_LENGTH` here matches `Password::default()` there.

`FormField` (`src/components/FormField.tsx`) draws the label, the 48 px input and the error, linked for screen readers through `htmlFor`, `aria-invalid` and `aria-describedby`.

### C1.13.4 Preferences on the account

A choice made on the phone follows the user to the computer ([D1.4.14](../design/D1-ui.md#d1414-profile-and-settings)). Profile has two cards of them: **Preferences**, the language and the theme, and **Workout** (`WorkoutPreferences`), the five that workout mode reads. All seven are saved by the same hook, `useUpdatePreferences`, to the same endpoint, `PATCH /api/user/preferences`, one field per request ([C2.7](C2-backend.md#c27-signing-in-sanctum)). The data flows one way, around a circle:

```
LanguageSelect, ThemeSelect ──▶ useUpdatePreferences ──▶ the cache (at once) and the server
                                                              │
        i18next, ThemeProvider ◀── useAccountPreferences ◀────┘

WorkoutPreferences ──▶ useUpdatePreferences ──▶ the cache ──▶ workout mode reads the user (useCurrentUser)
```

The pickers only change the account, and `useAccountPreferences`, called by `RequireAuth`, applies the account to the page. A device with no saved choice therefore gets the account's as soon as it signs in. A visitor uses the browser's language, and whatever this browser last saved.

**An example of a real race, and how it was found.** Each save is a request, and two can be in flight together. The first version wrote each answer into the cache:

| Step | Language request | Theme request | Cache |
|---|---|---|---|
| 1. The user picks Italian, then Dark | sent | sent | `it`, dark |
| 2. The theme's request is handled first | not saved yet | answers: `de`, dark | **`de`**, dark |
| 3. The screen jumps back to German | | | |

The tests passed, because the fake API answered in order. A test in a real browser caught it. The fix follows TanStack Query's recommended pattern (`useUpdatePreferences`):

- the answer is never written into the cache, so the endpoint answers 204;
- `onMutate` cancels any read in flight, which could hold old values;
- `onSettled` reads from the server again, only when the last request has finished.

`src/api/auth.test.tsx` reproduces it, with one request held back. **The lesson for any optimistic update:** an answer can describe the past.

**The workout's six** (`components/WorkoutPreferences.tsx`, UI-7) need no `useAccountPreferences`: nothing outside React must be told, as i18next and the theme are. Workout mode and the plan editor read them from the cached user (`useCurrentUser()`), so a change shows at the next draw.

| Row | Control | Saved as | Read by |
|---|---|---|---|
| Weight unit | Select: Kilograms (kg), Pounds (lb) | `weight_unit` (with `weight_step`, below) | every weight on screen, and every weight typed ([D3.2.3](../design/D3-data-model.md#d323-weights-are-always-in-kilograms)) |
| Default rest | Select: No timer, 30 s … 5 min | `default_rest_seconds` (0 for no timer) | a workout started from then on, for exercises with no rest of their own |
| Weight step | Select: the plates of the unit (0.5 … 5 kg, 1 … 10 lb) | `weight_step`, as text with two decimals (`"1.25"`) | the big stepper's − and + ([C1.17.7](#c1177-the-big-stepper-and-the-exercises-menu)) |
| Sound, Vibration | Switch (`components/ui/switch.tsx`) | `timer_sound`, `timer_vibration` | the end of the rest, and a stopwatch's target (`lib/alarm.ts`, C1.17.8) |
| RPE in plans | Switch | `show_rpe` | the plan editor's RPE field ([C1.16.9](#c1169-set-types-and-the-rpe-field)) |

- **A Select's values are text.** The rest goes in as `String(90)` and comes back as `Number(value)`; the step is compared as `step.toFixed(2)`, the very text the account keeps (`"2.50"`). A value not in the list, saved some other way, is added to it (`withCurrent()`), so the Select always shows the account's value.
- **The unit comes with its step.** Changing the unit sends `{ weight_unit: 'lb', weight_step: '5.00' }` in one request: a step of 2.5 chosen in kilograms would mean 2.5 lb, too fine a step for most gyms.
- **Not while a workout is in progress.** A workout's fields hold weights as typed, in the unit of the moment (C1.17.3); read in another unit at Finish, 80 kg would become 80 lb. With a workout on the phone (`loadActiveSession()`), the unit's Select is disabled and its hint says why. The plan editor's unsaved drafts (`atleoplan.planDraft.…`) have the same weakness and no guard: changing the unit with an unsaved draft open on another tab reads it in the new unit ([C1.11](#c111-known-limits)).

### C1.13.5 Details that are easy to miss

- **`remember: true` is always sent.** A session lasts two hours, and a phone at the gym must not ask for a password. So there is no checkbox.
- **An expired CSRF token gets a second try** (`request()` in `src/lib/http.ts`): a 419 fetches a fresh cookie and sends the request once more, so a sign-in page left open for hours still works.
- **`Accept-Language`** on every request makes Laravel answer in the user's language ([C2.7.7](C2-backend.md#c277-messages-in-the-users-language)).
- **Signing out empties the cache,** except who is signed in, which becomes `null`: the next user on this device must not see this one's data.
- **`autoComplete`** on the fields (`username`, `current-password`, `new-password`) is what makes password managers work.

### C1.13.6 Testing a screen with the API

Tests never call a real server. `src/test/auth-helpers.tsx` gives them:

- **`fakeApi({ 'POST /api/auth/login': { status: 200, body: {} } })`** replaces `fetch` with a table of answers; a function as a value gives an answer that changes between calls. `'network'` fails as with no connection.
- **`renderRoutes(routes, '/login')`** draws routes with everything the app has around them, and a fresh cache each time.
- **`sentBody(fake, path)`** tells what was sent.

`src/pages/auth-pages.test.tsx` uses them with `userEvent`, typing and clicking as a person would. Prefer `findBy…`, which waits, when the element appears after an answer.

**What a fake API cannot catch** is anything about the real path: cookies, CSRF, the proxy, the order of answers. Before calling a feature done, try it in a browser against the real stack, as [C1.13.4](#c1134-preferences-on-the-account) shows.

---

## C1.14 The exercise library screens

The first feature screens of the app (UI-1, [D1.4.3](../design/D1-ui.md#d143-exercise-library)–[D1.4.5](../design/D1-ui.md#d145-exercise-editor)), on the API of [C2.5.4](C2-backend.md#c254-the-exercise-librarys-endpoints) and the 876 exercises imported from free-exercise-db. How they were built, with the real output: [H3.12](../how-to/H3-frontend.md#h312-the-exercise-library-screens-as-built).

### C1.14.1 The pages and their pieces

| Route | Page | Made of |
|---|---|---|
| `/exercises` | `ExercisesPage` | `ExerciseFilters`, `ExerciseListItem`, `EmptyState`; `useExercises()` |
| `/exercises/:id` | `ExerciseDetailPage` | `ExercisePhotos`, the facts as a description list, `AlertDialog` to confirm a delete; `useExercise()`, `useDeleteExercise()` |
| `/exercises/new`, `/exercises/:id/edit` | `ExerciseEditorPage` | `ExerciseForm`, with the rules and conversions of `exercise-form.ts`; `useCreateExercise()`, `useUpdateExercise()` |

**What is not here yet,** with the feature that brings it: "Add to plan" ([UI-3](../project/backlog.md#ui-3-add-to-plan-from-an-exercises-page)), the "My history" tab ([FEAT-7](../project/backlog.md#feat-7-an-exercises-own-history)), photo uploads, videos and "Duplicate as mine" (BE-1, `feat/exercise-media`), the buttons disabled offline (FEAT-3).

### C1.14.2 A list one page at a time

The library has 876 exercises; the API sends 50 per page ([C2.5.2](C2-backend.md#c252-lists-filters-and-pages)). `useExercises()` uses **`useInfiniteQuery`**, TanStack Query's hook for a list read in pages:

```ts
useInfiniteQuery({
  queryKey: exerciseKeys.list(filters, language),
  queryFn: ({ pageParam, signal }) => fetchExercisePage(filters, pageParam, signal),
  initialPageParam: 1,                                            // the first page read
  getNextPageParam: last => (last.meta.current_page < last.meta.last_page
    ? last.meta.current_page + 1 : undefined),                    // undefined: no more pages
  placeholderData: keepPreviousData,
})
```

- **`data.pages`** holds every page read so far; the page joins their rows with `pages.flatMap(page => page.data)`.
- **`fetchNextPage()`** reads the next one; `hasNextPage` says whether there is one. The page shows a **Show more** button rather than an endless scroll: the end of the page stays reachable, for the keyboard and the tab bar.
- **`placeholderData: keepPreviousData`** keeps the old list on screen while the list of new filters loads, with `isPlaceholderData` true; the page dims it. Without it every letter typed would flash a skeleton.
- **The language is part of every key** (`['exercises', 'list', 'it', {…}]`), because the names arrive translated: switching language reads the library again instead of showing Italian names to an English reader. `useMuscles()` and `useEquipment()` do the same.
- **After a change,** the mutations invalidate `['exercises']`: every list and every exercise, in every language, is marked old ([L2.13](../learn/L2-react.md#l213-changing-data-mutations)).

### C1.14.3 Filters in the address

The filters live in the address: `/exercises?q=panca&muscle=chest&source=mine`. React Router's **`useSearchParams()`** reads it and writes it, like `useState` for the query string:

```tsx
const [searchParams, setSearchParams] = useSearchParams()
const muscle = searchParams.get('muscle') ?? ''        // '' when the parameter is missing
setSearchParams(next, { replace: true })               // next: a URLSearchParams with the change
```

- **Why the address and not state:** the browser's Back returns to the list as it was, a reload keeps the filters, a filtered list can be bookmarked or shared.
- **`replace: true`** changes the current history entry instead of adding one: otherwise Back would undo the search one letter at a time.
- **A filter back to its default is removed** from the address, so the plain list is plain `/exercises`.
- **The search and the filters stay at the top** while the list scrolls: `sticky top-0` on the block that holds them all. From 640 px they fit in about 120 px (the search box, then one row of filters). On phones the filters are stacked and would take a quarter of the screen, so only the search box sticks there. The trick is `max-sm:contents` on the block: `display: contents` makes the browser draw the children as if the block were not there, so the block's own `sticky` does nothing, and the search box's `max-sm:sticky` takes over. The search box cannot simply be sticky *inside* the block, because a sticky element sticks only within its parent, and the block is short: the box would scroll away with it.
- **The search waits for a pause.** The box shows every letter at once (its value is in the address), but the request uses **`useDebouncedValue(search, 300)`** (`src/lib/useDebouncedValue.ts`): a value that follows another one 300 ms after it stops changing. Typing "panca" sends one request, not five.

### C1.14.4 The editor's form

The form's fields are shaped for the screen, not for the API:

| On screen | Sent to the API |
|---|---|
| Instructions: one text, a step per line | `instructions`: a list, blank lines dropped |
| Main muscle: a select; secondary muscles: ticks | `muscles`: one list of `{ id, role }`, the main one never repeated as secondary |
| Equipment: a select whose "None" is `''` | `equipment_id`: a number or `null` |
| Empty texts | `null`, which empties the field on the backend |

`toExerciseInput()` and `formValuesFrom()` (`exercise-form.ts`) convert one way and the other. They are plain functions, tested without drawing anything (`exercise-form.test.ts`). The tools new in this form:

- **Native selects** (`components/ui/native-select.tsx`) instead of Radix's: on a phone they open the system's own picker, they work with `register()` like an input, and tests use `userEvent.selectOptions()`.
- **`Controller`** connects a field that `register()` cannot, such as the list of ticks: it hands the render function `field.value` and `field.onChange`.
- **`useWatch({ control, name: 'primary_muscle' })`** re-renders the form when one field changes: the tick of the main muscle is disabled at once.
- **`mutateAsync`** instead of `mutate`: the form awaits the request, so `isSubmitting` covers it, and `catch` hands a 422 to `showRequestError`, which puts each message under its field. The form's field names are the backend's (`equipment_id`, `youtube_url`) for that reason.
- **Editing waits for the data,** then draws the form: `useForm()` reads `defaultValues` only once, when the form first appears.

### C1.14.5 Photos

The API sends each photo as a path on the app's own address, `/storage/12/0.jpg`. In development Vite forwards `/storage` to Laravel (`vite.config.ts`), in production Caddy; Laravel's `public/storage` is a link to `storage/app/public`, created by `make setup` (`storage:link`). Why a path and not a full URL: [C2.5.4](C2-backend.md#c254-the-exercise-librarys-endpoints).

- **In the list,** the first photo is the row's cover: `alt=""`, since the name next to it says the same, and `loading="lazy"`, so the browser downloads it only when the row comes near the screen.
- **On the page,** both photos side by side, each with an `alt` such as "Barbell Bench Press, photo 1".

### C1.14.6 Testing it

The library's tests use the helpers of [C1.13.6](#c1136-testing-a-screen-with-the-api), with three additions:

- **`fakeApi` with query strings.** `'GET /api/exercises'` answers every page and filter; an exact key, `'GET /api/exercises?page=2&per_page=50'`, answers one. The test then reads what was asked from `fake.mock.calls`.
- **`sentBody(fake, path)`** gives the first call to `path` **that sent a body**: the editor first reads an exercise (GET), then saves it (PATCH).
- **`ResizeObserver`** does not exist in jsdom, and Radix's Checkbox needs it: `src/test/setup.ts` gives the tests one that does nothing.
- **`src/test/exercise-helpers.ts`** builds exercises and pages shaped as the API sends them.


## C1.15 The plan screens

The plan list and a plan's page (the second part of FEAT-2, [D1.4.6](../design/D1-ui.md#d146-plan-list) and [D1.4.7](../design/D1-ui.md#d147-plan-details)), on the API of [C2.5.5](C2-backend.md#c255-the-plans-endpoints). **New plan** and **Edit** open the plan editor ([C1.16](#c116-the-plan-editor)); `make plans-demo` gives every user two example plans to look at. How the screens were built, with the real output: [H3.13](../how-to/H3-frontend.md#h313-the-plan-screens-as-built).

### C1.15.1 The pages and their pieces

| Route | Page | Made of |
|---|---|---|
| `/plans`, `/plans?archived=1` | `PlansPage` | `PlanCard`, `EmptyState`, `ComingSoon`, `ImportPlanButton` (C1.15.6); `usePlans()`, `useImportPlan()` |
| `/plans/:id`, `/plans/:id?day=2` | `PlanDetailPage` | `Tabs` (one per day), `PlanDayView` → `PlanItemRow`, `AlertDialog` to confirm a delete, `ExportPlanButton` (C1.15.6); `usePlan()`, `usePlanAction()`, `useDeletePlan()`, `useCurrentUser()` for the weight unit and the default rest |

```
PlanDetailPage                 the plan: header, badges, actions, notes
└── Tabs                       one tab per day, the open one from ?day=
    └── PlanDayView            "3 exercises · 7 sets", then the runs of groupSupersets()
        ├── PlanItemRow        a lone exercise
        └── <section>          a superset: a lime bar, its label, and a PlanItemRow per exercise
```

**Since then:** "Start this day" came with workout mode ([C1.17](#c117-workout-mode)), and each card says when the plan was last used, "Used 3 days ago" or "Never used yet": `last_used_at` of the list ([C2.5.5](C2-backend.md#c255-the-plans-endpoints)), written by `formatDaysAgo()` (`lib/format.ts`), which counts calendar days in the device's time zone and lets `Intl.RelativeTimeFormat` say them in each language ("ieri", "vor 3 Tagen").

**What is not here yet:** Templates, Share, Duplicate and the Shared badge (phase 2).

### C1.15.2 One line per exercise

[D1.4.7](../design/D1-ui.md#d147-plan-details) asks for each exercise as one line: "4 × 8–10 · 90 s", the warm-ups apart, "+ 2 warm-up". The API sends the sets one by one ([C2.5.5](C2-backend.md#c255-the-plans-endpoints)), so the line is worked out in the browser, by `itemSummary()` in `components/plans/plan-format.ts`:

| The sets | The line, in English |
|---|---|
| 2 warm-ups, then 4 × 8–10 at 80 kg, 90 s rest | `4 × 8–10 · 80 kg · 90 sec` and `+ 2 warm-up` |
| 10, 8 and 6 reps at 60, 65, 70 kg (a pyramid) | `3 × 10/8/6 · 60–70 kg · 90 sec` |
| 3 sets to failure, no target, 120 s rest | `3 sets · 2 min` |
| A plank of 60 s (logged by time) | `1 × 1 min · 90 sec` |
| 8–10 at 82.5 kg, RPE 8.5, for a reader in pounds | `1 × 8–10 · 181.88 lb · RPE 8.5 · 90 sec`; in Italian `1 × 8–10 · 181,88 lb · RPE 8,5 · 90 s` |

- **Plain functions, not components.** `plan-format.ts` takes data and gives text, so `plan-format.test.ts` tests every case above without drawing anything, and `PlanItemRow` stays short. The translate function is a parameter, `t`, for the few words ("sets", "max", "RPE").
- **Warm-ups never count** in the line or in the day's "7 sets" ([D2.8](../design/D2-decisions.md#d28-workout-rules)): `workingSets()` leaves them out.
- **Units come from `Intl`.** `formatSeconds()` and `formatDistance()` use `Intl.NumberFormat` with `style: 'unit'`, so each language writes its own: "90 s" in Italian and Spanish, "90 sec" in English, "90 Sek." in German. The weight is converted to the user's unit (`weightIn()`, 1 lb = 0.45359237 kg) and written by `formatWeight()` ([C1.7](#c17-translations)).
- **The user's settings:** an exercise without its own rest shows the user's `default_rest_seconds`; the weights follow `weight_unit`. Both come from `useCurrentUser()`, already in the cache.
- **Supersets:** `groupSupersets()` splits a day's exercises into runs, keeping the order: neighbours with the same `superset_group` form one run, every other exercise is a run of its own. The backend guarantees the neighbours ([C2.5.6](C2-backend.md#c256-validating-nested-data)), so a run is the whole superset. On screen a run is a `<section aria-label="Superset">` with a lime bar on its left: the label is there for screen readers, which cannot see the bar.

### C1.15.3 Tabs whose state is in the address

A plan's days are tabs (`components/ui/tabs.tsx`, Radix's Tabs through shadcn/ui). Radix gives what tabs need for keyboards and screen readers: the roles `tablist`, `tab` and `tabpanel`, the arrow keys between tabs, only the open panel drawn.

The open tab is **controlled** by the page, and kept in the address, as the library's filters are ([C1.14.3](#c1143-filters-in-the-address)):

```tsx
const requested = Number(searchParams.get('day') ?? '1')            // ?day=2, from 1
const dayIndex = Number.isInteger(requested) && requested >= 1 && requested <= plan.days.length
  ? requested - 1 : 0                                               // anything else: the first day

<Tabs value={String(dayIndex)} onValueChange={value => setSearchParams({ day: String(Number(value) + 1) }, { replace: true })}>
```

- **Controlled** means `value` comes from the page and `onValueChange` reports a click: Radix never decides alone. Uncontrolled (`defaultValue`) would be simpler, and would forget the day on a reload.
- **Why the address:** opening an exercise from day B and pressing Back returns to day B.
- **A value from the address is never trusted:** `?day=9` on a plan of three days opens the first day, rather than a tab bar with nothing selected. A test checks it.
- **On a phone** six day tabs do not fit: their row scrolls sideways (`overflow-x-auto`), and each tab is 48 px tall, the smallest a finger hits reliably ([D1.5](../design/D1-ui.md#d15-design-system)).

### C1.15.4 Actions on a plan

Set as active, Archive and Restore are each a `POST` to the plan's address plus a verb (`/api/plans/{id}/activate`). They differ only in the verb, so one hook serves all three:

```ts
const action = usePlanAction(plan.id)
action.mutate('activate')          // or 'archive', 'unarchive'
```

- **Afterwards every plan is read again** (`invalidateQueries({ queryKey: ['plans'] })`), not only this one: making a plan active takes the Active badge from the one before, and archiving moves a plan from one list to the other. The page then shows what the server says, with no state of its own to keep in step.
- **Which buttons show** depends on the plan: an archived plan offers Restore and not Set as active, since the backend refuses to activate it (`PlanPolicy::activate`).
- **Delete** asks first, in an `AlertDialog`, as for an exercise ([C1.14](#c114-the-exercise-library-screens)); afterwards the cached copies of the plan are removed, and the app opens the list with `replace: true`, so Back does not return to a plan that is gone.
- **A failed action** shows a banner under the buttons, `role="alert"`; the plan on screen stays as it was.

### C1.15.5 Testing it

The tests use the helpers of [C1.13.6](#c1136-testing-a-screen-with-the-api) and `src/test/plan-helpers.ts`, which builds plans shaped as the API sends them: `testPlan()` has two days, the first with a bench press (two warm-ups, four working sets) and a superset of two exercises.

- **An answer that changes after an action.** `fakeApi` accepts a function as an answer, called on every request. Setting a plan active is tested with a variable that the `POST` changes, and the next `GET` reads:

```ts
let active = false
fakeApi({
  'GET /api/plans/plan-ppl': () => planAnswer({ is_active: active }),
  'POST /api/plans/plan-ppl/activate': () => { active = true; return { status: 200, body: { data: {} } } },
})
```

  The test then finds the Active badge, which proves the page read the plan again after the action.
- **`GET /api/user`** is in the table of the plan page's tests, since the page asks for the user's unit; one test answers with `weight_unit: 'lb'`.


### C1.15.6 A plan as a file: export and import

**Export**, on a plan's page (`ExportPlanButton`), and **Import plan**, on the list (`ImportPlanButton`), both in `components/plans/`; the file's shape is [D3.5.8](../design/D3-data-model.md#d358-the-plan-file), the endpoints [C2.5.8](C2-backend.md#c258-a-plan-as-a-file).

**Saving a file from the browser** (`lib/download.ts`, `downloadJson()`): the JSON text goes into a **Blob**, a file held in memory; `URL.createObjectURL(blob)` gives it an address, `blob:…`; a link made by the code, with that address and `download="push-pull-legs.atleoplan.json"`, is clicked, and the browser saves instead of opening. `URL.revokeObjectURL()` frees the memory. No mutation and no cache: `fetchPlanFile(id)` asks for the file when the button is tapped. `fileNameOf()` makes the plan's name safe for a file.

**Import plan is a window in three steps** (`ImportPlanButton`, a controlled `Dialog`), so that nothing is sent by surprise: what file it wants and what will happen; **Choose the file**; the preview and **Import**. Closing the window forgets the file (`changeOpen(false)`).

**Choosing a file** is the browser's own picker, an `<input type="file" accept=".json,application/json">`, hidden (`className="hidden"`), which the button clicks through a ref (`input.current?.click()`).

**A first look in the browser** (`components/plans/plan-file.ts`, plain functions): `readPlanFile(text, bytes)` answers either the content with a summary, or the problem, each said in its own words.

```ts
const reading = readPlanFile(text, file.size)
if (reading.ok) setChosen({ fileName: file.name, summary: reading.summary, content: reading.content })
else setError(t(`plans.import.problems.${reading.problem}`))   // tooBig, notJson, notPlan, newer
```

| Problem | When |
|---|---|
| `tooBig` | Over 1 MB (`MAX_PLAN_FILE_BYTES`), from `file.size` alone: the file is not even read. The largest plan the rules allow is about a third of it |
| `notJson` | `JSON.parse()` throws |
| `notPlan` | Not an object with `format: "atleoplan.plan"`, a version 1, a plan with a name and days that are objects with a list of items |
| `newer` | Our format, a version above the one this app reads: "update the app" |

- **The result is a discriminated union,** `{ ok: true, content, summary } | { ok: false, problem }`: after `if (reading.ok)` TypeScript knows which fields are there. `isObject()` is a **type guard**: its return type, `value is Record<string, unknown>`, tells TypeScript what the value is when it returns true, so `content.format` can be read.
- **Only a first look:** the backend checks every field (`ImportPlanRequest`), and stays the one that decides. A 422 after Import says the file "looks like a plan, but holds values that are not valid: it may have been edited by hand"; any other failure says "try again".
- **`event.target.value = ''`** empties the input after each choice: choosing the same file again, after an error, fires `change` again.
- **The new plan's page says what happened,** from the history entry's `state`, as the editor's save does with `changedElsewhere` (C1.16.5): "Plan imported. 2 exercises were missing and are now among yours: Frog stand, L-sit." The text has a plural (`plans.import.created_one`, `_other`, from `count`).
- **The library is read again** when exercises were created (`invalidateQueries({ queryKey: exerciseKeys.all })`), with the plans.

**Testing it.** `PlanDetailPage.test.tsx`: jsdom saves no file and has no `URL.createObjectURL`; the test gives one that keeps the Blob, and replaces every link's `click()` with `vi.spyOn(HTMLAnchorElement.prototype, 'click')`; `click.mock.contexts[0]` is the link it was called on, whose `download` and `href` are checked, and the Blob's text is the file. `PlansPage.test.tsx`: the window's text, then `user.upload(input, new File([…], 'plan.json'))`, which chooses a file as the picker does (it honours `accept`, so a file named `.csv` would never arrive); the preview, and no request until Import; the problems said in the window with nothing sent, then a 422. `plan-file.test.ts`: the summary, and each problem. `vi.restoreAllMocks()` after each test puts the spied method back.

## C1.16 The plan editor

The last part of FEAT-2 ([D1.4.8](../design/D1-ui.md#d148-plan-editor)), at `/plans/new` and `/plans/:id/edit`, on `POST` and `PUT /api/plans` ([C2.5.5](C2-backend.md#c255-the-plans-endpoints)). It is the app's largest screen: a tree of days, exercises and sets, each changed in many ways, saved in one request. How it was built, with the real output: [H3.14](../how-to/H3-frontend.md#h314-the-plan-editor-as-built).

### C1.16.1 The pieces

```
PlanEditorPage            /plans/new: an empty draft; /plans/:id/edit: reads the plan, makes a draft of it
└── PlanEditor            the draft (useReducer), kept in the browser; the sticky Save / Discard bar;
    │                     which of the two steps shows, from ?day= (C1.16.7)
    ├── EditorOverview    step 1: name, goal, notes; the number of days and their names;
    │                     the dialog before removing days with exercises; "Next: the exercises"
    └── EditorDays        step 2: "Back to the plan's details"; the days as tabs
        └── EditorDay     the open tab: drag and drop (dnd-kit); "Add exercises" (ExercisePicker);
            │             "Make a superset"
            ├── EditorItem    an exercise: drag handle, summary line; open: "As fast as possible" (C1.17.9), its sets, rest, notes,
            │   │             move to another day, leave the superset, remove
            │   └── EditorSet a set: its number, opening the list of types (SetTypeSelect: W, D, F);
            │                 its targets, RPE only when wanted (C1.16.9); remove
            └── ExercisePicker the library in a Dialog, a tick box on each row, "Add (n)";
                               "Create «…»": the exercise editor's form in the window (C1.16.8)
```

| File | Holds |
|---|---|
| `components/plans/plan-draft.ts` | The draft's types, the conversions to and from the API, the rules, the reducer: no React |
| `components/plans/draft-storage.ts` | Keeping the draft in the browser |
| `components/plans/editor/*.tsx` | The components above |
| `components/ui/dialog.tsx` | shadcn/ui's Dialog, for the exercise picker |
| `components/plans/SetTypeSelect.tsx` | The set's number and its list of types, shared with workout mode (C1.16.9) |
| `api/plans.ts` | `useCreatePlan()`, `useUpdatePlan(id)`, and the types of the body (`PlanInput`) |

**What is not here,** with where it went: the desktop layout of D1.4.8, the library in a column beside the plan with exercises dragged across ([UI-2](../project/backlog.md#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan)); "Add to plan" from an exercise's page ([UI-3](../project/backlog.md#ui-3-add-to-plan-from-an-exercises-page)). On every width, exercises come from the picker window.

### C1.16.2 The draft and its reducer

The exercise editor is a form of fields side by side, and react-hook-form fits it ([C1.14.4](#c1144-the-editors-form)). A plan is a tree: a day holds exercises, an exercise holds sets, and the changes are not only typing. A set's type changes, an exercise moves to another day, two exercises join a superset, a drag reorders a list. These are written as **actions** handled by one function, the **reducer**, with React's **`useReducer`**:

```tsx
const [draft, dispatch] = useReducer(draftReducer, initial)

dispatch({ type: 'setSetType', day: 0, item: 1, set: 2, setType: 'drop' })  // set 3's type, from the list
dispatch({ type: 'moveItem', day: 0, from: 3, to: 0 })           // the end of a drag
```

- **`useReducer(reducer, first)`** is `useState` for state that changes in many named ways. `dispatch(action)` asks React to call `draftReducer(draft, action)` and draw again with what it returns.
- **The reducer is a plain function** in `plan-draft.ts`, with no React, so `plan-draft.test.ts` runs every action on a draft and checks the result, without drawing anything. 17 tests do so.
- **It never changes the draft it is given.** React notices a change only when it receives a new object, so the reducer copies the draft first, with **`structuredClone()`**, the browser's deep copy, then changes the copy. The draft before stays as it was, which makes "Discard changes" a simple `dispatch({ type: 'replace', draft: initial })`.
- **The actions are a discriminated union** (`DraftAction`): each is an object whose `type` names it, and inside `case 'moveItem':` TypeScript knows the action has `from` and `to`. A misspelt action type is a type error, not a silent no-op.
- **The components hold no copy of the plan.** `EditorDay`, `EditorItem` and `EditorSet` receive their piece and `dispatch`, and send actions with their indexes (`{ day, item, set }`).
- **The draft is text, like a form.** Each target is the text typed, `"8-10"` or `"82,5"`, in the user's unit and with their decimal comma. `toPlanInput()` reads it when saving: reps into `target_reps_min` and `target_reps_max`, pounds into kilograms with three decimals (135 lb → 61.235 kg, [D3.2.3](../design/D3-data-model.md#d323-weights-are-always-in-kilograms)), only the targets that fit how the exercise is logged. `draftFromPlan()` does the opposite.
- **Supersets stay valid by themselves.** After every action the reducer runs `normalizeSupersets()` on each day: an exercise dragged away from its superset leaves it, a superset left with one exercise ends, the numbers become 1, 2, 3. The backend accepts only neighbours ([C2.5.6](C2-backend.md#c256-validating-nested-data)), and the editor can never send anything else.
- **New rows get their UUID in the browser** (`newId()`: `crypto.randomUUID()`, or the same kind of UUID built from `crypto.getRandomValues()` where the browser lacks it, [H3.18.1](../how-to/H3-frontend.md#h3181-start-without-https-a-uuid-by-hand)), as [D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id) asks; saved rows keep theirs, so sessions of FEAT-3 stay linked.

### C1.16.3 Drag and drop with dnd-kit

The exercises of a day are reordered by dragging their handle, with **dnd-kit** ([D2.2](../design/D2-decisions.md#d22-stack)): `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` and `@dnd-kit/modifiers`.

```tsx
<DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
  <SortableContext items={day.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
    {day.items.map(item => <EditorItem key={item.id} item={item} … />)}
  </SortableContext>
</DndContext>
```

```tsx
// In EditorItem
const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
<li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
  <button {...attributes} {...listeners} aria-label="Move Barbell Bench Press">⋮⋮</button>
```

- **`DndContext`** watches drags; **`SortableContext`** knows the list's order, by the items' ids; **`useSortable()`** makes one row draggable. Only the handle gets `listeners`, so the rest of the row can be tapped to open it, and the page can still be scrolled with a finger.
- **Sensors** decide how a drag starts: `PointerSensor` for a mouse or a finger, once it has moved 5 px (a tap is not a drag); `KeyboardSensor` for space or enter on the handle, then the arrow keys, then space again. `touch-none` on the handle keeps the browser from scrolling during a drag.
- **While dragging, nothing changes in the draft:** dnd-kit only moves the row on screen, with a CSS `transform`. When the drag ends, `onDragEnd` sends one action, `moveItem`, and the reducer does the rest.
- **Screen readers hear the drag** ("Picked up Barbell Bench Press. … dropped at position 1 of 4."). dnd-kit's own texts are English; `accessibility.announcements` and `screenReaderInstructions` give them in the user's language.
- **Exercises move to another day** with a list, inside the opened exercise: one tap, the same with a keyboard. **Days are not reordered** on screen: the number of days adds or removes them at the end (C1.16.7). The reducer still has `moveDay`, with its test, should the order come back.

### C1.16.4 The draft kept in the browser

D1.4.8 asks that the draft be saved automatically. After every change, an effect writes it to the browser's **`localStorage`**, under `atleoplan.planDraft.<plan id>`, or `…new` for a plan being created (`draft-storage.ts`):

```tsx
useEffect(() => {
  if (dirty) storeDraft(storageKey, draft)
  else clearDraft(storageKey)
}, [draft, dirty, storageKey])
```

- **Opening the editor again** brings the draft back, with a banner that says so; **Discard changes** returns to the plan as it was opened and forgets the draft; **a save** forgets it too.
- **`dirty`** compares the draft with the plan as opened, both turned into text with `JSON.stringify`: the simplest way to compare two trees of objects.
- **`localStorage`, not IndexedDB.** [D3.5.6](../design/D3-data-model.md#d356-saving-a-plan) names IndexedDB for drafts; it comes with the offline work of FEAT-3, which needs a database in the browser for much more. A draft is a few kilobytes of JSON, and `localStorage` holds it with three lines of code.
- **Every access is in `try`/`catch`:** a private window, or storage full, throws, and the editor must still work, only without keeping the draft.
- **A draft follows the browser, not the account:** started on the phone, it is not on the laptop. A saved plan is.

### C1.16.5 Saving

**Save** runs, in order:

1. **`validateDraft()`**, the backend's rules ([C2.5.6](C2-backend.md#c256-validating-nested-data)) checked in the browser: a name, reps as `8` or `8-10` from 1 to 999, an RPE from 1 to 10 with one decimal, a rest up to an hour… It returns a translation key per wrong field, by the field's path in the draft: `days.0.items.1.sets.2.reps`. With any error, nothing is sent: the fields turn red, a banner says so, and the step with the error opens: the first for the name or a day's name, otherwise the second, on the tab of the first day whose exercises have one. That tab, and any other day's with an error, carries a red dot (C1.16.7).
2. **`toPlanInput()`** builds the body, and `useCreatePlan()` sends it with `POST`, or `useUpdatePlan(id)` with `PUT` and the `version` the editor started from.
3. **A 422 from the server** carries Laravel's field names: `draftField()` turns `days.0.items.1.sets.2.target_reps_max` into `days.0.items.1.sets.2.reps`, the same indexes, since the order is the position. The message appears under that field, as the editor's own would.
4. **Success** forgets the kept draft and opens the plan's page, replacing the editor in the history (`replace: true`; from the second step, after one step back first, C1.16.7). On a `PUT`, the answer's `meta.changed_elsewhere` travels with the navigation, in its **`state`**:

```tsx
navigate(`/plans/${plan.id}`, { replace: true, state: { changedElsewhere: true } })
// On the plan's page
const saved = useLocation().state as PlanSavedState | null
```

  The plan's page then shows "This plan was changed somewhere else in the meantime. Your version was saved over it." ([D3.5.7](../design/D3-data-model.md#d357-when-a-plan-is-changed-in-two-places)). The state lives with that history entry only: a reload of the page does not show the warning again.

**One Save button.** The Save and Discard bar sticks to the top of the screen while a long plan scrolls (`sticky top-0`, as the library's search, [C1.14.3](#c1143-filters-in-the-address)), so Save is always in reach and there is one of each button.

### C1.16.6 Testing it

- **The draft without React** (`plan-draft.test.ts`): `run(draft, action1, action2…)` applies actions in turn with `actions.reduce(draftReducer, draft)`, then the test reads the result.
- **The page** (`PlanEditorPage.test.tsx`) is used as a person would: it types, opens the picker (`findByRole('dialog', { name: 'Add exercises' })`), ticks, taps a set's number, saves; then `sentBody(fake, '/api/plans')` gives the body sent, compared with what the backend expects.
- **The draft kept between visits:** the test draws the editor, types, calls `unmount()` (the editor disappears, as when leaving the page), draws it again, and finds the change and the banner. `src/test/setup.ts` empties `localStorage` after each test.
- **Dragging is not drawn in tests:** jsdom has no layout, so the positions dnd-kit measures are all zero. What a drag does, `moveItem`, is tested in the reducer; the drag itself is checked in the browser ([H3.14.8](../how-to/H3-frontend.md#h3148-checking-in-the-browser)).
- **The history's Back** is the router's: `await act(() => router.navigate(-1))` is the phone's button, and `router.state.location.search` tells which step and tab are open (C1.16.7). A native select is changed with `user.selectOptions(select, '3')`; the dialog is found by its role, `alertdialog`.

### C1.16.7 Two steps, one draft

The editor was first one page: the plan's fields, the days as tabs with "Add day", and above each day's exercises its name, move and delete. Three levels on one long page, the exercises far down on a phone. It is now two steps on the same draft ([D1.4.8](../design/D1-ui.md#d148-plan-editor)): first the plan's details with the number of days and their names (`EditorOverview`), then the days as tabs with their exercises (`EditorDays`).

**Which step shows is in the address,** as the plan page's open tab is ([C1.15](#c115-the-plan-screens)): no `?day=` is the first step, `?day=2` the second with the second day's tab open. `PlanEditor` reads it with `useSearchParams()` and draws one step or the other:

```tsx
const requested = Number(searchParams.get('day'))
const openDay = searchParams.has('day') && Number.isInteger(requested) && requested >= 1 && requested <= draft.days.length ? requested - 1 : null

{openDay === null ? <EditorOverview … onNext={() => goToDay(0)} /> : <EditorDays openDay={openDay} onOpenDay={goToDay} … />}
```

- **The steps are not routes.** Both are drawn by `PlanEditor`, which stays on the page: the draft, the errors and a save in progress are not lost between them.
- **A value from the address is not trusted:** `?day=9`, or a day that a Discard removed, shows the first step.
- **Each step starts at the top:** every change of `?day=` is a new history entry, and `<ScrollRestoration />`, drawn once by the frame (`AppLayout`), is React Router's component that scrolls a new entry to the top and puts an entry gone back to where it was.

**The number of days** is a native select, 1 to 14 (`LIMITS.days`, the backend's limit). More days dispatches `addDay` once per new day, named with the next letters (`dayLetter()` in `plan-draft.ts`: "Day C", "Day D"); fewer dispatches `removeDay` for the last ones, from the last down, so each index still names the day it meant. When a day to remove has exercises, the change waits in `pendingCount` and an `AlertDialog` asks first; its `open` is controlled by that state (`open={pendingCount !== null}`), not by a trigger button as on the plan's page. Removing only from the end keeps the select simple; the price is that a day in the middle cannot be removed, nor the days reordered.

**Back goes to the first step, whatever the way out.** A phone's Back button, a mouse's, the browser's: all walk the history. The editor arranges the entries so that each lands on the details:

| Action | History (newest last) | How |
|---|---|---|
| Open the editor | … · details | |
| **Next: the exercises** | … · details · Day A | `setSearchParams({ day: '1' }, { state: { fromPlan: true } })`: a new entry |
| The tab of Day B | … · details · Day B | the same with `replace: true`: Day B takes Day A's place |
| Back, or **Back to the plan's details** | … · details | `navigate(-1)`, since `state.fromPlan` says the entry before is the details |

The `state` is a second, invisible part of a history entry ([C1.16.5](#c1165-saving)). A tab opened another way, a reload or a link to `?day=2`, has none, and **Back to the plan's details** then replaces the entry (`setSearchParams({}, { replace: true })`) instead of leaving the editor.

**Saving from the second step.** The plan's page replaces the editor's entry, so Back from it does not return to the editor. In the second step the editor's entries are two (details, exercises), and replacing only the last would leave the first. So the editor first steps back, then saves over the first step's entry:

```tsx
if (openDay !== null && fromPlan) await navigate(-1)
onSaved(saved)   // navigate(`/plans/${id}`, { replace: true, … })
```

`await` matters: with the app's router (`createBrowserRouter`), `navigate(-1)` returns a Promise that ends once the browser has gone back. Without it, the replace would land on the exercises' entry before the step back, and the back would then reopen the editor.

**One lime button at a time** ([H3.15.10](../how-to/H3-frontend.md#h31510-fourth-pass-looking-at-the-screen-for-real)): in the first step the way on is **Next: the exercises**, so Save (or **Create plan**) is outlined there (`variant="outline"`), and lime again in the second.

**Errors go to their step** (`showErrors` in `PlanEditor`): a path matching `/^days\.(\d+)\.items\./` belongs to a day's exercises, any other (the name, a day's name) to the first step. The first step wins when both have one, since its fields are fewer and come first. In the second step a day's tab carries a red dot when its exercises have an error.

### C1.16.8 Creating an exercise from the picker

A plan written from paper meets exercises the library does not have, or has under another name. After a search, the picker shows **Create «…»** under the list, whether it found something or not (the "ponte" of a plan may be the full bridge, while the library finds glute bridges). It opens the exercise editor's form inside the same window, the search as the name; the exercise is created as the user's own (`POST /api/exercises`, `useCreateExercise()`), and goes into the day with the exercises already ticked, the window closing as Add does. When swapping in workout mode, it is the exercise chosen.

```tsx
<ExerciseForm
  defaultValues={emptyFormValues(typed)}
  save={create.mutateAsync}
  onSaved={exercise => onAdd(replacing ? [exercise] : [...chosen, exercise])}
  submitLabel={t('exercises.editor.create')}
  onCancel={() => onCreatingChange(false)}
/>
```

- **The form is the editor page's own** (`ExerciseForm`, [C1.14.4](#c1144-the-editors-form)). It gained `onCancel`: on a page, Cancel is a link (`cancelTo`); in a window, it goes back to the search, with the search and the ticks as they were.
- **The state "creating" lives in `ExercisePicker`**, not in the list's component: the window's title changes too, from "Add exercises" to "New exercise". Closing the window sets it back to the search.
- **The library's lists are read again** after the creation (`invalidateQueries`), so the new exercise is in the library and in the next search.

**Columns chosen by the form's width: container queries.** The form puts its three selects (main muscle, equipment, logging type) side by side. With `sm:grid-cols-3` that happened from a screen of 640 px, and in a 512 px window on a laptop the three were squeezed and "Peso × ripetizioni" cut off. A **container query** asks the width of an element instead of the screen's: the form is marked `@container`, and its grids use `@xl:grid-cols-3`, three columns when the form itself is at least 36rem (576 px) wide.

```tsx
<form className="@container flex flex-col gap-6">
  <div className="grid gap-6 @xl:grid-cols-3">…</div>
```

Tailwind 4 has them built in: `@container` on the parent, `@sm:`, `@md:`, `@lg:`, `@xl:` (24, 28, 32, 36 rem) on what is inside. On the editor's page the form is wider than 576 px from a laptop up, so it looks as before there; on a tablet in portrait it now keeps one column. How it was built: [H3.23](../how-to/H3-frontend.md#h323-creating-an-exercise-from-the-picker-as-built).

### C1.16.9 Set types and the RPE field

Two changes to a set's row, after writing a real plan into the editor: the letters W, D, F said nothing to someone who did not know them, and the RPE field took a third of every row for a number most people never set.

**The type, from a list.** The set's number used to go through the four types one tap at a time (`cycleSetType`). Now it opens a list, `SetTypeSelect` (`components/plans/SetTypeSelect.tsx`), shared by the editor and workout mode: each type with its letter in a square, its name and a line on what it is ("Warm-up: light, before the working sets; not counted"). The reducers take the type chosen, `{ type: 'setSetType', day, item, set, setType: 'warm_up' }` here and `{ type: 'setSetType', exercise, set, setType }` in workout mode.

```tsx
<Select value={value} onValueChange={type => onChange(type as SetType)}>
  <SelectPrimitive.Trigger asChild>
    <Button variant={variant} size="icon-xl" aria-label={label}>{SET_TYPE_SIGNS[value] ?? number}</Button>
  </SelectPrimitive.Trigger>
  <SelectContent position="popper" align="start">
    {SET_TYPES.map(type => <SelectItem key={type} value={type}>…</SelectItem>)}
  </SelectContent>
</Select>
```

- **The same Select as Profile's** (`components/ui/select.tsx`, [C1.13.4](#c1134-preferences-on-the-account)), with keyboard, focus and screen-reader roles from Radix, but **its own trigger**: shadcn's `SelectTrigger` draws a bordered field with a chevron, too wide for a 48 px square.
- **`asChild`** is Radix's way to lend a part's behaviour to another element: `SelectPrimitive.Trigger asChild` draws no button of its own, and passes its handlers, its `role="combobox"` and its `aria-expanded` to our `Button`. The button looks as before; only what a tap does changed.
- **`position="popper"`** opens the list under the button, aligned to its left edge (`align="start"`), rather than over it with the chosen item on the button, the Select's default, which on a 48 px square would hide the row.
- **Tests** find the button as a combobox, `getByRole('combobox', { name: 'Set 1, normal: change the type' })`, and the type as an option, `findByRole('option', { name: /^Warm-up/ })`: the option's name is its whole text, hint included.

**The RPE field, a preference.** `users.show_rpe` ([D3.3](../design/D3-data-model.md#d33-users-and-preferences)), off by default, is the last row of Profile's **Workout** card, **RPE in plans** (C1.13.4). `PlanEditor` reads it from the cached user and passes it down, as it does the unit: `PlanEditor` → `EditorDays` → `EditorDay` → `EditorItem` → `EditorSet`. `EditorItem` adds one rule:

```tsx
const [hadRpe] = useState(() => item.sets.some(set => set.rpe !== ''))
const withRpe = showRpe || hadRpe
```

- **An RPE already there is shown,** preference or not: a plan written before the preference, or by someone who uses it, would otherwise be saved with a value nobody sees.
- **Read once, when the exercise is first drawn.** `useState(() => …)` keeps the first answer. Worked out at every draw, the field would vanish under the finger the moment its last RPE was erased.
- **The plan's page** still writes "RPE 8" in an exercise's line when a target has one; only the editor's field depends on the preference.

How it was built: [H3.24](../how-to/H3-frontend.md#h324-set-types-the-rpe-switch-and-the-stopwatch-as-built).

## C1.17 Workout mode

The first part of FEAT-3 on screen ([D1.4.9](../design/D1-ui.md#d149-workout-mode)): **Start** on a day of a plan opens `/session/:id`, a full screen where the user ticks the sets one by one, with the rest timer between them, and **Finish** sends the workout to `PUT /api/sessions/{id}` ([C2.5.7](C2-backend.md#c257-the-workouts-endpoints)). It is the screen used in the gym, with sweaty hands and a bad connection, so two rules come before everything else: **nothing is ever lost**, and **one tap per set**. How it was built, with the real output: [H3.15](../how-to/H3-frontend.md#h315-workout-mode-as-built).

### C1.17.1 The pieces

```
PlanDetailPage, HomePage Start (useStartWorkout); the banner "Workout in progress: <day>" with Resume (ResumeBanner);
└── navigate('/session/:id')
WorkoutPage              /session/:id: reads the workout kept on the phone; none → a message
└── WorkoutScreen        the workout (useReducer); top: ✕, the day, the clock, Finish; the dots;
    │                    "＋ Add exercises" beside the dots; the exercise, Add set; Previous / Next (Finish workout when it is time);
    │                    stores every change; keeps the screen on
    ├── ExerciseMenu     "⋯" beside the exercise's name: swap, skip, a note, the video (a panel from the bottom)
    ├── SetHeader        the titles above the sets: Set, Last, kg, Reps (or Sec, m)
    ├── SetRow           a set: its number or type letter (the list of types), last time, the fields (buttons);
    │                    ▶ on a timed exercise; ✓
    ├── StopwatchPanel   the stopwatch of a timed set, full screen: the time, a ring to the target, Stop, Cancel (C1.17.8)
    ├── SetStepper       the big stepper of the set tapped: − and + for each field (a panel from the bottom)
    ├── ExercisePicker   Add exercises; and Swap exercise, one tap, filtered by the main muscle
    └── RestBar          the rest timer: time left, a shrinking bar, −15, +15, Skip
```

| File | Holds |
|---|---|
| `components/workout/workout-session.ts` | The workout's types, `startSession()`, `startFreeSession()`, `exerciseFrom()`, the readers (clock, rest left, can a set be ticked), the reducer, `toSessionInput()`: no React |
| `components/workout/session-storage.ts` | The workout in progress and the queue of finished ones, in `localStorage` |
| `components/workout/finish-workout.ts`, `FinishButton.tsx` | Finishing (`finishWorkout()`) and its button with the question: shared by workout mode and the banner of a workout left open |
| `components/workout/WorkoutScreen.tsx`, `SetRow.tsx` (with `SetHeader`), `RestBar.tsx`, `clock.ts` | The screen and its pieces; `clock(245)` is `"4:05"` |
| `components/workout/set-fields.ts` | `fieldsFor()`: the fields of a set by the way its exercise is logged, shared by the rows, their titles and the stepper |
| `components/workout/SetStepper.tsx`, `stepper.ts` | The big stepper, and its arithmetic: the step of each field, the next value after a tap (C1.17.7) |
| `components/workout/ExerciseMenu.tsx` | The exercise's menu (C1.17.7) |
| `components/workout/StopwatchPanel.tsx` | The stopwatch (C1.17.8) |
| `components/ui/sheet.tsx` | shadcn/ui's Sheet: a dialog against an edge of the screen, the two panels' frame |
| `components/workout/layout.ts` | `WORKOUT_COLUMN`, the side margins shared by the screen's parts |
| `components/workout/useStartWorkout.ts`, `ResumeBanner.tsx` | Starting a workout, and the banner with Resume: shared by the plan's page and Home ([C1.18](#c118-home)) |
| `pages/WorkoutPage.tsx` | The route's page |
| `api/sessions.ts` | The types of the API's workouts, `fetchLastSets()`, `sendSession()` |
| `lib/pending-sessions.ts`, `lib/usePendingSessions.ts` | Sending the queue, and the hook that sends it when the app opens and when the network comes back |
| `lib/useNow.ts`, `lib/useWakeLock.ts`, `lib/alarm.ts` | The current moment every second; the screen kept on; the beep and the vibration |

**Full screen.** The route `session/:id` sits inside `RequireAuth` but beside `AppLayout`, not under it ([C1.5](#c15-routing)): signed in, with no tab bar or side navigation. It behaves like an app: the bars stay put and only the middle scrolls, and only when an exercise is longer than the screen; the page itself never scrolls. Every part (top bar, exercise, rest timer, Previous and Next) uses the same side margins, `WORKOUT_COLUMN` in `components/workout/layout.ts`: those of the app's other pages (`px-5 sm:px-8 lg:px-12`: 20, 32, 48 px), with the whole width of the window, on a laptop too. The spacing breathes a little and grows with the screen: rows of sets 8 px apart on a phone, 12 px from 640 px (`gap-2 sm:gap-3`), 20 to 24 px around the exercise, the bars a little taller on a tablet and a laptop. The buttons follow the app's look ([D1.5](../design/D1-ui.md#d15-design-system)): 48 px tall (`xl`), lime only for the main action (Finish workout), outlined for the others (Finish at the top, Previous, Next, Add set, −15, +15, Skip), plain only for icons (✕, a set's number). The middle is `relative`, so the hidden "Rest over" text (`sr-only`, absolutely positioned) stays inside it instead of stretching the page ([H3.15.11](../how-to/H3-frontend.md#h31511-fifth-pass-wide-on-a-laptop-an-app-on-a-phone)). The screen is a column as tall as the window (`h-dvh`, the height the browser really shows on a phone, toolbars excluded); only the middle scrolls, so ✕, Finish, the rest timer and Next are always in reach. `env(safe-area-inset-top)` keeps the top clear of a phone's notch.

**What is not here yet,** each in the backlog: live records, a notification when the rest ends with the app in the background, and the real offline app (FEAT-3). The summary after Finish is in [C1.19](#c119-the-summary-and-history).

### C1.17.2 Starting: the plan becomes a workout

**Start** (in `PlanDetailPage`, `StartDayButton`, and on Home) calls `startDay(plan, day)` of the hook `useStartWorkout` ([C1.18.2](#c1182-starting-from-home-one-hook-for-two-pages)), which does four things:

1. **Asks for last time's sets** of the day's exercises, `GET /api/sessions/last-sets?exercises=12,40,7`, with `fetchLastSets()`. Without network the request fails, and `.catch(() => [])` turns the failure into "no last time": the workout starts anyway. Each exercise keeps the whole list too, `previous`, besides the set in each place: the summary compares with it at the end, with no request ([C1.19.3](#c1193-better-than-last-time-exercise-by-exercise)).
2. **Builds the workout** with `startSession(plan, day, options)`: each item of the day becomes an exercise, each planned set a set to do. The fields are filled with **last time's values for the set in the same place**, else the **plan's target** (the lower end of `8-10`), so a set done as planned or as last time is a single tap on ✓. The weights are written in the user's unit and language (`82,5` in Italian).
3. **Gives it a UUID** in the browser (`newId()`; `crypto.randomUUID()` exists only on HTTPS and `localhost`, so a fallback builds one by hand elsewhere, [H3.18.1](../how-to/H3-frontend.md#h3181-start-without-https-a-uuid-by-hand)), as every row of a workout gets one ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)). The backend keeps these ids, which is what makes sending the same workout twice harmless (C1.17.5).
4. **Stores it** on the phone and opens `/session/<id>`.

The workout is not sent to the backend now: only at Finish. Until then it lives on the phone only. Start is disabled while another workout is in progress ("Finish or resume the workout in progress first."), and on a day with no exercises.

### C1.17.3 The workout and its reducer

The workout is one object, `ActiveSession`, and everything that happens to it is an action handled by `workoutReducer`, with `useReducer`, as the plan editor's draft ([C1.16.2](#c1162-the-draft-and-its-reducer)):

```tsx
const [session, dispatch] = useReducer(workoutReducer, initial)

dispatch({ type: 'toggleSet', exercise: 0, set: 2, now: new Date().toISOString() })   // ✓ on set 3
dispatch({ type: 'adjustRest', seconds: 15 })                                          // +15
```

- **The same ideas as the editor:** a plain function with no React, tested on its own (`workout-session.test.ts`); `structuredClone()` first, so React receives a new object; the actions a discriminated union (`WorkoutAction`).
- **Moments are ISO 8601 text** (`"2026-11-09T18:01:00.000Z"`), not `Date` objects: the workout is turned into JSON for `localStorage`, and a `Date` would come back as text anyway.
- **"Now" is a parameter.** An action that needs the time carries it (`now`), and the readers take it (`elapsedSeconds(session, now)`). The reducer never calls `new Date()` itself, so a test chooses the moment and the result is always the same: "tick at 60 s, the rest ends at 150 s".
- **The clock counts the time trained without the pauses.** `accumulated_seconds` holds the seconds before the last pause, `running_since` the moment it started running again (null while paused): `elapsed = accumulated + (now − running_since)`. ✕ is a `pause`; opening the screen again a `resume`.
- **Values are text, as typed,** like the editor's. A set can be ticked only when the values its exercise is logged with read as numbers (`canComplete()`): reps (with or without a weight), seconds or meters. ✓ is disabled otherwise, and the backend never receives a set it would refuse.
- **The weight may stay empty.** On a weighted exercise, a set done with the body alone (lunges without dumbbells); on a bodyweight one (pull-ups, logged as `reps`), the column is **+kg**, the added weight, empty for the body alone. A weight that is typed must read as a number. `toSessionInput()` sends it for both, `null` when empty ([D3.6.3](../design/D3-data-model.md#d363-logged_sets)).
- **The one rule with some thought: ticking a set.** The screen **never moves by itself**: the set just ticked stays in sight, and the user goes on with the bottom bar. What depends on the exercise is the rest, and where the bar points:

| The set's exercise is | ✓ does | The bottom bar offers |
|---|---|---|
| on its own | the rest starts with its rest seconds | Next (or Finish workout when it is time) |
| in a superset, another exercise of the round with a set left | no rest | **Next: Lateral Raise**, that exercise, by name, with a lime border |
| in a superset, the round's last | the rest starts | **Next: Lateral Raise**, the superset's first exercise with a set left, for the next round |
| in a superset with nothing else left | the rest starts | Next, or Finish workout |

  `supersetNext(session, index)` finds where to go: the next exercise of the round with a set not yet ticked; at the end of a round, the superset's first with a set left; `null` when there is none, or no superset. With `'round'` it looks only within this round, which is how the reducer decides whether the round is over and the rest starts. Exercises with nothing left are skipped: supersets often pair different numbers of sets (3 leg curls, 4 calf raises). Under the exercise's name, "Superset: Leg curl + Calf raise" says why Next names another exercise.

  **Why not move by itself,** as D1.4.9 first had it: on the superset's last exercise, a tap on a set's ✓ replaced the whole screen with the first exercise, the set just ticked out of sight and the bottom bar changed; it looked broken ([H3.15.15](../how-to/H3-frontend.md#h31515-ninth-pass-supersets-with-uneven-sets), [H3.15.16](../how-to/H3-frontend.md#h31516-tenth-pass-the-screen-never-moves-by-itself)).

  A rest of 0 seconds starts no timer. `supersetOf(session, index)` finds the superset: the neighbours with the same `superset_group`, as the editor keeps them ([C1.16.2](#c1162-the-draft-and-its-reducer)).

- **Numbers on screen** come from `setNumbers()`: warm-ups are counted apart, so the sets that count are numbered 1, 2, 3 whatever warm-ups come first, as D1.4.9 draws them (`W W 1 2 3`, not `W W 3 4 5`). A set whose type changes renumbers the ones after it. Screen readers hear the same names: "Set 1, kg: 80" (the row's button, with its value), "Warm-up 2, Reps" (the stepper's box), "Tick: Set 1".
- **The columns have titles** (`SetHeader`): Set, Last, then one per field, kg (or lb) and Reps, or Sec, or m. The header and the rows build their fields with the same function, `fieldsFor()`, and use the same widths (`w-12`, `w-16`, `flex-1`, `w-12`), so each number sits under its title.
- **Exercises added on the way.** **Add exercises**, the outlined button on the right of the dots, opens the plan editor's picker (`ExercisePicker`, [C1.16](#c116-the-plan-editor)); the exercises ticked are added at the end, the first of them opened. Each is built by `exerciseFrom()`: one set per set of last time, with its values and types, or one empty set for an exercise never done; the user's default rest; no plan item. They are built *outside* the reducer and handed to it ready (`{ type: 'addExercises', exercises }`), because building one makes new UUIDs: a reducer must give the same result every time it gets the same action, and React may call it twice to check (StrictMode, [C1.4](#c14-react-from-scratch)).
- **A free workout** (Home, [C1.18](#c118-home)) is `startFreeSession(now)`: no plan, no day's name, no exercises. The screen shows "Free workout" as its title and, until the first exercise is added, only **Add exercises** (lime) and **Cancel workout**, which forgets it: nothing was done. No Finish, no Previous or Next, with nothing to finish or move to; `finishTime` is false with no exercise.
- **At Finish,** `toSessionInput()` builds the body: every exercise, **only the ticked sets**, only the values that fit how the exercise is logged, weights in kilograms. An exercise with no set ticked is sent with none: skipped, which the history can show. The note written from the exercise's menu goes as its `notes` (C1.17.7).

### C1.17.4 The rest timer: a moment, not a countdown

A countdown that subtracts one every second drifts, and stops when the phone sleeps or the tab is in the background: browsers slow timers down there to save battery. So the rest is stored as **the moment it ends**, `rest.ends_at`, and the screen shows the difference with now:

```tsx
const now = useNow(1000)                  // a new Date every second: the screen draws again
const left = restLeft(session, now)       // ends_at − now, in whole seconds, never below 0
```

- **`useNow(intervalMs)`** is a small custom hook ([L2.9](../learn/L2-react.md#l29-hooks-the-rules-and-your-own)): `useState` holds the moment, an effect starts `setInterval`, and its clean-up stops it. Each tick draws the screen again, and the clock and the timer read the new moment. A phone that slept 2 minutes shows the right time as soon as it wakes.
- **±15 s** moves `ends_at`, and the bar's total with it. **Skip** is `endRest`.
- **The end of the rest** is a `setTimeout` set for that moment, in an effect that depends on `session.rest`:

```tsx
useEffect(() => {
  if (session.rest === null) return
  const delay = Math.max(0, Date.parse(session.rest.ends_at) - Date.now())
  const timer = setTimeout(() => {
    restOver({ sound, vibration })        // the beep and the vibration
    setAnnounce(t('workout.restOver'))     // read out by screen readers
    dispatch({ type: 'endRest' })
  }, delay)
  return () => clearTimeout(timer)        // a new rest, or ±15: the old timer goes
}, [session.rest, t, user])
```

  A new rest, or ±15 s, is a new `session.rest` object: React runs the clean-up, which clears the old timer, then the effect again, which sets a new one. Why not simply check `left === 0` on every tick? That was the first version, and React's rules refuse it: changing state directly inside an effect draws the screen twice for nothing ([H3.15.4](../how-to/H3-frontend.md#h3154-the-errors-met)). Inside a timer's function it is allowed, since the change happens later, as an event would.
- **The beep** is made with the Web Audio API (`lib/alarm.ts`): an oscillator at 880 Hz, twice, faded out so it does not click. No sound file to download. **The vibration** is `navigator.vibrate([200, 100, 200])`, which iPhones ignore. Both follow the user's settings, `timer_sound` and `timer_vibration`.
- **The screen stays on** with the **Wake Lock API** (`useWakeLock`): `navigator.wakeLock.request('screen')` while the screen is open. The browser drops the lock when the page is hidden, so the hook asks again when it shows (`visibilitychange`). A browser without the API simply lets the screen sleep.

### C1.17.5 The queue of workouts to send

The workout lives in `localStorage` (`session-storage.ts`), under three keys:

| Key | Holds | Written |
|---|---|---|
| `atleoplan.activeSession` | the workout in progress, one at a time | after every action (an effect on `session`); removed at Finish |
| `atleoplan.pendingSessions` | the finished workouts not yet on the server, by id: id → body | at Finish; an entry leaves when the server has it |
| `atleoplan.finishedSession` | the workout just finished, its body and what happened when it was sent | at Finish; removed by the summary's Save or Delete |

**Finishing** has two buttons, opening the same confirmation (`FinishButton`), and only one of them is lime at a time:

- **Finish** at the top, outlined, at any moment: to stop early;
- **Finish workout** at the bottom, in place of Next when it is time: on the last exercise, or once every set is ticked, unless the bar points to another exercise of a superset with sets left. On a phone it spans the bar and Previous shrinks to its arrow, so it fits 360 px; from 640 px wide it has its own width, on the right, and Previous keeps its word (`flex-1 sm:flex-none`, `max-sm:sr-only`).

The confirmation counts the sets that count (`countSets()`, warm-ups excluded): "3 of 7 sets done, warm-ups excluded. The 4 sets not ticked will not be saved." The second sentence appears only when some are left. **Finish and save**, in `WorkoutScreen.finish()`, then runs in this order:

1. `finish` in the reducer: the clock stops, `finished_at` is set.
2. **The body goes in the queue first**, then the workout in progress is forgotten. Whatever happens next (no network, the app closed during the request), the workout is on the phone.
3. **`sendPendingSessions()`** tries every workout of the queue, this one included, with `PUT /api/sessions/{id}`.
4. **The summary opens** (`/session/:id/summary`, [C1.19](#c119-the-summary-and-history)). Before, the workout is kept on the phone as "finished" (`storeFinished()`), with what happened to it: `saved`, `queued` or `refused`; the summary is drawn from that copy. The cached workouts and Home are marked stale, so the week and the suggested day are read again.

What each answer of the server does to a workout in the queue:

| Answer | Meaning | In the queue |
|---|---|---|
| 2xx | saved (201 the first time, 200 after) | leaves |
| 410 Gone | deleted elsewhere meanwhile ([C2.5.7](C2-backend.md#c257-the-workouts-endpoints)) | leaves: sending again will never work |
| none (offline), 5xx | the network or the server is down | stays, tried again later |
| other 4xx (403, 422) | refused | stays, so nothing is lost, and is reported: a person must look |

**Sending twice is harmless.** The request is a `PUT` to the workout's own UUID, made on the phone: the first creates, the next ones replace it with the same content. A request that reached the server but whose answer was lost (the network dropped) is simply sent again, and the server does not end up with two workouts. This is why the ids are made in the browser.

**Tried again when?** `usePendingSessions(enabled)`, in `RequireAuth`, sends the queue when a signed-in app opens, and on the browser's **`online`** event, when the network comes back. A round that sent something has the cached lists read again. This is the part of offline sync ([D2.7](../design/D2-decisions.md#d27-offline-and-sync)) a workout needs; the PWA, IndexedDB and sending in the background come with the rest of FEAT-3.

**Resuming.** ✕ pauses the workout, stores it and opens the plan's page (Home, for a free workout); both show "Workout in progress: Day A – Push" with **Resume** (`ResumeBanner`), and so does Home whatever page the workout was left from. A reload, a closed tab or a flat battery lead to the same place: the workout is read back from the phone, its clock running again only from when it is opened.

### C1.17.6 Testing it

- **The workout without React** (`workout-session.test.ts`), with the same `run(start, ...actions)` helper as the editor's. Every moment is chosen: `at(60)` is the start plus 60 seconds, so "tick at 60, 50 seconds of rest left at 100" is exact.
- **The page** (`WorkoutPage.test.tsx`): a workout is started with `startSession()` and stored, as Start does, then the page is drawn at `/session/<id>`. The test ticks, reads the timer by its role (`getByRole('timer')`), reads `localStorage` back with `loadActiveSession()`, and sends Finish with a fake API that answers 201, or `'network'` to check that the workout stays in the queue.
- **The queue** (`pending-sessions.test.ts`): five workouts queued, the fake API answering 201, 410, `'network'`, 503 and 422; the test checks which leave and which stay.
- **What tests cannot show:** the beep, the vibration, the screen staying on, the timer firing with the phone asleep. jsdom has none of them; they are checked on a phone ([H3.15.7](../how-to/H3-frontend.md#h3157-checking-in-the-browser-and-on-a-phone)).

### C1.17.7 The big stepper and the exercise's menu

Two panels that slide up from the bottom of the screen, added by UI-6 ([D1.4.9](../design/D1-ui.md#d149-workout-mode)). How they were built: [H3.20](../how-to/H3-frontend.md#h320-the-stepper-and-the-exercise-menu-as-built).

**A panel from the bottom: the Sheet.** shadcn/ui's `Sheet` (`components/ui/sheet.tsx`) is a Radix Dialog drawn against an edge instead of in the middle: the page behind waits, the focus moves in and stays, Escape, the X and a tap outside close it, the focus goes back to what opened it. `side="bottom"` picks the edge; the rest is the same component as the plan editor's `Dialog`. Bottom panels suit a phone in one hand: the controls are where the thumb is.

**The stepper.** The set's fields are no longer text boxes but buttons that look like them (`SetRow`): a tap opens `SetStepper` on that set, with each of its fields between a − and a + 64 px wide, the step written on them (`−2,5`, `+1`). Typing the phone's keyboard was slow with sweaty hands; the box between − and + still takes typing, for a value far away.

| Field | Step | Below zero |
|---|---|---|
| weight (kg or lb) | the user's `weight_step` (2.5 by default, in their unit) | 0 becomes empty: no weight, the body alone |
| reps | 1 | stays 0 |
| seconds | 5 | stays 0 |
| meters | 10 | stays 0 |

- **The values stay text.** `stepValue(text, field, delta, language)` (`stepper.ts`, no React) reads the field's text, adds the step and writes it back in the user's language (`82,5` + 2,5 = `85`), so typing and tapping mix. An empty or unreadable field starts from 0. Reps, seconds and meters are rounded to whole numbers (the backend takes no other); the weight keeps two decimals at most, written by `formatNumber()`, which also hides JavaScript's `0.1 + 0.2 = 0.30000000000000004`.
- **Each tap changes the set at once** with the same `setField` action typing used: no Cancel, and **Done** only closes. The workout is stored after every change, as always.
- **Which set:** `WorkoutScreen` keeps `stepping = { set, field }` apart from `stepperOpen`, so while the panel slides away it still shows the set it had.
- **Focus:** Radix gives the focus to the first button of a dialog, here the weight's −. `onOpenAutoFocus` with `event.preventDefault()` stops that, and the + of the field tapped gets it, through a **callback ref**: `ref={(button) => { plusButtons.current[field] = button }}` keeps each + in an object held by `useRef` ([L2.20](../learn/L2-react.md#l220-what-react-has-that-the-project-does-not-use-yet)), which React does not draw again when it changes.

**The exercise's menu.** `ExerciseMenu`, the "⋯" beside the exercise's name, opens a panel with rows 48 px tall, rather than a small drop-down: rows as wide as the phone are easy to hit mid-set.

| Row | Does | Action of the reducer |
|---|---|---|
| **Swap exercise** | Opens the picker in its swap mode; one tap puts the exercise picked in this one's place. Disabled once a set is ticked, saying why: a ticked set belongs to the exercise it was done with | `swapExercise`, with `swappedExercise()` |
| **Skip exercise** / **Do it after all** | Marks it skipped and opens the next exercise; or takes the skip back | `skipExercise` |
| **Add a note** / **Edit the note** | The panel turns into a text box (500 characters, the backend's limit); Save keeps it, shown under the name as "Your note" and sent as the exercise's `notes` | `setNote` |
| **Watch the video** | Only when the exercise has a `youtube_url`: YouTube in a new tab (`target="_blank" rel="noreferrer"`) | none |

- **Swapping keeps the place, not the values.** `swappedExercise(current, exercise, lastSets, options)` keeps the workout exercise's id, plan item, superset and rest, and as many sets as before with the same types; the values and "Last" come from the new exercise's own last time (`GET /api/sessions/last-sets`, none offline). With no last time, the plan's reps fill the sets but **not the plan's weight**: 80 kg were meant for the barbell, not for dumbbells. Built outside the reducer, like `exerciseFrom()`, because it makes new UUIDs. The note and a skip go with the old exercise.
- **The swap picker** is `ExercisePicker` with `replacing`: no tick boxes, a tap on a row picks it; the list starts filtered by the replaced exercise's first main muscle (`filter[muscle]=chest`), with a chip, **Only Chest**, that turns the filter off and on (`aria-pressed`); the exercise being replaced is left out. The menu opens it without a button of its own: `open` and `onOpenChange` let the screen **control** the dialog, where Add exercises lets the picker keep its own state (**uncontrolled**). `open ?? ownOpen` supports both.
- **Skipping** sets `skipped: true` on the exercise. It changes what counts as work left, in one function, `hasWorkLeft(item)`: a set not ticked, and not skipped. Next in a superset (`supersetNext`), Finish workout's moment (`allSetsDone`) and the dots read it, and the Finish question no longer counts the sets given up (`countSets`). On screen: the sets dimmed, a grey box "Skipped: the sets not ticked will not be saved." with **Do it after all**, and a greyer dot named "…, skipped". Ticking one of its sets takes the skip back: it is being done after all. Skipping opens the next exercise: a choice to move on, a tap, so the rule that the screen never moves by itself *after a tick* still holds.
- **Older workouts** kept on the phone before UI-6 have no `notes` and no `skipped`: both are optional (`notes?: string`), and missing reads as none.

**Testing them.** The arithmetic in `stepper.test.ts`, the three actions in `workout-session.test.ts`, the panels in `WorkoutPage.test.tsx`: a tap on "Set 1, kg: 80", the dialog named "Set 1", "kg: 2.5 more" twice, the box reads 85; the note, Skip and its way back, Swap with the muscle in the request's address.

### C1.17.8 The stopwatch of a timed set

A set of an exercise logged by time had only a box for the seconds: fine for a plank timed by the gym's clock, poor for "30 s dead hang". Such a row now has **▶** before ✓, which opens `StopwatchPanel`, full screen: the time counting up inside a ring, the target under it, **Last time**, **Stop** and **Cancel**.

**A moment, like the rest** (C1.17.4). The workout keeps when the stopwatch started, not a counter:

```ts
session.stopwatch = { set_id: '0192…', started_at: '2026-11-10T18:05:12.000Z', target: 30 }
stopwatchSeconds(stopwatch, now)   // (now − started_at) in whole seconds
```

- **Stored with the workout** (`session-storage.ts`), so the screen off, the app closed and opened again, or a reload lose nothing: the time is still right. `stopwatch?` is optional in `ActiveSession`, since workouts kept on a phone before it have no such key.
- **The set by its id,** not by its indexes: exercises can be added while it runs, and `findSet(session, id)` finds it wherever it is.
- **The target** is the set's `seconds` when ▶ is tapped: the plan's target, or last time's time, which fill the field (C1.17.2). For a hold it is the time to reach; for reps done as fast as possible (C1.17.9), last time's time to beat. Empty, there is none.
- **Starting ends the rest**, if one was running: the set has begun.

**Four actions of the reducer:**

| Action | Does |
|---|---|
| `startStopwatch` | `{ set_id, started_at: now, target }`, the rest ended; nothing on a set already done |
| `stopStopwatch` | The seconds, at least 1 (the backend's minimum), into the set; then the set is ticked by calling the reducer again with `toggleSet`, so the rest and the superset's round follow the rules of ✓ |
| `cancelStopwatch` | Forgets it; the set stays as it was |
| `finish` | Also forgets it |

`stopStopwatch` calls `workoutReducer` from inside `workoutReducer`: a reducer is a plain function, and the copy it already made is simply passed on. Ticking has one set of rules, in one place.

**The panel.**

- **The ring** is an SVG circle whose line is drawn as one dash: `stroke-dasharray` the circle's length (2πr), `stroke-dashoffset` the part not yet filled, `CIRCUMFERENCE * (1 - share)`. `share` is `seconds / target`; with no target, the seconds of the current minute, a stopwatch's hand. `-rotate-90` starts it at the top.
- **Its own clock,** `useNow(250)`: four times a second, so the seconds change on time, not up to a second late as with the screen's clock.
- **The target's signal** is the rest's (`restOver()`, with the user's sound and vibration), from a `setTimeout` set for that moment, as in C1.17.4; none when the moment is already past (the app opened again after it), or it would ring late. "Target reached" replaces "Target 0:30", in lime, and is read out (`aria-live`).
- **A Dialog that does not close by itself.** It is shadcn/ui's `Dialog` stretched to the whole screen (`h-dvh w-full max-w-none rounded-none`), always `open` while it is drawn; `onEscapeKeyDown` and `onInteractOutside` call `event.preventDefault()`, which tells Radix to stay open. A time ends with Stop or Cancel only, never with a stray touch. The Dialog still traps the focus and names itself after the exercise (`DialogTitle`).

**Testing it.** `workout-session.test.ts`: the start with its target and the rest ended, Stop with the time and the tick and the rest, no target and at least a second, Cancel, no start on a set done. `WorkoutPage.test.tsx`: ▶, the panel named after the exercise with "Target 0:45" and "Last time 0:45", the stopwatch kept on the phone, Stop, the set ticked with its seconds, the rest running.

How it was built: [H3.24](../how-to/H3-frontend.md#h324-set-types-the-rpe-switch-and-the-stopwatch-as-built).

### C1.17.9 Exercises done as fast as possible

A plan of calisthenics has many lines such as "50 push-ups, 50 sit-ups, 50 squat jumps", each as fast as possible: 9 of the 21 exercises of the plan that asked for it. The reps are fixed, the time is the result. Before, such a line had to be one's own exercise logged by time ("50 push-ups"), apart from the push-ups done for reps on other days.

**In the plan, a switch on the item.** `plan_items.for_time` ([D3.5.3](../design/D3-data-model.md#d353-plan_items)), `for_time` in `PlanItem` and `PlanItemInput` (`api/plans.ts`), `for_time?` in `DraftItem`: optional, since a draft kept in the browser before has none. `EditorItem` shows the switch above the sets of an exercise that counts reps, `canBeForTime(loggingType)` in `plan-draft.ts`; the action is `setItemForTime`. `toPlanInput()` sends `for_time` true only for such an exercise. `itemSummary()` adds the switch's words to the exercise's line: "1 × 50 · as fast as possible · 90 s".

**In workout mode, one question: `isForTime(item)`** (`workout-session.ts`): the plan item says so, and the exercise counts reps. Everything else follows from it:

| Where | Done as fast as possible |
|---|---|
| `fieldsFor(loggingType, unit, t, forTime)` | `[reps, seconds]`: the row, its titles and the stepper. The weight, if any, stays the plan's or last time's: three fields beside ▶ and ✓ do not fit a phone |
| `SetRow`, `SetHeader` | ▶ before ✓, as on a timed exercise; **no Last column**: 48 + 64 px less, so the two fields keep a thumb's width at 360 px. Last time's time is in the seconds' field (C1.17.2), in the stepper and in the stopwatch |
| `canComplete(set, loggingType, forTime)` | The seconds are needed too |
| `toSessionInput()` | `duration_seconds` beside `reps`; the backend takes it (`OPTIONAL_BY_LOGGING`, [C2.5.7](C2-backend.md#c257-the-workouts-endpoints)) |
| `StopwatchPanel`'s `race` | "Set 2 · 50 reps"; **To beat 1:12**, then "0:14 over" and the ring in red; no signal at the target, which is not the goal here |

**Last time of the same kind.** Push-ups done 3 × 15 on Monday and 50 for time on Thursday: Thursday's time to beat is last Thursday's, not Monday's 15. The backend gives one last time per exercise **and kind** ([C2.5.7](C2-backend.md#c257-the-workouts-endpoints)), so an exercise done both ways has two entries; the app picks with `hasTimedSets(entry.sets)` (`compare.ts`): one set with seconds makes it timed. `lastOfKind()` in `workout-session.ts` does it for a workout's start, Add exercises and Swap; `compareWorkout()` for the summary and history. No flag is stored with the workout: a set with reps and seconds says it by itself.

**Written and compared.** `loggedSetText()` writes such a set "50 in 1:12" (`workout.repsInTime`: "en" in Spanish). The text comes from `i18n.t()` with `lng: language`: `set-text.ts` is a plain function, with no `useTranslation()`, and the same i18next instance gives the same translations outside React. `compare.ts` scores it `[weight, reps, −seconds]`: more reps first, then fewer seconds, since a list of scores is compared item by item and the higher wins (C1.19.3).

**Testing it.** `plan-draft.test.ts`: the switch on and off, sent only for reps. `plan-format.test.ts`: "1 × 50 · as fast as possible · 90 sec". `compare.test.ts`: less time wins; last time of the same kind. `workout-session.test.ts`: last time of the same kind at the start, the seconds needed, the stopwatch's time sent with the reps, "50 in 1:12" and "50 en 1:12". `PlanEditorPage.test.tsx`: the switch and the body sent. `WorkoutPage.test.tsx`: the row with Reps and Sec and no Last, the panel's "Set 1 · 50 reps" and "To beat 1:12", Stop. How it was built: [H3.25](../how-to/H3-frontend.md#h325-exercises-done-as-fast-as-possible-as-built).

## C1.18 Home

The second part of FEAT-3 on screen ([D1.4.2](../design/D1-ui.md#d142-home)): the first screen of every visit says **what to do today** and starts it in one tap. How it was built, with the real output: [H3.16](../how-to/H3-frontend.md#h316-home-as-built).

### C1.18.1 The pieces

```
HomePage                 route `/`, inside AppLayout
├── useHome()            GET /api/home: the active plan, its days, the suggested day, the day done last, the recent workouts
├── FormBanner           after a workout's summary: "saved" / "will be sent" / "refused" / "deleted"
├── ResumeBanner         a workout in progress on this phone: "Workout in progress: Day A – Push", Resume
├── ActivePlanCard       the plan, the day chosen (the suggested one at first), Start, a chip per day
│   or EmptyState        no active plan: Create a plan, Browse exercises
├── Free workout         a workout with no plan: startFree()
└── This week            WeekStrip (the days trained) and WeekStats (workouts, sets, minutes), from weekSummary()
```

| File | Holds |
|---|---|
| `api/home.ts` | The answer's types (`HomeData`, `HomeDay`), `homeKeys`, `useHome()` |
| `pages/HomePage.tsx` | The page: its four states (loading, failed, a plan, none), the banners, Free workout, the week |
| `components/home/ActivePlanCard.tsx` | The active plan's card: the day chosen, its numbers, Start, the chips |
| `components/home/week-summary.ts` | `weekSummary()`: this week's workouts by the device's clock, summed up; no React |
| `components/home/WeekStrip.tsx`, `WeekStats.tsx` | The seven days, the three numbers |
| `components/workout/useStartWorkout.ts` | The steps that start a workout, shared with the plan's page |
| `components/workout/ResumeBanner.tsx` | The banner with Resume, shared with the plan's page |

**One request.** Home needs five things (the active plan, its days with a duration, the suggested day, the day done last, the week's workouts); the backend sends them in one answer, `GET /api/home`, built by `HomeSummary` ([C2.5.7](C2-backend.md#c257-the-workouts-endpoints)). Home is opened on every visit, often on a phone's network, where one answer arrives sooner than five. The days come **without their exercises**: a name, a count and an estimate in minutes are all the card shows.

**The four states** of the plan's place, as every screen has ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)): grey shapes while loading (`Skeleton`), a message with **Try again** when the request fails, the card when a plan is active, the empty state otherwise. Free workout and the week are shown in every state: Free workout needs no request.

**Read again when something changes it.** `homeKeys.all` (`['home']`) is marked stale after a workout is sent (`WorkoutScreen.finish()` and `usePendingSessions`) and after any change to a plan (`refreshPlans()` in `api/plans.ts`: made active, archived, saved, deleted), since both change the card or the suggested day. Marking a key stale (`invalidateQueries`) makes TanStack Query read it again the next time a component shows it ([C1.6](#c16-server-data)).

### C1.18.2 Starting from Home: one hook for two pages

Start on Home and Start this day on the plan's page do the same steps, so they are written once, in a **custom hook**, `useStartWorkout()` ([L2.9](../learn/L2-react.md#l29-hooks-the-rules-and-your-own)): a function whose name starts with `use` and that calls other hooks (`useNavigate`, `useCurrentUser`, `useState`). Each page calls it and gets back the actions and their state:

```tsx
const start = useStartWorkout()
// start.startDay(plan, day)           the plan's page: the plan is already loaded
// start.startPlanDay(planId, dayId)   Home: reads the plan first
// start.startFree()                   Home: Free workout
// start.starting, start.failed        to disable Start, and to say the plan could not be read
```

**Home does not have the plan,** only its days' names. `startPlanDay()` reads it first with `queryClient.fetchQuery()`, with the same key and function as `usePlan()`:

```tsx
const plan = await queryClient.fetchQuery({
  queryKey: planKeys.detail(planId, i18n.language),
  queryFn: ({ signal }) => fetchPlan(planId, signal),
})
```

`fetchQuery()` is the imperative cousin of `useQuery()`: called in an event handler rather than while drawing, it gives the cached plan when it is fresh (the plan's page was opened a moment ago), otherwise asks the API and puts the answer in the cache, where the plan's page finds it. Then `startDay()` runs as on the plan's page: last time's sets, `startSession()`, stored, opened ([C1.17.2](#c1172-starting-the-plan-becomes-a-workout)). When the plan cannot be read (offline, never opened on this phone), `failed` becomes true and the card says so; nothing is started.

**Free workout** needs no request: `startFreeSession(now)` makes an empty workout, and the workout screen offers **Add exercises** ([C1.17.3](#c1173-the-workout-and-its-reducer)). It works offline.

### C1.18.3 The card: choose, then start

- **The day on the card** is held in `useState`, starting from `suggested_day_id`: the day after the last one done, worked out by the backend ([D2.8](../design/D2-decisions.md#d28-workout-rules)). When the day on the card is the suggested one, a **Suggested** badge says so; "Last time you did Day A – Push" comes from `last_day`.
- **A chip per day** chooses it: the card shows that day, and **Start** starts it. D1.4.2 asked for a chip that starts at once; one tap that starts a workout is too easy to make by mistake on a phone, and a workout started by mistake stays in progress until it is finished, so a chip chooses and Start starts. `aria-pressed` tells screen readers which chip is chosen.
- **A chosen chip's look** has to beat the outline button's own dark-theme classes (`dark:border-input dark:bg-input/30`): a class with the `dark:` prefix wins over the same property without it, so the chosen look repeats its border and tint with `dark:` ([H3.16.4](../how-to/H3-frontend.md#h3164-the-errors-met)).
- **Start is disabled** while a workout is in progress on the phone (the banner above offers Resume, and the reason is written under Start), while starting, and on a day with no exercises. A plan with no days shows a sentence and **Edit the plan** instead.
- **Only one lime button:** Start. Free workout and the chips are outlined; Resume, above, is lime too, but then Start is disabled.

### C1.18.4 This week, by the device's clock

A week starts on Monday at midnight **in the user's time zone**, which only the device knows; the backend stores moments in UTC ([D3.2.5](../design/D3-data-model.md#d325-times)). So it sends the finished workouts of the **last 8 days**, which always cover the whole week in any zone, and the app picks this week's:

```ts
const week = weekSummary(home.data?.recent_sessions ?? [], new Date())
// { workouts: 2, sets: 29, minutes: 97, trainedDays: [Thu 5, Sat 7] }
```

`isInWeek(moment, today)` (`lib/week.ts`) compares with Monday at midnight and the Monday after, both built with the local `Date` constructor, as `getWeekDays()` does. Two workouts on the same day mark it once. The sets come from the backend, warm-ups excluded (`sets_done`); the minutes add up each workout's `duration_seconds`, rounded once at the end. No volume: a week's volume adds up unlike exercises and counts nothing done with the body alone ([D2.8](../design/D2-decisions.md#d28-workout-rules)); minutes, not "2 h 35 min", so the number fits a third of a phone's width. A day trained gets a lime ring and a dot in `WeekStrip`, and the words "workout done" for screen readers: colour alone never carries meaning ([D1.7](../design/D1-ui.md#d17-responsive-layout-and-accessibility)).

**The banner of a workout left open** (`ResumeBanner`, on Home and on the plan's page) has **Resume** and **Finish**: Finish asks the same question as in workout mode (`FinishButton`), runs the same steps (`finishWorkout()`, `finish-workout.ts`), and opens the summary. For a workout done but never finished, the app closed at the end.

**Not here yet:** the last three personal records (they come with Progress, phase 2).

### C1.18.5 Testing it

- **The week without React** (`week-summary.test.ts`, `week.test.ts`): a Thursday chosen as "today", workouts on Thursday, twice on Tuesday and on the Sunday before; the test checks that the Sunday is left out and Tuesday is marked once.
- **The page** (`HomePage.test.tsx`), with the fake API of [C1.10](#c110-tests-and-checks): `GET /api/home` answers with `homeAnswer()`, the test plan active and Day B suggested. The tests read the card by its name (`getByRole('region', { name: 'Push Pull Legs' })`, the `<section>` named by its heading), tap Start and check that the plan and last time's sets were asked for and that workout mode opened on the right day; tap a chip, then Start; make the plan's request fail; store a workout first and check Resume; start a free workout; and read the week's numbers.
- **Reading a number by its label:** in `WeekStats`, each label (`<dt>`) comes before its number (`<dd>`) in the page, though drawn under it (`flex-col-reverse`), so a test finds the label and reads its `nextSibling`.

## C1.19 The summary and history

FEAT-4 on screen ([D1.4.10](../design/D1-ui.md#d1410-workout-summary), [D1.4.11](../design/D1-ui.md#d1411-history)): **the summary** after Finish says what was done and asks how it felt; **history** lists every past workout and opens each one. How it was built, with the real output: [H3.17](../how-to/H3-frontend.md#h317-the-summary-and-history-as-built).

### C1.19.1 The pieces

```
WorkoutScreen.finish()   queue, send, storeFinished({ id, input, outcome }), then /session/:id/summary
SummaryPage              /session/:id/summary: the finished workout from the phone; not there → its page in history
├── WorkoutStats         time, exercises, sets, reps, from inputTotals(input)
├── ComparisonSummary    "Against last time: 2 better · 1 same", from compareWorkout()
├── Collapsible          "Exercises 3", closed at first; open, sliding: SessionExercises, each exercise
│                        against last time, its sets, its own volume
├── FeelingPicker        how it felt, 1 to 5
├── Textarea             notes
└── Save / Delete        then Home, with "saved" / "will be sent" / "refused" / "deleted"

ProgressPage             /progress: the 3 latest workouts, All workouts; charts and records "coming soon"
HistoryPage              /progress/history: every workout by month, 20 at a time, Show more
└── SessionRow           a workout: date, day, plan, time · sets · reps; a link to its page
HistoryDetailPage        /progress/history/:id: the numbers, the count of verdicts, how it felt, the notes, Delete
└── SessionExercises     each exercise against last time ("Better", "80×8 · last time 80×6"), its sets
                         ("W1 40×10", "1 80×8"; "Skipped"), its own volume for an exercise with weights
```

| File | Holds |
|---|---|
| `api/sessions.ts` | `useSessions()` (pages), `useSession()` (one workout and the one before), `deleteSession()`, `useDeleteSession()` |
| `pages/SummaryPage.tsx` | The summary; `WorkoutEndState`, what Home is told afterwards |
| `pages/HistoryPage.tsx`, `HistoryDetailPage.tsx`, `ProgressPage.tsx` | History, a past workout, Progress |
| `components/history/totals.ts` | `inputTotals()` and `sessionTotals()`: a workout's four numbers (time, exercises, sets, reps), from the phone's body or from the server |
| `components/history/compare.ts` | `compareExercise()`, `compareWorkout()`, `countVerdicts()`, `bestSet()`, `exerciseVolume()`: better or not than last time (C1.19.3) |
| `components/history/feeling.ts` | The five feelings and `feelingName()` |
| `components/ui/collapsible.tsx` | shadcn/ui's Collapsible, with an opening that slides: the summary's folded exercises |
| `components/history/*.tsx` | The pieces above |
| `components/workout/set-text.ts` | `loggedSetText()`: a set as "80×8", shared with workout mode's "Last" column |
| `components/workout/session-storage.ts` | `storeFinished()`, `loadFinished()`: the workout just finished |
| `lib/format.ts` | `formatDuration()`: "45 min", "1 h 5 min" |

### C1.19.2 The summary: drawn from the phone

Right after the last set the network may be down, and the summary must still show. So it is **drawn from the copy the phone kept at Finish**, never from the server:

1. `finish()` in workout mode queues the body and tries to send it, as before ([C1.17.5](#c1175-the-queue-of-workouts-to-send)), then keeps `{ id, session, input, outcome }` under `atleoplan.finishedSession` and opens `/session/<id>/summary`. `session` is the workout itself: the exercises' names and logging types, and last time's sets, which the body does not carry.
2. `SummaryPage` reads that copy once (`useState(loadFinished)`). Its numbers come from the body with `inputTotals()`: exercises with a set, sets and reps without warm-ups, the time trained. The same rules as the backend's totals ([C2.5.7](C2-backend.md#c257-the-workouts-endpoints)), so the workout shows the same numbers in history.
3. **The comparison** needs no request either. When the workout started, workout mode asked for last time's sets of its exercises (`last-sets`, [C1.17.2](#c1172-starting-the-plan-becomes-a-workout)) and kept the whole list on each exercise (`previous`); `compareWorkout()` compares with them. Offline at the start, there was no last time: every exercise says "First time".

**Save** adds the feeling and the notes to the body and **sends the whole workout again**, through the queue: `addPending(id, { ...input, feeling, notes })`, then `sendPendingSessions()`. A `PUT` to the workout's UUID replaces it, so sending twice is the intended way to add the answers; offline, they wait in the queue with it. Nothing chosen and nothing written: nothing is sent. Then Home opens, told what happened through the navigation's `state` (`WorkoutEndState`).

**Delete** takes the workout off the queue and asks the server to delete it (`DELETE /api/sessions/{id}`):

| The workout was | DELETE answers | Then |
|---|---|---|
| sent at Finish | 204 | deleted; Home says so |
| sent, but the network is down now | no answer | the summary stays, with "could not be deleted": it is on the server |
| still in the queue | no answer (offline) | deleted: taking it off the queue is enough, it never reached the server |
| never arrived, or deleted already | 404 or 410 | deleted |

**Opened again** after Save (a reload, Back), or on another phone, the address has no finished workout on this phone: `<Navigate>` replaces it with the workout's page in history, which reads it from the server.

### C1.19.3 Better than last time, exercise by exercise

A workout's total volume (weight × reps of everything) was the first number the summary showed, and said little: it adds a kilogram of squat to a kilogram of curl, and counts nothing done with the body alone, so a calisthenics workout weighed 0 ([D2.8](../design/D2-decisions.md#d28-workout-rules)). Each exercise is compared with itself instead, in `compare.ts`, with no React:

```ts
compareExercise(sets, previous, loggingType)
// → { verdict: 'better' | 'same' | 'worse' | 'first', best, previousBest }, or null for an exercise skipped
```

| Logged as | The best set is the one with | Example |
|---|---|---|
| weight × reps | the highest estimated one-rep max, Epley's weight × (1 + reps / 30) | 82.5×8 (104.5) beats 85×5 (99.2) |
| reps | the most added weight, then the most reps | +5×6 beats 12; 12 beats 10 |
| time, distance | the longest | 1:30 beats 1:15 |
| reps, as fast as possible | the most reps, then the shortest time; only against last time done the same way ([C1.17.9](#c1179-exercises-done-as-fast-as-possible)) | 50 in 1:05 beats 50 in 1:12 |

- **Warm-ups never count;** an exercise with warm-ups only, or skipped, has no verdict (`null`) and is not counted.
- **A tie of the best sets** is decided by the total reps of the sets that count: 3×8 beats 2×8 at the same weight.
- **A score is a list,** compared item by item (`compareScores()`): `[one-rep max]`, or `[added weight, reps]` for an exercise logged by reps, so the second item decides only when the first ties. Differences below 0.001 are equal: the same multiplication done twice can differ in its last decimal.
- **Weights arrive in two forms:** numbers from the phone's body, exact text from the API (`"80.000"`); `Number()` reads both, and `SetValues` accepts both.
- **On screen:** `ComparisonSummary` counts the verdicts ("Against last time: 2 better · 1 same"), lime when more went better than lower; `SessionExercises` writes, under each exercise, the verdict with its arrow, then the two best sets, "80×8 · last time 80×6", with `loggedSetText()`. Lower is said in grey, not red: a lighter day is not a failure.
- **In the summary the list is folded:** under the count, in shadcn/ui's **Collapsible** (`components/ui/collapsible.tsx`, Radix's Collapsible), closed at first. The count says how it went; the list is there for whoever wants it, without pushing the questions and Save down the page. Radix keeps it open or closed, sets `aria-expanded` on the trigger for screen readers, and marks trigger and content with `data-state="open"` or `"closed"`. The content slides: Radix measures its height into `--radix-collapsible-content-height`, and `animate-collapsible-down` / `-up` (tw-animate-css) go from 0 to it and back. The arrow turns with `group-has-data-open:rotate-180`: the frame is the `group`, and `has-data-open` is true while something inside it carries `data-state="open"`. A closed list is not in the page at all. On a workout's page in history the list is the content, so it is shown open, as a plain list.
- **Volume stays where it means something:** beside each exercise logged as weight × reps, "Volume of this exercise: 1,280 kg" (`exerciseVolume()`), never added across exercises.

### C1.19.4 History: pages from the server

- **The list** is `useSessions()`, `useInfiniteQuery` over `GET /api/sessions?status=finished&page=…&per_page=20`, the pattern of the exercise library ([C1.14](#c114-the-exercise-library-screens)): `data.pages` holds every page read, `fetchNextPage()` asks for the next, `hasNextPage` hides **Show more** after the last.
- **By month:** `byMonth()` in `HistoryPage` walks the list, newest first, and starts a new group when the month changes. The month's name comes from `Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' })`; some languages write it in lower case ("novembre 2026"), so the heading capitalises its first letter with CSS (`first-letter:uppercase`).
- **A workout's page** is `useSession(id, language)`: the language is in the key, since the exercises' names come translated. Its answer carries `meta.last_sets`, last time for each of its exercises, counting only the workouts **before** it ([C2.5.7](C2-backend.md#c257-the-workouts-endpoints)), for the comparison: the same `compareWorkout()` as the summary. The sets are numbered as in workout mode, with `setNumbers()`, and written with `loggedSetText()`, the function workout mode's "Last" column uses: one way of writing a set in the whole app.
- **Delete** is a mutation (`useDeleteSession`): afterwards the workout's cached copies are removed (`removeQueries`), the lists and Home are marked stale, and history opens.
- **Progress** shows the first three workouts of the same `useSessions()` list: the same key, so opening **All workouts** shows them at once, from the cache.

**Not here yet,** each in the backlog: editing a past workout's sets ([FEAT-6](../project/backlog.md#feat-6-edit-a-past-workout)), an exercise's own history ([FEAT-7](../project/backlog.md#feat-7-an-exercises-own-history)), records broken ([FEAT-5](../project/backlog.md#feat-5-new-records-during-a-workout)), and the charts of Progress (phase 2).

### C1.19.5 Testing it

- **The numbers without React** (`totals.test.ts`): a body with a warm-up, a set with the body alone and an exercise skipped; only the sets that count add their reps, the body alone included.
- **The comparison without React** (`compare.test.ts`): one test per way of logging, the tie decided by the total reps, weights as numbers and as text, "first time" and an exercise skipped.
- **The summary** (`SummaryPage.test.tsx`): a workout is finished in the test as Finish does it (`startSession()` with last time's bench press, `workoutReducer()` with the ticks, `toSessionInput()`, `storeFinished()`), then the page is drawn at its address. The tests read the numbers by their labels, check that the comparison needed no request, check the `PUT` sent with the feeling and the notes, that nothing is sent with nothing to add, the two ways of deleting, and the jump to history.
- **History and Progress** (`HistoryPage.test.tsx`): the fake API answers each page by its exact query string (`GET /api/sessions?status=finished&page=2&per_page=20`), which `fakeApi` matches before the bare path.
- **Workout mode's tests** now end on a stand-in for the summary, and read the finished workout back with `loadFinished()`.

---

← [D3. Data model](../design/D3-data-model.md) · [Contents](../README.md) · [C2. Backend](C2-backend.md) →
