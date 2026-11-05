# 4. Frontend

How the React app in `frontend/` is built, why, and how to work on it. It is written for someone who knows little React, TypeScript or modern JavaScript and wants to read the code and change it with confidence. Read [4.1](#41-the-pieces)–[4.4](#44-react-from-scratch) once, in order: the pieces, the folders, what happens when the app opens, and React's few core ideas. Keep [4.12](#412-javascript-and-typescript-you-will-meet) at hand for any syntax that looks strange, and [4.9](#49-recipes) while coding.

Every source file starts with a comment saying what it is for, and the code is commented line by line ([3.2](03-conventions.md#32-code)): the files are meant to be read next to this page. The decisions behind the choices are in [2.2](02-decisions.md#22-stack); the screens they serve in [1. UI design](01-ui-design.md); setup and commands in [0.7](00-setup.md#07-creating-the-react-frontend) and [0.8](00-setup.md#08-everyday-commands).

---

## 4.1 The pieces

| Piece | Role | Where |
|---|---|---|
| **React 19** | Draws the interface out of components, functions that turn data into markup | everywhere |
| **TypeScript 6** | Types on top of JavaScript: mistakes show in the editor before the app runs | `tsconfig.app.json` (strict) |
| **Vite 8** | Development server (instant reload) and production build | `vite.config.ts` |
| **React Router 8** | Which screen each address shows, without reloading the page | `src/router.tsx` |
| **TanStack Query 5** | Fetches server data, caches it, keeps it fresh | `src/lib/query-client.ts`, `src/api/` |
| **i18next + react-i18next** | Every text in four languages | `src/i18n/` |
| **Tailwind CSS 4** | Styling with utility classes in the markup | `src/index.css` |
| **shadcn/ui** (Radix base, Nova preset) | Ready-made components (buttons, selects, cards) whose code lives in the project | `src/components/ui/` |
| **Lucide** | Icons, as React components | `lucide-react` |
| **Inter** | The font, served by the app itself (works offline) | `@fontsource-variable/inter` |
| **Vitest + Testing Library** | Tests of functions and components | `*.test.ts(x)` next to the code |
| **ESLint** (with stylistic rules) | Likely bugs and one code style, no Prettier | `eslint.config.js` |

How a request travels in development (in production Caddy takes Vite's place, [2.6](02-decisions.md#26-hosting)):

```
Browser ── http://localhost:5673 ──▶ Vite ──┬── /api/*, /sanctum/*, /storage/* ──▶ Laravel (Docker, :8500)
                                            └── everything else ──▶ the React app (index.html + JS)
```

One address for both is what lets Sanctum's login cookie work without CORS.

---

## 4.2 Folder structure

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
    │   └── health.ts         GET /api/health → useHealth()
    ├── components/
    │   ├── ui/               shadcn/ui components (generated, then ours to edit)
    │   ├── layout/           the frame: AppLayout, SideNav, BottomTabBar, nav-items
    │   └── *.tsx             components shared by several pages
    ├── pages/              one component per screen (HomePage, ProfilePage…)
    ├── i18n/
    │   ├── index.ts          i18next setup and language detection
    │   ├── languages.ts      the supported languages and their names
    │   ├── i18next.d.ts      makes translation keys type-checked
    │   └── locales/          it.json, en.json, es.json, de.json
    ├── lib/                plain helpers, no React: http (fetch wrapper), query-client, format, utils (cn)
    ├── theme/              dark / light theme: logic, context, provider, hook
    └── test/setup.ts       runs before every test file
```

**Naming.**

- **Components:** PascalCase files named after the component they export (`AppLayout.tsx` exports `AppLayout`), one main component per file, named exports (`export function X`), not `export default`.
- **Everything else:** kebab-case (`query-client.ts`, `nav-items.ts`). Hooks are `useSomething` (`useTheme.ts`).
- **shadcn/ui** files keep shadcn's own names (`button.tsx`).
- **Tests** sit next to what they test: `format.ts` → `format.test.ts`.
- **Imports** use the `@/` alias for anything outside the current folder (`@/components/ui/button`), a relative path for neighbours (`./nav-items`).

---

## 4.3 What happens when the app opens

1. The browser loads **`index.html`**. Its small inline script reads the saved theme and puts `class="dark"` on `<html>` at once, before anything is drawn, so a light-theme user never sees a dark flash.
2. `index.html` loads **`src/main.tsx`**, which:
   - imports `index.css` (Tailwind and the colour tokens);
   - imports `src/i18n`, which sets up i18next and picks the language: saved choice, else the browser's, else English;
   - tells React to draw `<App />` inside `<div id="root">`.
3. **`App.tsx`** wraps everything in the providers, from the outside in: `QueryClientProvider` (server-data cache), `ThemeProvider` (theme), `RouterProvider` (screens).
4. The **router** reads the address. On `/profile` it matches the branch whose element is `AppLayout`, and its child `profile`.
5. **`AppLayout`** draws the navigation and an `<Outlet />`; the router puts `ProfilePage` there.
6. **`ProfilePage`** draws its cards. `ServerStatus` inside it calls `useHealth()`. TanStack Query starts `GET /api/health`, and the component shows its loading skeleton. When the answer arrives, the component draws itself again with "Connected".

**Moving around.** A click on a `NavLink` does not load a new page: the router changes the address with the browser's History API and swaps the component in the `<Outlet />`. The frame, the cache and the state stay where they are.

---

## 4.4 React from scratch

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
- **Server data is not kept in state:** TanStack Query keeps it ([4.6](#46-server-data)).

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

## 4.5 Routing

- **The table** is `src/router.tsx`, made with `createBrowserRouter([...])`. A route has a `path` and an `element`. `children` nest routes inside a parent, which draws them at its `<Outlet />`. `index: true` marks the parent's own address.
- **The frame:** `AppLayout` is the parent of every signed-in page. Public pages (sign-in) and workout mode, both full screen, will be siblings of it, outside the frame. Comments in the file mark where.
- **Links:** use `<Link to="/plans">`. Use `<NavLink>` in navigation: it knows whether it is the current page and then gets `aria-current="page"`. Use `useNavigate()` to move in code, for example after saving.
- **Parameters:** a route `plans/:id` gives the page `const { id } = useParams()`.
- **Not found and crashes:** the last child, `path: '*'`, catches unknown addresses (`NotFoundPage`, inside the frame). `errorElement` (`RouteErrorPage`) replaces a screen that throws while rendering.
- **The full map** of planned routes is [1.3](01-ui-design.md#13-information-architecture-and-navigation). Each feature adds its routes there and here.

---

## 4.6 Server data

**`src/lib/http.ts`: the only door to the API.** `request<T>(path, { method, body, signal })` wraps `fetch` and:

- sends `Accept: application/json`, so Laravel answers errors as JSON;
- for `POST`, `PUT`, `PATCH` and `DELETE`, makes sure Sanctum's `XSRF-TOKEN` cookie exists (calling `/sanctum/csrf-cookie` if not) and sends it back in the `X-XSRF-TOKEN` header. That is Sanctum's CSRF protection;
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
- **Changing data** (coming with the first forms) uses `useMutation`. On success it calls `queryClient.invalidateQueries({ queryKey })`, so the lists that show that data reload.

**The `src/api/` pattern.** One file per API resource, holding:

1. the TypeScript types of what the endpoint returns;
2. its cache keys (`healthKeys`);
3. the plain function that calls it (`fetchHealth`);
4. the hooks components use (`useHealth`).

`health.ts` is the model to copy.

**Every component that reads server data handles three states:** loading (a skeleton, never a full-page spinner), error (a message and **Retry**), and success. `ServerStatus` shows all three ([1.6](01-ui-design.md#16-states-and-edge-cases)).

**Seeing the cache:** in development, the TanStack Query Devtools button (top-right corner) opens a panel. It lists every query, its key, state and data.

---

## 4.7 Translations

**No text is written in a component** ([2.4](02-decisions.md#24-languages)): every text comes from `src/i18n/locales/<language>.json` through `t()`:

```tsx
const { t, i18n } = useTranslation()
t('nav.plans')                          // "Schede" in Italian
t('placeholder.text', { section: '1.4.6' })   // fills {{section}} in the text
i18n.changeLanguage('de')               // switches every text at once
```

**The files** are nested by area, and the dotted key follows the nesting (`nav.plans` is `"nav": { "plans": … }`):

| Group | Holds |
|---|---|
| `app` | name, tagline |
| `nav` | navigation labels |
| `pages.<page>` | each page's `title` and `description` |
| `placeholder`, `preferences`, `theme`, `server` | texts of shared components |
| `errors` | not-found and crash pages |

New screens add their own group (`plans.editor.*`, …).

**Safety nets:**

- **Typed keys.** `i18next.d.ts` gives TypeScript the shape of `en.json`. `t('nav.plan')`, a typo, is a type error, and VS Code autocompletes the keys.
- **Test.** `locales.test.ts` fails if a language misses a key, has an extra or empty one, or drops a `{{placeholder}}`.

**Adding a text:** add the key to all four files, English first, then `make fe-test`. A machine translation is fine for Spanish and German until someone checks them (the same rule as the exercise library, [2.3](02-decisions.md#23-exercise-library)).

**Numbers and dates** follow the language through `Intl`, never string concatenation. Use `src/lib/format.ts`: `formatWeight(82.5, i18n.language)` gives "82,5 kg" in Italian, Spanish and German, and "82.5 kg" in English. Add more helpers there, such as dates and durations, as screens need them.

**Plurals,** when a screen needs them, use i18next's suffixes: `"sets_one": "{{count}} set"` and `"sets_other": "{{count}} sets"`, called with `t('sets', { count })`.

**Adding a language:**

1. Add its code to `SUPPORTED_LANGUAGES` and `LANGUAGE_NAMES` (`languages.ts`).
2. Add `locales/<code>.json`.
3. Import it in `i18n/index.ts` and in the test.

---

## 4.8 Styles and theme

**Tailwind.** Styling is written as classes in the markup: `className="flex items-center gap-2 text-sm"`. A few rules:

- **Mobile first.** Unprefixed classes apply everywhere; `sm:` from 640 px, `lg:` from 1024 px. For example, `hidden sm:flex` means hidden on phones, shown from tablets. These are the breakpoints of [1.7](01-ui-design.md#17-responsive-layout-and-accessibility).
- **`dark:`** applies with the dark theme. It is rarely needed, because the tokens already change.
- **Arbitrary values** go in brackets when no class exists, for example `pb-[env(safe-area-inset-bottom)]` for the iPhone's home bar.
- **The VS Code extension "Tailwind CSS IntelliSense"** autocompletes classes and shows their CSS on hover. Worth installing.

**Colour tokens.** Never write a colour in a component; use the token's class. The values are in `src/index.css`, one set per theme, from [1.5](01-ui-design.md#15-design-system):

| Token (CSS variable) | Tailwind classes | Use |
|---|---|---|
| `background` / `foreground` | `bg-background`, `text-foreground` | page and text |
| `card` | `bg-card` | cards, sheets ("surface" in 1.5) |
| `primary` | `bg-primary`, `text-primary` | main actions, the lime |
| `muted-foreground` | `text-muted-foreground` | secondary text ("muted" in 1.5) |
| `muted`, `secondary`, `accent` | `bg-muted`… | quiet backgrounds; `accent` is shadcn's hovered-item background |
| `timer` | `bg-timer`, `text-timer` | the rest timer ("accent" in 1.5, renamed to avoid shadcn's `accent`) |
| `success` / `warning` / `destructive` | `text-success`… | record / offline, pending / delete |
| `border`, `input`, `ring` | `border`, `ring` | lines, fields, focus ring |

**The theme.**

- **How it is applied:** the `dark` class on `<html>` switches every token to its dark value. `index.html` sets it before React loads, and `ThemeProvider` keeps it in step with the user's choice. With "Same as the device" (`system`), it follows the operating system live.
- **Where the choice is saved:** in this browser for now (`localStorage`, key `atleoplan.theme`). On the account with sign-in.
- **To read or change it from a component:** `useTheme()`.

**shadcn/ui.** These are not a library imported from `node_modules`. They are source files copied into `src/components/ui/`, and they are ours to change.

- **Adding one:** `npx shadcn@latest add dialog` (from `frontend/`), then `make fix` to bring the generated file to our code style (single quotes, no semicolons).
- **Their default sizes are for mouse use** (a button is 32 px tall). On touch screens use `size="lg"` or set the height yourself: tap targets are at least 48 px, and 56 px in workout mode ([1.5](01-ui-design.md#15-design-system)).
- **`cn()`** (`@/lib/utils`) joins class names, drops false ones, and resolves Tailwind conflicts: `cn('px-2', big && 'px-4')`.
- **`asChild`** lends a component's look to its child: `<Button asChild><Link to="/">…</Link></Button>` is a real link that looks like a button.

**Icons** come from Lucide: `import { Dumbbell } from 'lucide-react'`, used as `<Dumbbell aria-hidden="true" className="size-5" />`.

- An icon next to a text is decoration: `aria-hidden`.
- An icon alone in a button needs a label ([3.2](03-conventions.md#32-code)).

---

## 4.9 Recipes

**A new page:**

1. `src/pages/ThingPage.tsx`, exporting `ThingPage`, with a `PageHeader` and its content.
2. Its texts under `pages.thing` in the four locale files.
3. A route in `src/router.tsx`, inside the frame's `children`.
4. If it is a main section: an entry in `components/layout/nav-items.ts`. Both navigations update.

**Data from a new endpoint:**

1. **Backend:** the route in `backend/routes/api.php`, and a Pest test.
2. **Frontend:** `src/api/thing.ts`, copying `health.ts`, with the type, the keys, `fetchThing`, and `useThing`.
3. In the component, `const thing = useThing()`, handling `isPending`, `isError` and `data`.

**A form that saves** (from FEAT-1 on): react-hook-form and zod for the fields, `useMutation` calling `request(path, { method: 'POST', body })`, `ApiError.fieldErrors` shown under each field, and `invalidateQueries` on success.

**A new shared component:**

1. `src/components/Thing.tsx`, with a header comment, typed props, and doc comments.
2. If it holds logic worth checking, `Thing.test.tsx` next to it.

**Before calling it done:** `make fix`, then `make check`.

---

## 4.10 Tests and checks

- **Vitest** runs the tests. `jsdom` simulates a browser, so components can be rendered.
- **Testing Library** looks at the result the way a user would: `screen.getByRole('link', { name: 'Plans' })`. Query by role and visible text, never by CSS class. The test then also checks accessibility: if a test cannot find a button by its name, a screen reader cannot either.
- **Where they live:** next to the code (`*.test.ts(x)`). `src/test/setup.ts` runs first: it adds matchers such as `toBeInTheDocument()`, sets English, and cleans up after each test.

**The tests so far:**

| File | What it checks |
|---|---|
| `i18n/locales.test.ts` | the four languages have the same keys and placeholders, none empty |
| `lib/format.test.ts` | weights and numbers in each language's format |
| `components/layout/BottomTabBar.test.tsx` | five tabs, the current one marked, labels translated (the model of a component test) |

**Commands:**

| What | Command |
|---|---|
| Tests once | `make fe-test` (`npm test` in `frontend/`) |
| Tests rerun on every save | `npm run test:watch` in `frontend/` |
| Lint / fix the style | `make lint` / `make fix` |
| Types | `make typecheck` |
| Everything, backend included | `make check` |

---

## 4.11 Known limits

- **Bundle size.** The production build is one JavaScript file of about 560 kB (180 kB compressed), and Vite warns above 500 kB. When the screens grow, load each page only when opened: `lazy` routes in React Router, which split the bundle per page.
- **Not yet in place**, each with the feature that needs it:
  - sign-in and route guards (FEAT-1);
  - forms (FEAT-1);
  - drag and drop (FEAT-2);
  - the PWA and offline support (FEAT-3);
  - charts (phase 2).
- **`fsevents`'s install script** is blocked by npm's install-scripts guard. It is an optional macOS file watcher that Vite does not need. Leave it blocked.


---

## 4.12 JavaScript and TypeScript you will meet

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

← [3. Conventions](03-conventions.md) · [Contents](../README.md#documentation) · [5. Backend](05-backend.md) →
