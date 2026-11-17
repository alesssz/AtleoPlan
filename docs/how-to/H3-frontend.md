# H3. Frontend: how to

Recipes for the React app: a new page, data from the API, a form, tests, translations, packages, the browser's tools and a real phone, shadcn/ui components. The architecture they fit into is [C1. Frontend](../concepts/C1-frontend.md); the backend side of an endpoint is [H2](H2-backend.md).

## Contents

- [H3.1 Before you start](#h31-before-you-start)
- [H3.2 A new page](#h32-a-new-page)
- [H3.3 Data from a new endpoint](#h33-data-from-a-new-endpoint)
- [H3.4 A form that saves](#h34-a-form-that-saves)
- [H3.5 Testing a page](#h35-testing-a-page)
- [H3.6 Translations](#h36-translations)
- [H3.7 Adding an npm package](#h37-adding-an-npm-package)
  - [H3.7.1 A vulnerable package deep in the tree: overrides](#h371-a-vulnerable-package-deep-in-the-tree-overrides)
- [H3.8 Checking in the browser](#h38-checking-in-the-browser)
  - [H3.8.1 Phone, tablet and desktop widths](#h381-phone-tablet-and-desktop-widths)
  - [H3.8.2 A real Android phone over USB](#h382-a-real-android-phone-over-usb)
  - [H3.8.3 The README's screenshots](#h383-the-readmes-screenshots)
  - [H3.8.4 The app with no network](#h384-the-app-with-no-network)
- [H3.9 A shadcn/ui component](#h39-a-shadcnui-component)
- [H3.10 When something goes wrong](#h310-when-something-goes-wrong)
- [H3.11 Commands at a glance](#h311-commands-at-a-glance)

---

## H3.1 Before you start

- **The frontend runs on the host,** Node 24 (`.nvmrc`), not in Docker: `make start` brings up the backend and Vite at http://localhost:5673. Vite proxies `/api`, `/sanctum`, `/storage` and `/auth/` to Laravel.
- **Where each piece goes** ([C1.2](../concepts/C1-frontend.md#c12-folder-structure)): pages in `pages/`, requests and hooks in `api/`, components of one area in `components/<area>/`, logic worth testing in plain `.ts` modules next to them, texts in `i18n/locales/`, routes in `router.tsx`, tests next to what they test.
- **On Windows, start the terminal or the editor from a path with an upper-case drive letter** (`D:\`, not `d:\`): otherwise Vitest loads itself twice and every test file fails with "Vitest failed to find the runner".

---

## H3.2 A new page

1. `src/pages/ThingPage.tsx`, exporting `ThingPage`, with a `PageHeader` (main actions in `actions`; no `eyebrow` that repeats the section's name) and its content; an `EmptyState` when there is nothing yet.
2. Its texts under `pages.thing` and a group of its own, in the four locale files ([H3.6](#h36-translations)).
3. A route in `src/router.tsx`, inside the frame's `children` (behind `RequireAuth`); full-screen pages are siblings of `AppLayout`.
4. A main section also gets an entry in `components/layout/nav-items.ts`: both navigations follow.
5. Check it at the three widths, in both themes and in two languages ([H3.8](#h38-checking-in-the-browser)).

---

## H3.3 Data from a new endpoint

1. **The backend** endpoint and its test ([H2.2](H2-backend.md#h22-an-endpoint-that-reads)).
2. **`src/api/thing.ts`**: the types of the answer (mirroring the Resource), a `thingKeys` object, `fetchThing(…, signal)` with `request<T>()`, and `useThing()`. The language goes in the key whenever the server translates the answer.
3. **In the component:** a `Skeleton` while `isPending`, a message and **Retry** on `isError`, the data otherwise ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)).
4. **A list read in pages:** `useInfiniteQuery` with `placeholderData: keepPreviousData`, **Show more**, and the old rows dimmed while new ones load ([C1.20](../concepts/C1-frontend.md#c120-showing-that-something-is-loading)).
5. **Filters or an open tab** live in the address (`useSearchParams`, `replace: true`), and a value read from it is validated before use.

---

## H3.4 A form that saves

Copy `src/pages/LoginPage.tsx` ([C1.13.3](../concepts/C1-frontend.md#c1133-anatomy-of-a-form)):

1. **A zod schema** built by a function taking `t`, its messages in the four locale files; the values' type derived from it.
2. **`useForm` with `zodResolver`**, a `FormField` per field, `noValidate` on the `<form>`.
3. **A mutation** in `src/api/` (`request(path, { method, body })`) that invalidates the keys it changes, broadly.
4. **`showRequestError`** in `onError` (or around `mutateAsync`), with the server's field names as the form's, and a `FormBanner` for `errors.root`.
5. **The submit button** `pending={mutation.isPending}`.
6. **A form shaped differently from the API** (a text per line for a list, a select whose "none" is `''`) converts in a plain module (`exercise-form.ts`), tested alone.
7. **The same rules as the backend:** the limits, lengths and formats in zod match the Form Request's.

---

## H3.5 Testing a page

- **Render the real routes with a fake API:** `fakeApi({ 'GET /api/thing': { status: 200, body } })` and `renderRoutes(routes, '/thing')` from `src/test/auth-helpers.tsx`; `sentBody(fake, path)` reads what was sent. An exact query string as a key (`'GET /api/sessions?status=finished&page=2&per_page=20'`) wins over the bare path.
- **Use the page as a person would:** `userEvent`, queries by role and accessible name (`getByRole('button', { name: 'Save' })`), `findBy…` for what appears after an answer.
- **A fake that changes with the server:** when an action changes the server's state, the answers read a variable the action's answer sets, or the page sees a server that contradicts itself.
- **Plain modules** (reducers, conversions, formats) are tested as functions, with the moment passed in.
- **Prove a test can fail:** break the line it guards, see it fail, put it back. A test that still passes is checking something else.
- **Traps of the queries:**
  - an accessible name joins inline texts **without spaces** ("4Good" for `<span>4</span><span>Good</span>`): give the control an `aria-label`;
  - `getByText` reads an element's **own** text, without its children's: match a fragment with a regular expression;
  - `URLSearchParams` escapes brackets (`filter%5Bmuscle%5D`): compare with `decodeURIComponent(path)`;
  - `Intl` unit names differ between Node and the browser ("52 min" / "52 mins"): assert the number, not the unit's spelling;
  - jsdom has no layout: dnd-kit measures zero, so test the action a drag dispatches, not the drag.
- **What jsdom lacks** (`ResizeObserver`, pointer capture, `scrollIntoView`) is stubbed in `src/test/setup.ts`; a new Radix component may need one more.

---

## H3.6 Translations

1. Add the key to `en.json` first, then `it.json`, `es.json`, `de.json`, in the same place.
2. `make typecheck`: keys are typed from `en.json`, so a misspelt `t('…')` is an error.
3. `make fe-test`: `locales.test.ts` fails on a key missing in one language, an extra one, an empty one, or a `{{placeholder}}` dropped.

Values in a text: `"hint": "Numbers like {{weight}}"`, `t('…hint', { weight })`. Plurals: `_one` / `_other` with `count`. A highlighted word: `<Trans>` with a tag of our own. Spanish and German may start machine translated until someone checks them.

---

## H3.7 Adding an npm package

```sh
npm install package-name        # in frontend/; -D for development only
```

- **Commit `package.json` and `package-lock.json`.** Other clones run `make fe-install` after pulling, then restart `make dev`; until then Vite stops with `Failed to resolve import`.
- **Read `git diff package-lock.json`** before committing: what came in with it.
- **Never `npm audit fix --force`** (it can install older majors) and never `sudo npm`. `make audit` lists advisories without changing anything ([H5](H5-ci.md)).

### H3.7.1 A vulnerable package deep in the tree: overrides

When an advisory is in a transitive dependency whose parents do not accept the fixed version yet:

1. **Find it:** `npm audit`, `npm ls <package>` (npm counts every package on the path; `npm audit --json` shows the advisories themselves in `via`).
2. **Weigh it:** is it reachable in production, or only in development tools?
3. **Force the fixed version** in `package.json`, with the reason in a `"//"` field (JSON has no comments):
   ```json
   "overrides": { "minimatch": "^11.0.8" }
   ```
   Then `npm install`, `npm ls <package>`, `npm audit`, and read the lockfile's diff.
4. **Prove it still works:** `npm run lint && npm run typecheck && npx vitest run && npm run build`, and the tools that use the package on what they use it for (ESLint selects its files with `minimatch`: `npx eslint . --format json` must still list them).
5. **An advisory with no fix** that is not reachable in production is dismissed on GitHub as "risk is tolerable", with a note.
6. **Plan the removal:** a backlog entry ([OPS-5](../project/backlog.md#ops-5-drop-the-minimatch-override), [OPS-6](../project/backlog.md#ops-6-drop-the-glob-override)) to drop the override once the parents accept the fixed version.

**An override also binds the packages added later.** `glob` 11, asked for by `workbox-build`, finds no file at all with the forced `minimatch` 11, and `npm install` says nothing: the build failed with "Couldn't find configuration for either precaching or runtime caching". Hence a second override, scoped to the one parent, `"workbox-build": { "glob": "^14.0.2" }`: `glob` 14 is built on `minimatch` 11, and also fixes an advisory of 11. After adding a package, `npm ls minimatch` shows whether it brings a new user of the forced version.

---

## H3.8 Checking in the browser

- **Cookies:** `atleoplan-session` and `XSRF-TOKEN`. **Local storage:** the plan drafts and the workout in progress, under `atleoplan.*`.
- **TanStack Query Devtools** (development builds only): every query's key, state and data.
- **A 500** in the Network tab: the cause is in `backend/storage/logs/laravel.log` (`make logs`).

**Every screen,** before calling it done: in both themes, in at least two languages (Italian and German texts are longer), at the three widths.

### H3.8.1 Phone, tablet and desktop widths

| Width | What changes | Try with |
|---|---|---|
| under 640 px | Tab bar, one column | iPhone SE (375 px), iPhone 14 Pro Max (430 px) |
| 640–1024 px (`sm:`) | Icon sidebar | iPad Air (820 px) |
| from 1024 px (`lg:`) | Sidebar with labels | the window itself |

Device emulation also turns the pointer into a touch with no hover: a layout that breaks only there usually relies on hover.

### H3.8.2 A real Android phone over USB

What only a real phone shows: the screen kept on (Wake Lock), the vibration and the beep at the end of a rest, the notch, a real finger. `adb reverse` makes the phone's `localhost:5673` the computer's, so the page is a secure context and the session works as on the computer.

**Once:** *USB debugging* on in the phone's developer options, and Google's platform-tools on the host: `brew install android-platform-tools` on macOS; on Windows, from Git Bash:

```sh
curl -L -o ~/platform-tools.zip https://dl.google.com/android/repository/platform-tools-latest-windows.zip
powershell -command "Expand-Archive ~/platform-tools.zip -DestinationPath $HOME"
```

`make phone` finds `adb` on the PATH or in `~/platform-tools`. The phone shows `unauthorized` until *Allow USB debugging?* is accepted on it.

**Each time:** `make start`, the phone plugged in, `make phone`, then Chrome on the phone at `http://localhost:5673`. The forwarding lasts until the cable is unplugged. `chrome://inspect/#devices` on the host opens DevTools for the phone's tab.

**For workout mode:** screen timeout at 15 s and a workout left alone for a minute (the screen stays on); a short rest with sound and vibration on; nothing under the notch or the gesture bar.

| Symptom | Cause, fix |
|---|---|
| `adb devices` lists nothing | A charge-only cable, USB debugging off, or no debugging driver on Windows |
| `unauthorized` and no question on the phone | Unlock it; or *Revoke USB debugging authorizations*, unplug, plug again |
| *This site can't be reached*, though the host opens it | The cable was unplugged since `make phone`: run it again. Vite must listen on `127.0.0.1` (`server.host` in `vite.config.ts`): `adb reverse` does not reach `::1` |
| The sign-in fails on the phone | The address must be exactly `localhost:5673`, the one Sanctum knows |

### H3.8.3 The README's screenshots

The screenshots in `docs/screenshots/` show a demo account, never a real one: plans, names and history of real users are private ([P1.5](../project/P1-conventions.md#p15-a-public-repository)).

1. **The demo user:** in tinker, `User::firstOrCreate(['email' => 'ada@example.com'], ['name' => 'Ada', 'password' => 'password', 'locale' => 'en'])`; then `make plans-demo` gives it the two example plans, Push Pull Legs active.
2. **History to show:** one workout done through the app (Start, every set ticked, Finish), so Home suggests the next day and workout mode has last time's values.
3. **The shots:** Playwright, installed in a folder outside the repository (`npm install playwright`, `npx playwright install chromium`), signed in as Ada with `make start` running: phone screens at 390 × 844, desktop at 1280 × 800, `deviceScaleFactor: 2`, `colorScheme: 'dark'`, `locale: 'en-US'`.
4. **Hide the TanStack Query Devtools button,** which only development shows: a style `[class*="tsqd"] { display: none }` added by `context.addInitScript()`.
5. **Review each image** before committing.

### H3.8.4 The app with no network

The service worker exists only in the production build ([C1.21](../concepts/C1-frontend.md#c121-opening-with-no-network)), served by `make fe-preview` at http://localhost:4673, a port Sanctum knows too. Not on 5673: a worker registered there would keep answering in place of `make dev`.

1. `make fe-preview` (the stack up), sign in, open a few screens.
2. DevTools → **Application**: under **Service workers**, `sw.js` *activated and is running*; under **Cache storage**, `workbox-precache-v2-…` with the build's files.
3. **Network → Offline**, then reload, and open an address typed by hand (`/plans/…`): the app opens; the signed-in screens say "Can't reach the server", and open by themselves when Offline is unticked.
4. Offline, `/admin` and `/auth/google/redirect` fail as a page with no network does: they are Laravel's, never the React app.

After a new build the first reload still shows the old one (the worker swaps in the background); the next has it. To start clean: **Application → Storage → Clear site data**. On a phone, `adb reverse tcp:4673 tcp:4673` and Chrome at `http://localhost:4673` ([H3.8.2](#h382-a-real-android-phone-over-usb)).

---

## H3.9 A shadcn/ui component

```sh
npx shadcn add badge        # in frontend/
make fix                    # quotes and semicolons to our style
```

- **The file keeps shadcn's shape;** comments only on what we change ([C1.8](../concepts/C1-frontend.md#c18-styles-and-theme)).
- **Never overwrite our changed files:** a component that depends on `button.tsx` asks to overwrite it; answer no (`printf 'n\n' | npx shadcn add name`).
- **Touch sizes:** shadcn's defaults are for a mouse; use `size="xl"` (48 px) for main actions.

---

## H3.10 When something goes wrong

| Message or symptom | Cause | Fix |
|---|---|---|
| Every test file fails: "Vitest failed to find the runner" | The terminal started from `d:\` (Windows) | Start it from `D:\` |
| `Failed to resolve import "…"` after a `git pull` | A package added elsewhere is not installed | `make fe-install`, restart `make dev` |
| `Failed to resolve import "@/…"` for our file | Wrong path or case | Fix the name |
| `TS2345 … Did you mean …` on `t('…')` | A misspelt translation key | The suggested key |
| `has exactly the English keys` fails | A key missing in one language | Add it ([H3.6](#h36-translations)) |
| A Tailwind class with `[…]` does nothing | A `\'` inside the brackets: Tailwind reads the source as text | Use the other quotes |
| `Fast refresh only works when a file only exports components` | A function or constant exported from a component's file | Move it to a `.ts` module |
| The list does not update after saving | The mutation invalidates another key, or none | Invalidate the resource's root key |
| Old names after switching language | The language is not in the query key | Add it |
| 401 on every request | The session ended | Sign in again; check the cookies |
| 404 on `/api/…` | The route is missing, or the backend is down | `make artisan c="route:list --path=api"`, `make up` |
| `Port 5673 is already in use` | Another `make dev` is running (`strictPort`) | Close it |
| Photos 404 on `/storage/…` | No `public/storage` link on this computer | `make artisan c="storage:link"` |
| A page scrolls sideways on a phone, though the long names are truncated | A `grid` with no column template below `sm:`: its one column grows to the widest item | `grid-cols-1`, so the column is `minmax(0, 1fr)` |
| `make fe-preview` still shows the previous build | The page came from the old service worker; the new one took over meanwhile | Reload once more |
| `make fe-build` fails with "Couldn't find configuration for either precaching or runtime caching" | Workbox found no file: a `glob` the forced `minimatch` breaks ([H3.7.1](#h371-a-vulnerable-package-deep-in-the-tree-overrides)) | `npm ls glob`: workbox-build's must be 14 |
| A tab bar with no tab selected | `Tabs`' `value` matches no trigger | Validate the value read from the address |
| The editor brings back old changes | A draft kept from an earlier visit | **Discard changes**, or clear `atleoplan.planDraft.…` |
| `Found multiple elements with the role "button" and name "Save"` | The same control drawn twice | One of each: it confuses screen readers too |
| `target.hasPointerCapture is not a function`, `ResizeObserver is not defined` | jsdom lacks what a Radix component calls | Stub it in `src/test/setup.ts` |
| `"undefined" is not valid JSON` from `sentBody` | No call to that path sent a body | Check the path, and that the request was sent |
| `ReferenceError: vi is not defined` | `vi` not imported | `import { vi } from 'vitest'` |

Setup problems: [S1.10](../start/S1-setup.md#s110-troubleshooting).

---

## H3.11 Commands at a glance

| What | Command |
|---|---|
| Backend and Vite | `make start` (or `make up`, then `make dev`) |
| Tests once, at every save, one file | `make fe-test`, `npm run test:watch`, `npx vitest run src/pages/X.test.tsx` |
| Types, style, fixes | `make typecheck`, `make lint`, `make fix` |
| A package | `npm install name` in `frontend/`; after a pull, `make fe-install` |
| A shadcn/ui component | `npx shadcn add name`, then `make fix` |
| Production build | `make fe-build` |
| The build with its service worker, http://localhost:4673 ([H3.8.4](#h384-the-app-with-no-network)) | `make fe-preview` |
| A real phone | `make phone` |
| Example data | `make exercises-import`, then `make plans-demo` |
| Every check, backend included | `make check` |

---

← [H2. Backend: how to](H2-backend.md) · [Contents](../README.md) · [H4. Opening the database](H4-database-tools.md) →
