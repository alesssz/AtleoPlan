# H3. Frontend: how to

[C1. Frontend](../concepts/C1-frontend.md) explains how the React app works. This page says **how to do things in it**: which files to create, what to write in each, which commands to run, and how to check the result. It is written for someone who has never written a React page.

**The code here has been run.** The example was built for real on this project, then removed; the outputs shown are what the commands printed. It is the React side of [H2. Backend: how to](H2-backend.md): a page at `/muscles` that lists the muscles from `GET /api/muscles`, with a form that lets admins rename one through `PATCH /api/muscles/{id}`.

**How to read this page:**

- The first time: [H3.1](#h31-before-you-start), then [H3.2](#h32-a-new-page) to [H3.5](#h35-testing-a-page) in order. Together they make a complete screen.
- Later, when you need one thing: translations [H3.6](#h36-translations), packages [H3.7](#h37-adding-an-npm-package), the browser's tools [H3.8](#h38-checking-in-the-browser) (a real phone: [H3.8.2](#h382-a-real-android-phone-over-usb)), ready-made components [H3.9](#h39-a-shadcnui-component).
- Something broke: [H3.10](#h310-when-something-goes-wrong).
- Real screens, as built: the exercise library [H3.12](#h312-the-exercise-library-screens-as-built), the plans [H3.13](#h313-the-plan-screens-as-built), the plan editor [H3.14](#h314-the-plan-editor-as-built), its two steps [H3.22](#h322-the-plan-editor-in-two-steps-as-built) and its picker's Create [H3.23](#h323-creating-an-exercise-from-the-picker-as-built), workout mode [H3.15](#h315-workout-mode-as-built).

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
// In EditorSet: a tap on the set's number
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

---

← [H2. Backend: how to](H2-backend.md) · [Contents](../README.md) · [H4. Opening the database](H4-database-tools.md) →
