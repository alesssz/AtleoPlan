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
  - [C1.13.4 Language and theme on the account](#c1134-language-and-theme-on-the-account)
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
- [C1.16 The plan editor](#c116-the-plan-editor)
  - [C1.16.1 The pieces](#c1161-the-pieces)
  - [C1.16.2 The draft and its reducer](#c1162-the-draft-and-its-reducer)
  - [C1.16.3 Drag and drop with dnd-kit](#c1163-drag-and-drop-with-dnd-kit)
  - [C1.16.4 The draft kept in the browser](#c1164-the-draft-kept-in-the-browser)
  - [C1.16.5 Saving](#c1165-saving)
  - [C1.16.6 Testing it](#c1166-testing-it)

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
├── public/                 files served as they are (favicon.svg)
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
    │   └── muscles.ts, equipment.ts   the two fixed lists of the filters and the editor
    ├── components/
    │   ├── ui/               shadcn/ui components (generated, then ours to edit)
    │   ├── layout/           the frames: AppLayout (navigation), AuthLayout (sign-in screens); SideNav, BottomTabBar, nav-items
    │   ├── brand/            the logo: BrandMark and Wordmark
    │   ├── home/             pieces of Home: WeekStrip, WeekStats
    │   ├── exercises/        pieces of the library: ExerciseListItem, ExerciseFilters, ExercisePhotos, ExerciseForm and exercise-form.ts (C1.14)
    │   ├── plans/            pieces of the plan screens: PlanCard, PlanDayView, PlanItemRow, and plan-format.ts, the summary of an exercise (C1.15);
    │   │                     plan-draft.ts, the editor's draft and reducer, draft-storage.ts (C1.16)
    │   │   └── editor/         the plan editor: PlanEditor, EditorDay, EditorItem, EditorSet, ExercisePicker (C1.16)
    │   └── *.tsx             shared by several pages: PageHeader, EmptyState, ComingSoon, SettingRow, FormField, FormBanner, the pickers…
    ├── pages/              one component per screen (HomePage, LoginPage…), and auth-schemas.ts, the rules of the sign-in forms
    ├── routes/             the guards: RequireAuth, RequireGuest, useAccountPreferences (C1.13)
    ├── i18n/
    │   ├── index.ts          i18next setup and language detection
    │   ├── languages.ts      the supported languages and their names
    │   ├── i18next.d.ts      makes translation keys type-checked
    │   └── locales/          it.json, en.json, es.json, de.json
    ├── lib/                plain helpers: http (fetch wrapper), query-client, form (server errors on a form), format (numbers, dates), week, utils (cn); useDebouncedValue, a hook
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
- **The frames and the guards:** `AppLayout` is the parent of every signed-in page, inside the guard `RequireAuth`. The sign-in screens have `AuthLayout`, inside `RequireGuest` ([C1.13](#c113-signing-in-and-forms)). Workout mode and the public shared plan, both full screen, will be siblings of these branches. Comments in the file mark where.
- **Links:** use `<Link to="/plans">`. Use `<NavLink>` in navigation: it knows whether it is the current page and then gets `aria-current="page"`. Use `useNavigate()` to move in code, for example after saving.
- **Parameters:** a route `exercises/:id` gives the page `const { id } = useParams()`, a string: `Number(id)` for a number (`ExerciseDetailPage`). A plan's id is a UUID, and stays a string (`PlanDetailPage`). `plans/new` and `plans/:id/edit` open the plan editor (C1.16).
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
- **Where the choice is saved:** on the account, so it follows the user, and in this browser (`localStorage`, key `atleoplan.theme`), so `index.html` can apply it before anything is drawn ([C1.13.4](#c1134-language-and-theme-on-the-account)).
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
| `pages/PlanDetailPage.test.tsx` | a day's exercises summed up, the day tabs in the address, the weight unit, activate, archive, delete, a plan not found |
| `components/plans/plan-format.test.ts` | the line that sums up an exercise, in two languages and two units; the supersets |
| `components/plans/plan-draft.test.ts` | the editor's draft without React: reading what is typed, to and from the API, the rules, every action of the reducer |
| `pages/PlanEditorPage.test.tsx` | creating from the library, saving with the version and the ids, the rules and the server's messages, the warning of a plan changed elsewhere, the draft kept and discarded, supersets, days |

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

- **Bundle size.** The production build is one JavaScript file of 897 kB (279 kB compressed) since the plan editor, and Vite warns above 500 kB. The editor, with dnd-kit and the Dialog, is the first candidate for a page loaded only when opened. When the screens grow, load each page only when opened: `lazy` routes in React Router, which split the bundle per page.
- **A preference changed with no connection is not saved.** It stays on screen until the page reloads, then the account's value returns. The offline queue will save it (FEAT-3).
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

### C1.13.4 Language and theme on the account

A choice made on the phone follows the user to the computer ([D1.4.14](../design/D1-ui.md#d1414-profile-and-settings)). The data flows one way, around a circle:

```
LanguageSelect, ThemeSelect ──▶ useUpdatePreferences ──▶ the cache (at once) and the server
                                                              │
        i18next, ThemeProvider ◀── useAccountPreferences ◀────┘
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

**What a fake API cannot catch** is anything about the real path: cookies, CSRF, the proxy, the order of answers. Before calling a feature done, try it in a browser against the real stack, as [C1.13.4](#c1134-language-and-theme-on-the-account) shows.

---

## C1.14 The exercise library screens

The first feature screens of the app (UI-1, [D1.4.3](../design/D1-ui.md#d143-exercise-library)–[D1.4.5](../design/D1-ui.md#d145-exercise-editor)), on the API of [C2.5.4](C2-backend.md#c254-the-exercise-librarys-endpoints) and the 876 exercises imported from free-exercise-db. How they were built, with the real output: [H3.12](../how-to/H3-frontend.md#h312-the-exercise-library-screens-as-built).

### C1.14.1 The pages and their pieces

| Route | Page | Made of |
|---|---|---|
| `/exercises` | `ExercisesPage` | `ExerciseFilters`, `ExerciseListItem`, `EmptyState`; `useExercises()` |
| `/exercises/:id` | `ExerciseDetailPage` | `ExercisePhotos`, the facts as a description list, `AlertDialog` to confirm a delete; `useExercise()`, `useDeleteExercise()` |
| `/exercises/new`, `/exercises/:id/edit` | `ExerciseEditorPage` | `ExerciseForm`, with the rules and conversions of `exercise-form.ts`; `useCreateExercise()`, `useUpdateExercise()` |

**What is not here yet,** with the feature that brings it: "Add to plan" ([UI-3](../project/backlog.md#ui-3-add-to-plan-from-an-exercises-page)), the "My history" tab (FEAT-4), photo uploads, videos and "Duplicate as mine" (BE-1, `feat/exercise-media`), the buttons disabled offline (FEAT-3).

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
| `/plans`, `/plans?archived=1` | `PlansPage` | `PlanCard`, `EmptyState`, `ComingSoon`; `usePlans()` |
| `/plans/:id`, `/plans/:id?day=2` | `PlanDetailPage` | `Tabs` (one per day), `PlanDayView` → `PlanItemRow`, `AlertDialog` to confirm a delete; `usePlan()`, `usePlanAction()`, `useDeletePlan()`, `useCurrentUser()` for the weight unit and the default rest |

```
PlanDetailPage                 the plan: header, badges, actions, notes
└── Tabs                       one tab per day, the open one from ?day=
    └── PlanDayView            "3 exercises · 7 sets", then the runs of groupSupersets()
        ├── PlanItemRow        a lone exercise
        └── <section>          a superset: a lime bar, its label, and a PlanItemRow per exercise
```

**What is not here yet,** with the feature that brings it: "Start this day" and "last used" (FEAT-3); Templates, Share, Duplicate and the Shared badge (phase 2).

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


## C1.16 The plan editor

The last part of FEAT-2 ([D1.4.8](../design/D1-ui.md#d148-plan-editor)), at `/plans/new` and `/plans/:id/edit`, on `POST` and `PUT /api/plans` ([C2.5.5](C2-backend.md#c255-the-plans-endpoints)). It is the app's largest screen: a tree of days, exercises and sets, each changed in many ways, saved in one request. How it was built, with the real output: [H3.14](../how-to/H3-frontend.md#h314-the-plan-editor-as-built).

### C1.16.1 The pieces

```
PlanEditorPage            /plans/new: an empty draft; /plans/:id/edit: reads the plan, makes a draft of it
└── PlanEditor            the draft (useReducer), kept in the browser; the sticky Save / Discard bar;
    │                     name, goal, notes; the days as tabs; "Add day"
    └── EditorDay         a day: its name, move earlier / later, delete; drag and drop (dnd-kit);
        │                 "Add exercises" (ExercisePicker); "Make a superset"
        ├── EditorItem    an exercise: drag handle, summary line; open: its sets, rest, notes,
        │   │             move to another day, leave the superset, remove
        │   └── EditorSet a set: its number, a tap cycles the type (W, D, F); its targets; remove
        └── ExercisePicker the library in a Dialog, a tick box on each row, "Add (n)"
```

| File | Holds |
|---|---|
| `components/plans/plan-draft.ts` | The draft's types, the conversions to and from the API, the rules, the reducer: no React |
| `components/plans/draft-storage.ts` | Keeping the draft in the browser |
| `components/plans/editor/*.tsx` | The components above |
| `components/ui/dialog.tsx` | shadcn/ui's Dialog, for the exercise picker |
| `api/plans.ts` | `useCreatePlan()`, `useUpdatePlan(id)`, and the types of the body (`PlanInput`) |

**What is not here,** with where it went: the desktop layout of D1.4.8, the library in a column beside the plan with exercises dragged across ([UI-2](../project/backlog.md#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan)); "Add to plan" from an exercise's page ([UI-3](../project/backlog.md#ui-3-add-to-plan-from-an-exercises-page)). On every width, exercises come from the picker window.

### C1.16.2 The draft and its reducer

The exercise editor is a form of fields side by side, and react-hook-form fits it ([C1.14.4](#c1144-the-editors-form)). A plan is a tree: a day holds exercises, an exercise holds sets, and the changes are not only typing. A set's type cycles, an exercise moves to another day, two exercises join a superset, a drag reorders a list. These are written as **actions** handled by one function, the **reducer**, with React's **`useReducer`**:

```tsx
const [draft, dispatch] = useReducer(draftReducer, initial)

dispatch({ type: 'cycleSetType', day: 0, item: 1, set: 2 })     // a tap on set 3's number
dispatch({ type: 'moveItem', day: 0, from: 3, to: 0 })           // the end of a drag
```

- **`useReducer(reducer, first)`** is `useState` for state that changes in many named ways. `dispatch(action)` asks React to call `draftReducer(draft, action)` and draw again with what it returns.
- **The reducer is a plain function** in `plan-draft.ts`, with no React, so `plan-draft.test.ts` runs every action on a draft and checks the result, without drawing anything. 17 tests do so.
- **It never changes the draft it is given.** React notices a change only when it receives a new object, so the reducer copies the draft first, with **`structuredClone()`**, the browser's deep copy, then changes the copy. The draft before stays as it was, which makes "Discard changes" a simple `dispatch({ type: 'replace', draft: initial })`.
- **The actions are a discriminated union** (`DraftAction`): each is an object whose `type` names it, and inside `case 'moveItem':` TypeScript knows the action has `from` and `to`. A misspelt action type is a type error, not a silent no-op.
- **The components hold no copy of the plan.** `EditorDay`, `EditorItem` and `EditorSet` receive their piece and `dispatch`, and send actions with their indexes (`{ day, item, set }`).
- **The draft is text, like a form.** Each target is the text typed, `"8-10"` or `"82,5"`, in the user's unit and with their decimal comma. `toPlanInput()` reads it when saving: reps into `target_reps_min` and `target_reps_max`, pounds into kilograms with three decimals (135 lb → 61.235 kg, [D3.2.3](../design/D3-data-model.md#d323-weights-are-always-in-kilograms)), only the targets that fit how the exercise is logged. `draftFromPlan()` does the opposite.
- **Supersets stay valid by themselves.** After every action the reducer runs `normalizeSupersets()` on each day: an exercise dragged away from its superset leaves it, a superset left with one exercise ends, the numbers become 1, 2, 3. The backend accepts only neighbours ([C2.5.6](C2-backend.md#c256-validating-nested-data)), and the editor can never send anything else.
- **New rows get their UUID in the browser** (`crypto.randomUUID()`), as [D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id) asks; saved rows keep theirs, so sessions of FEAT-3 stay linked.

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
- **Days** are moved with two buttons, earlier and later, and exercises to another day with a list, inside the opened exercise: both are one tap, and work the same with a keyboard.

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

1. **`validateDraft()`**, the backend's rules ([C2.5.6](C2-backend.md#c256-validating-nested-data)) checked in the browser: a name, reps as `8` or `8-10` from 1 to 999, an RPE from 1 to 10 with one decimal, a rest up to an hour… It returns a translation key per wrong field, by the field's path in the draft: `days.0.items.1.sets.2.reps`. With any error, nothing is sent: the fields turn red, a banner says so, the first day with an error opens, and its tab carries a red dot.
2. **`toPlanInput()`** builds the body, and `useCreatePlan()` sends it with `POST`, or `useUpdatePlan(id)` with `PUT` and the `version` the editor started from.
3. **A 422 from the server** carries Laravel's field names: `draftField()` turns `days.0.items.1.sets.2.target_reps_max` into `days.0.items.1.sets.2.reps`, the same indexes, since the order is the position. The message appears under that field, as the editor's own would.
4. **Success** forgets the kept draft and opens the plan's page, replacing the editor in the history (`replace: true`). On a `PUT`, the answer's `meta.changed_elsewhere` travels with the navigation, in its **`state`**:

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

---

← [D3. Data model](../design/D3-data-model.md) · [Contents](../README.md) · [C2. Backend](C2-backend.md) →
