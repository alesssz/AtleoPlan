# H3. Frontend: how to

[C1. Frontend](../concepts/C1-frontend.md) explains how the React app works. This page says **how to do things in it**: which files to create, what to write in each, which commands to run, and how to check the result. It is written for someone who has never written a React page.

**The code here has been run.** The example was built for real on this project, then removed; the outputs shown are what the commands printed. It is the React side of [H2. Backend: how to](H2-backend.md): a page at `/muscles` that lists the muscles from `GET /api/muscles`, with a form that lets admins rename one through `PATCH /api/muscles/{id}`.

**How to read this page:**

- The first time: [H3.1](#h31-before-you-start), then [H3.2](#h32-a-new-page) to [H3.5](#h35-testing-a-page) in order. Together they make a complete screen.
- Later, when you need one thing: translations [H3.6](#h36-translations), packages [H3.7](#h37-adding-an-npm-package), the browser's tools [H3.8](#h38-checking-in-the-browser), ready-made components [H3.9](#h39-a-shadcnui-component).
- Something broke: [H3.10](#h310-when-something-goes-wrong).

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
- [H3.8 Checking in the browser](#h38-checking-in-the-browser)
  - [H3.8.1 Phone, tablet and desktop widths](#h381-phone-tablet-and-desktop-widths)
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
      <PageHeader eyebrow={t('pages.muscles.eyebrow')} title={t('pages.muscles.title')} description={t('pages.muscles.description')} />
      {/* the content comes in H3.3 */}
    </>
  )
}
```

- **The function's name** is the file's name, in PascalCase, ending in `Page`.
- **`export`** makes it importable from other files.
- **`@/`** means `src/`, so imports do not need `../../`.
- **No text is written in the component:** every text is a key, looked up with `t()` ([H3.6](#h36-translations)).

### H3.2.2 Its texts

In **each of the four** files `src/i18n/locales/{en,it,es,de}.json`, under `pages`:

```json
"muscles": {
  "eyebrow": "Library",
  "title": "Muscles",
  "description": "The muscles the exercises work."
}
```

```json
"muscles": {
  "eyebrow": "Libreria",
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
      <Button type="submit" disabled={rename.isPending}>{t('muscles.save')}</Button>
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

A real phone is a different matter: it must reach the computer over the network, and the session cookie must accept that address. It is not set up yet.

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
| `ResizeObserver is not defined` in a test | A Radix component measures itself; jsdom has no `ResizeObserver` | `src/test/setup.ts` gives one ([H3.12.5](#h3125-the-tests-and-the-errors-met)) |
| `"undefined" is not valid JSON` from `sentBody` | No call to that path sent a body | Check the path, and that the request was sent before reading it |
| Photos do not load, 404 on `/storage/…` | No `public/storage` link on this computer | `make artisan c="storage:link"` ([H3.12.1](#h3121-the-photos-reach-the-browser)) |

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

---

← [H2. Backend: how to](H2-backend.md) · [Contents](../README.md) · [H4. Opening the database](H4-database-tools.md) →
