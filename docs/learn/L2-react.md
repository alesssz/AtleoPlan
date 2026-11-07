# L2. React course

A course on **React and the libraries around it**, the ones AtleoPlan's frontend uses, in the order in which it makes sense to learn them. Each lesson explains one idea, shows where the app uses it, has you try it, and ends with a recap and a small exercise. It is the companion of [L1. Laravel course](L1-laravel.md), and works the same way.

**How it differs from the other documents.** [C1. Frontend](../concepts/C1-frontend.md) explains how *this app* is built, and [H3](../how-to/H3-frontend.md) gives recipes for *this app*. This course teaches the tools themselves, and keeps apart what is React, what is a library chosen by the project, and what is our own convention.

**The examples have been run.** The running example below was built for real in the app, tested, then removed. The outputs shown are what the commands printed, on React 19.3, TypeScript 6.0, Vite 8, Vitest 5 and Node 24.

## Contents

- [L2.1 How this course works](#l21-how-this-course-works)
- [L2.2 JavaScript and TypeScript for React](#l22-javascript-and-typescript-for-react)
- [L2.3 Vite, npm and the shape of the project](#l23-vite-npm-and-the-shape-of-the-project)
- [L2.4 Components and JSX](#l24-components-and-jsx)
- [L2.5 Props](#l25-props)
- [L2.6 Lists, keys and conditions](#l26-lists-keys-and-conditions)
- [L2.7 State and events](#l27-state-and-events)
- [L2.8 Effects](#l28-effects)
- [L2.9 Hooks: the rules, and your own](#l29-hooks-the-rules-and-your-own)
- [L2.10 Context](#l210-context)
- [L2.11 Routing: React Router](#l211-routing-react-router)
- [L2.12 Server data: TanStack Query](#l212-server-data-tanstack-query)
- [L2.13 Changing data: mutations](#l213-changing-data-mutations)
- [L2.14 Forms: react-hook-form and zod](#l214-forms-react-hook-form-and-zod)
- [L2.15 Translations: react-i18next](#l215-translations-react-i18next)
- [L2.16 Styles: Tailwind CSS](#l216-styles-tailwind-css)
- [L2.17 Ready-made components: shadcn/ui, Radix, lucide](#l217-ready-made-components-shadcnui-radix-lucide)
- [L2.18 Tests: Vitest and Testing Library](#l218-tests-vitest-and-testing-library)
- [L2.19 The checks: TypeScript and ESLint](#l219-the-checks-typescript-and-eslint)
- [L2.20 What React has that the project does not use yet](#l220-what-react-has-that-the-project-does-not-use-yet)
- [L2.21 What in this project is not plain React](#l221-what-in-this-project-is-not-plain-react)
- [L2.22 Final exercise and clean-up](#l222-final-exercise-and-clean-up)
- [L2.23 Where to go next](#l223-where-to-go-next)

## L2.1 How this course works

**For whom.** Someone who can program, maybe in PHP or another language, but has written little modern JavaScript and no React. Have the app running first ([S1. Setup](../start/S1-setup.md)): `make start`, then http://localhost:5673.

**The structure of each lesson:**
1. **The idea:** what the thing is, and why it exists.
2. **In AtleoPlan:** the files that use it, to read after the lesson.
3. **Try it:** a small example, with the real output.
4. **Recap:** the few things to remember.
5. **Exercise:** a short task, with the solution hidden under "Solution". Try first, then open it.

**Labels.** React alone is small: it draws components and remembers their state. Everything else, the routes, the server data, the forms and the styles, comes from other libraries. Each lesson opens with a label, so you always know what you are learning:

| Label | Means | Example |
|---|---|---|
| **React** | The `react` library itself, documented on react.dev | Components, JSX, state, effects, context |
| **Language** | JavaScript, TypeScript, the browser's own features | `map`, `async`/`await`, `fetch`, types |
| **Tool** | A program that builds, checks or tests the code | Vite, TypeScript's compiler, ESLint, Vitest |
| **Library** | A package chosen by the project, from someone else | React Router, TanStack Query, react-i18next, react-hook-form, zod, Tailwind, shadcn/ui |
| **AtleoPlan** | A choice of this project, built from the pieces above | The files of `src/api/`, `request()`, `FormField`, the test helpers |

**The running example: a muscles page.** Through the course we build a page that the app does not have: `/muscles`, the list of muscle groups, read from the real endpoint `GET /api/muscles`. Every lesson adds one piece: a card component, the list, a search box, a page per muscle, the data from the server, the texts in four languages, the styles, the tests. Two small extras serve the lessons that need them: a **rest timer** for effects, and a one-field **"add an exercise" form** for changing data.

**Follow along on a throwaway branch,** and keep the example's files in one folder, `src/learn/`, so they are easy to delete at the end ([L2.22](#l222-final-exercise-and-clean-up)):

```sh
git switch main
git switch -c learn/muscles    # a branch of your own; never pushed, never merged
```

**Tools to have open:**
- **The app** at http://localhost:5673, after `make start`. A saved file shows in the browser at once, without reloading (Vite's "hot module replacement").
- **The browser's developer tools** (F12): *Console* for errors, *Network* for the API calls ([H3.8](../how-to/H3-frontend.md#h38-checking-in-the-browser)).
- **React Developer Tools**, a browser extension: shows the components, their props and their state.
- **TanStack Query's panel**, the round button at the top right of the app in development: shows the server data in the cache.
- **The tests**, from `frontend/`: `npx vitest run src/learn`, or `npm run test:watch` to rerun them on every save.

**Commands run on the computer**, not in Docker: the frontend runs on Node directly. From the repository root, `make` wraps them (`make fe-test`, `make lint`, `make typecheck`); inside `frontend/`, `npm …` and `npx …` work as in any project.

---

## L2.2 JavaScript and TypeScript for React

**Language** · [javascript.info](https://javascript.info), [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

**The idea.** React code is mostly plain modern JavaScript: arrays transformed with `map` and `filter`, objects taken apart and copied, functions passed around. TypeScript adds **types** on top: labels saying what a value is, checked while you type and removed before the code runs. [C1.12](../concepts/C1-frontend.md#c112-javascript-and-typescript-you-will-meet) has the complete table; here are the pieces you meet in every component, run for real with Node.

**Arrays.** Most of React's lists are arrays transformed into elements:

```js
const sets = [{ kg: 80, reps: 8 }, { kg: 85, reps: 6 }, { kg: 90, reps: 3 }]

sets.map(s => s.kg * s.reps)                    // [ 640, 510, 270 ]: one result per item
sets.filter(s => s.reps >= 6).map(s => s.kg)    // [ 80, 85 ]: keep some, then transform
sets.find(s => s.kg === 85)?.reps               // 6: the first match, or undefined
```

`s => s.kg * s.reps` is an **arrow function**: parameter, arrow, result. `?.` stops at `undefined` instead of failing.

**Taking objects and arrays apart** ("destructuring"), and copying them ("spread"):

```js
const { kg, reps } = sets[0]                    // 80 8: fields by name
const [first, ...rest] = sets                   // first.kg 80, rest.length 2: items by position
const user = { name: 'Ann', theme: 'dark' }
const changed = { ...user, theme: 'light' }     // { name: 'Ann', theme: 'light' }: a copy with one change
user.theme                                      // 'dark': the original is untouched
```

That last line is the heart of React's state ([L2.7](#l27-state-and-events)): you never change an object, you make a changed copy.

**Defaults and text:**

```js
const nobody = null
nobody?.name                                    // undefined
nobody?.name ?? 'guest'                         // 'guest': ?? gives a value for null or undefined
`Hi ${user.name}!`                              // 'Hi Ann!': backticks insert values
0 || 'zero is falsy'                            // 'zero is falsy': || also replaces 0 and ''
0 ?? 'only null/undefined'                      // 0: ?? does not
```

**Code that waits.** A request to the server answers later. An `async` function can `await` such an answer without freezing the page:

```js
async function load() {
  await new Promise(resolve => setTimeout(resolve, 10))    // wait 10 ms
  return 42
}
load().then(v => console.log('g>', v))
console.log('h>', 'printed first')
```

```
h> printed first
g> 42
```

The line after the call ran first: `load()` started, paused at `await`, and the rest of the program went on.

**TypeScript** adds types to the same code:

```ts
interface Muscle {                    // the shape of an object
  id: number
  slug: string
  name: string
  description?: string                // ?: optional
}

function label(muscle: Muscle): string {     // typed parameter and result
  return `${muscle.name} (${muscle.slug})`
}

type Theme = 'dark' | 'light' | 'system'     // a union: one of these exact strings
```

A mistake is caught before the code runs, by the editor and by `npm run typecheck` ([L2.19](#l219-the-checks-typescript-and-eslint)).

**Modules.** Each file is a module: it `export`s what others may use, and `import`s what it needs.

```ts
export function label(…) { … }                       // in src/learn/label.ts
import { label } from '@/learn/label'                // elsewhere; '@/' means 'src/'
import type { Muscle } from '@/api/muscles'          // a type only: removed from the running code
```

**In AtleoPlan:** `src/lib/http.ts` uses nearly all of it (classes, `async`, generics, `??`), with a comment on each piece; `src/i18n/languages.ts` shows `as const` and a type guard.

**Recap**
- `map`, `filter`, `find` on arrays; arrow functions everywhere.
- Destructuring takes values out; spread makes changed copies.
- `?.` and `??` deal with missing values; `async`/`await` with values that arrive later.
- TypeScript: `interface`, unions, typed parameters; checked, then removed.

**Exercise.** With `sets`, compute the total volume (kilograms times repetitions, summed) in one expression.

<details>
<summary>Solution</summary>

```js
sets.reduce((sum, s) => sum + s.kg * s.reps, 0)    // 1420
```

`reduce` walks the array carrying a value: it starts at `0` and adds each set's volume. `sets.map(s => s.kg * s.reps)` and then a sum would work too.
</details>

---

## L2.3 Vite, npm and the shape of the project

**Tool** · [Vite](https://vite.dev/guide/)

**The idea.** Browsers do not understand TypeScript or JSX, and loading hundreds of small files would be slow. **Vite** fixes both: in development it serves the files translated on the fly, and refreshes the page as you save; for production (`npm run build`) it bundles everything into a few small files. **npm** installs the libraries listed in `package.json` into `node_modules/`.

**The scripts** of `frontend/package.json`, run with `npm run <name>`:

| Script | Does | From the root |
|---|---|---|
| `dev` | Starts Vite at http://localhost:5673 | `make dev` |
| `build` | Checks the types, then bundles into `dist/` | `make fe-build` |
| `lint` | ESLint | `make lint` |
| `typecheck` | TypeScript's checks | `make typecheck` |
| `test` / `test:watch` | Vitest, once / on every save | `make fe-test` |

**Three settings of `vite.config.ts` worth knowing:**

```ts
resolve: { alias: { '@': '…/src' } },        // '@/components/x' means 'src/components/x'
server: {
  port: 5673,
  proxy: { '/api': 'http://localhost:8500' }, // a request to /api goes on to Laravel
},
test: { environment: 'jsdom', … },           // Vitest's settings live here too
```

The **proxy** is why the app calls `/api/muscles` without an address: the browser asks Vite, and Vite passes the request to Laravel. Same address, so the session cookie travels along ([C1.1](../concepts/C1-frontend.md#c11-the-pieces)).

**From `index.html` to the screen:** `index.html` loads `src/main.tsx`, which draws `<App />` inside `<div id="root">`. `App` wraps everything in the **providers** (server data, theme, router), and the router draws the page of the current address. [C1.3](../concepts/C1-frontend.md#c13-what-happens-when-the-app-opens) follows it step by step.

**The folders** (the full map: [C1.2](../concepts/C1-frontend.md#c12-folder-structure)):

| Folder | Holds |
|---|---|
| `src/pages/` | One component per screen |
| `src/components/` | Pieces shared by the screens; `ui/` holds the shadcn/ui ones |
| `src/api/` | One file per resource of the API: types, cache keys, hooks |
| `src/lib/` | Plain TypeScript: the HTTP client, formatting, dates |
| `src/i18n/` | Translations |
| `src/routes/` | The guards around the routes |
| `src/theme/` | The dark and light theme |
| `src/test/` | What the tests share |

**`import.meta.env.DEV`** is `true` while running `npm run dev`, and `false` in the production bundle: `App.tsx` uses it to show TanStack Query's panel in development only.

**In AtleoPlan:** `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, each commented line by line.

**Recap**
- Vite serves and refreshes in development, bundles for production.
- `@/` is `src/`; `/api` is passed to Laravel by the proxy.
- `npm run dev | build | lint | typecheck | test`, or the `make` targets from the root.

**Exercise.** The running example's API file will be `src/api/muscles.ts`, and it calls `/api/muscles`. Which address of which program answers that call in development?

<details>
<summary>Solution</summary>

The browser asks Vite at `localhost:5673/api/muscles`; Vite's proxy forwards it to Laravel at `localhost:8500/api/muscles`, the `backend` container, where `MuscleController::index` answers. In production Caddy does Vite's job ([D2.6](../design/D2-decisions.md#d26-hosting)).
</details>

---

## L2.4 Components and JSX

**React** · [Your first component](https://react.dev/learn/your-first-component), [Writing markup with JSX](https://react.dev/learn/writing-markup-with-jsx)

**The idea.** A React interface is a tree of **components**. A component is a function, with a name starting with a capital letter, that returns a description of what to draw. That description is written in **JSX**: HTML-like tags inside JavaScript.

```tsx
export function MusclesTitle() {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold">Muscles</h1>
      <p>The muscle groups of the library.</p>
    </header>
  )
}
```

Used like a tag, anywhere: `<MusclesTitle />`.

**JSX is not HTML.** The differences you meet first:

| JSX | Why |
|---|---|
| `className="…"` | `class` is a reserved word in JavaScript |
| `{expression}` | Inserts a JavaScript value: `{muscle.name}`, `{count + 1}` |
| `onClick={() => …}` | Events take a function, not a string |
| `<Input />` | Every tag closes; empty ones close themselves |
| `<>…</>` | A Fragment: several elements without a wrapping `<div>` |
| `{/* … */}` | A comment |
| One root | A component returns one element; wrap siblings in a Fragment |

**A component re-runs** whenever React draws it again: its whole body runs, top to bottom, and returns a new description. React compares it with the previous one and changes only what differs in the page. Keep the body free of side effects; [L2.8](#l28-effects) says where they go.

**Components nest.** A page is made of smaller components, made of smaller ones. In the running example: the page `MusclesPage` uses `PageHeader`, an `Input`, and one `MuscleCard` per muscle.

**In AtleoPlan:** `src/pages/ExercisesPage.tsx` (a page built from three components), `src/components/PageHeader.tsx` (a small shared one), `src/components/EmptyState.tsx`.

**Recap**
- A component = a capitalised function returning JSX.
- `className`, `{…}` for values, functions for events, every tag closed.
- The body runs on every draw: keep it a pure description.

**Exercise.** Write a component `MineBadge` that draws a small rounded label with the text "Mine".

<details>
<summary>Solution</summary>

```tsx
export function MineBadge() {
  return <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">Mine</span>
}
```

In the real app the text would come from the translations ([L2.15](#l215-translations-react-i18next)): `{t('exercises.mine')}`.
</details>

---

## L2.5 Props

**React** (props) · **Language** (TypeScript interfaces) · [Passing props to a component](https://react.dev/learn/passing-props-to-a-component)

**The idea.** **Props** are a component's inputs, written as attributes on its tag. They arrive as one object, which our code takes apart in the parameter list; an `interface` above the component types them. A component never changes its own props: its parent decides them.

**The first piece of the running example**, `src/learn/MuscleCard.tsx`:

```tsx
import type { Muscle } from '@/api/muscles'

/** Props of MuscleCard. */
interface MuscleCardProps {
  /** The muscle to show. */
  muscle: Muscle
  /** Whether it is the selected one. */
  selected: boolean
  /** Called when the card is clicked: a function as a prop. */
  onSelect: (muscle: Muscle) => void
}

/** One muscle, as a button that can be selected. */
export function MuscleCard({ muscle, selected, onSelect }: MuscleCardProps) {
  return (
    <button type="button" aria-pressed={selected} onClick={() => onSelect(muscle)}>
      {muscle.name}
    </button>
  )
}
```

```tsx
<MuscleCard muscle={chest} selected={false} onSelect={m => console.log(m.name)} />
```

- **Data flows down** through props: the parent gives `muscle` and `selected`.
- **Events flow up** through functions passed as props: the card calls `onSelect`, and the parent decides what happens.
- **TypeScript checks every use.** A wrong prop is an error in the editor, before the app runs ([L2.19](#l219-the-checks-typescript-and-eslint) shows the real message).

**`children`** is the special prop holding what is written between the opening and closing tags:

```tsx
function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border p-4">{children}</div>
}

<Card><p>Anything here arrives as children</p></Card>
```

**Optional props and defaults:** `today?: Date` in the interface, and `{ today = new Date() }` in the parameters, as `WeekStrip` does.

**In AtleoPlan:** `src/components/SettingRow.tsx` (props including `children`, an icon component as a prop), `src/components/FormField.tsx` (all the props of an `<input>` passed through with `...inputProps`), `src/components/home/WeekStrip.tsx` (a default value).

**Recap**
- Props are attributes; an `interface` lists them; destructured in the parameters.
- Data down as values, events up as functions.
- `children` is what sits between the tags.

**Exercise.** Add an optional prop `hint?: string` to `MuscleCard`, shown in small text under the name only when given.

<details>
<summary>Solution</summary>

```tsx
interface MuscleCardProps {
  // …the three props above
  /** A line under the name; none by default. */
  hint?: string
}

export function MuscleCard({ muscle, selected, onSelect, hint }: MuscleCardProps) {
  return (
    <button type="button" aria-pressed={selected} onClick={() => onSelect(muscle)}>
      {muscle.name}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </button>
  )
}
```

`{hint && …}` draws the line only when `hint` has a value: the next lesson explains it.
</details>

---

## L2.6 Lists, keys and conditions

**React** · [Conditional rendering](https://react.dev/learn/conditional-rendering), [Rendering lists](https://react.dev/learn/rendering-lists)

**The idea.** JSX has no `if` and no `for`. You use JavaScript instead: `map` turns an array into elements, `&&` and `? :` choose what to draw.

**A list:**

```tsx
<ul className="grid grid-cols-2 gap-3">
  {muscles.map(muscle => (
    <li key={muscle.id}>
      <MuscleCard muscle={muscle} selected={selected?.id === muscle.id} onSelect={setSelected} />
    </li>
  ))}
</ul>
```

**`key`** is required on each item of a list, and must be unique among its siblings and stable over time. React uses it to tell items apart when the list changes: which one moved, which one is new. Use the item's id. The index (`key={i}`) breaks as soon as the list is filtered or reordered, because the third item is then a different muscle with the same key.

**Conditions:**

| Write | Draws |
|---|---|
| `{selected && <Link …/>}` | The link only when `selected` is set |
| `{visible.length === 0 ? <p>None</p> : <ul>…</ul>}` | One or the other |
| `if (muscles.isPending) return <Skeleton />` | Before the main `return`: a whole different drawing |

**The `&&` trap with numbers:** `{count && <p>…</p>}` draws a literal **0** when `count` is 0, because `0 && …` is `0`, and React draws numbers. Write `{count > 0 && …}`.

**In AtleoPlan:** `BottomTabBar` (`NAV_ITEMS.map` with `key={item.to}`), `ServerStatus` (an early `return` while loading, then `&&` and `? :`), `WeekStrip` (`days.map`, with a computed key).

**Recap**
- `array.map(item => <X key={item.id} … />)`; the key is an id, never the index of a list that changes.
- `&&` for "only if", `? :` for "this or that", an early `return` for whole states.
- Beware `0 &&`.

**Exercise.** Why would `key={index}` be a bug in the running example, where the list is filtered by a search box?

<details>
<summary>Solution</summary>

Typing "ceps" turns the list Biceps, Chest, Triceps into Biceps, Triceps. With index keys, Triceps now has key `1`, the key Chest had: React thinks the second item is still the same one and reuses its element, along with any state inside it, such as a selection or an animation. With `key={muscle.id}`, React knows Chest left and Triceps moved.
</details>

---
## L2.7 State and events

**React** · [State: a component's memory](https://react.dev/learn/state-a-components-memory), [Responding to events](https://react.dev/learn/responding-to-events)

**The idea.** A component's local variables start again on every draw. **State** is the memory that survives: `useState` gives the current value and a function to change it. Calling that function makes React draw the component again, with the new value.

**The page of the running example**, `src/learn/MusclesPage.tsx`, with two pieces of state:

```tsx
import { useState } from 'react'

export function MusclesPage() {
  const muscles = useMuscles()                              // server data (L2.12)
  // What the user typed in the search box
  const [search, setSearch] = useState('')
  // The muscle clicked last, or null. <Muscle | null>: the type of the state
  const [selected, setSelected] = useState<Muscle | null>(null)

  if (muscles.isPending) return <Skeleton role="status" className="h-40 w-full" />
  if (muscles.isError) return <p role="alert">The muscles could not be loaded.</p>

  // Derived from state and data: computed on each draw, never stored
  const visible = muscles.data.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      {/* A controlled input: React gives the value, and is told of each change */}
      <Input aria-label="Search muscles" value={search} onChange={event => setSearch(event.target.value)} />
      <p>{visible.length} muscles</p>
      <ul>
        {visible.map(muscle => (
          <li key={muscle.id}>
            {/* setSelected is passed as the card's onSelect */}
            <MuscleCard muscle={muscle} selected={selected?.id === muscle.id} onSelect={setSelected} />
          </li>
        ))}
      </ul>
      {selected && <Link to={`/muscles/${selected.slug}`}>Open {selected.name}</Link>}
    </>
  )
}
```

**What happens when the user types "c":**
1. The input calls `onChange` with the event; the function calls `setSearch('c')`.
2. React draws `MusclesPage` again. This time `useState('')` returns `'c'`.
3. `visible` is computed again from the new `search`; the list shows fewer cards.

**The rules of state:**
- **Never change it directly.** `search = 'c'` or `selected.name = 'x'` changes nothing on screen. Call the setter, with a new value; for objects and arrays, a changed copy: `setItems([...items, newItem])`.
- **The new value arrives on the next draw.** Right after `setSearch('c')`, `search` in the current code is still the old value.
- **To compute from the previous value,** pass a function: `setLeft(current => current - 1)`. It always gets the latest value, even when several changes come close together.
- **Do not store what can be computed.** `visible` comes from `search` and the data: a third `useState` for it would have to be kept in step, and would fall behind.
- **Server data does not go in state.** TanStack Query keeps it ([L2.12](#l212-server-data-tanstack-query)).

**Events** are props whose names start with `on`: `onClick`, `onChange`, `onSubmit`. They take a function, which receives the event: `event.target.value` is the input's text.

**Controlled inputs.** An input whose `value` comes from state, and whose `onChange` updates that state, is *controlled*: React holds the truth. That is how the search box works, and how `LanguageSelect` and `ThemeSelect` work. Forms with many fields use react-hook-form instead ([L2.14](#l214-forms-react-hook-form-and-zod)).

**In AtleoPlan:** `src/theme/ThemeProvider.tsx` (the one `useState` of the app so far, with a function as its first value); the controlled selects of `LanguageSelect` and `ThemeSelect`.

**Recap**
- `const [value, setValue] = useState(initial)`; the setter redraws.
- New values, never changes in place; a function when it depends on the previous value.
- Compute what can be computed; keep server data out of state.

**Exercise.** Add a "Clear" button next to the search box that empties it.

<details>
<summary>Solution</summary>

```tsx
<Button variant="outline" onClick={() => setSearch('')} disabled={search === ''}>Clear</Button>
```

The input follows by itself: its `value` is `search`.
</details>

---

## L2.8 Effects

**React** · [Synchronizing with effects](https://react.dev/learn/synchronizing-with-effects), [You might not need an effect](https://react.dev/learn/you-might-not-need-an-effect)

**The idea.** A component's body must only describe the screen. Code that talks to the world outside React (a timer, the page's title, a browser event, an element of the page) goes in an **effect**: a function React runs **after** drawing, and again when one of the values it depends on changes.

```tsx
useEffect(() => {
  // runs after drawing, and again when `a` or `b` changes
  return () => { /* cleanup: undoes what the effect set up */ }
}, [a, b])          // the dependencies: every value from the component the effect uses
```

**The rest timer of the running example**, `src/learn/RestTimer.tsx`:

```tsx
export function RestTimer({ seconds }: RestTimerProps) {
  // The seconds still to go
  const [left, setLeft] = useState(seconds)
  // Whether the button was pressed
  const [started, setStarted] = useState(false)
  // Derived, not stored: running while started and not at zero
  const running = started && left > 0

  useEffect(() => {
    if (!running) return
    // In one second, one second less. The new `left` runs the effect again
    const id = setTimeout(() => setLeft(current => current - 1), 1000)
    // The cleanup: cancels the timeout if the component disappears first
    return () => clearTimeout(id)
  }, [running, left])

  return (
    <div className="flex items-center gap-4">
      <span role="timer">{left}</span>
      <Button onClick={() => { setLeft(seconds); setStarted(true) }} disabled={running}>Start rest</Button>
    </div>
  )
}
```

The timer is the outside world here: the effect sets it up, the cleanup cancels it. Without the cleanup, leaving the page during a rest would leave a timeout changing the state of a component that no longer exists.

**The first version was wrong**, and ESLint said so. It stored `running` in state, and stopped it with a second effect:

```tsx
useEffect(() => {
  if (left <= 0) setRunning(false)
}, [left])
```

```
8:20  error  Error: Calling setState synchronously within an effect can trigger cascading renders
…
   7 |   useEffect(() => {
>  8 |     if (left <= 0) setRunning(false)
     |                    ^^^^^^^^^^ Avoid calling setState() directly within an effect
  react-hooks/set-state-in-effect
```

An effect that only keeps one state in step with another is a value to **compute**: `const running = started && left > 0`. One state less, one effect less, and no draw in between where the two disagree.

**When not to use an effect:**
- **Values computed from props or state:** compute them in the body (`visible`, `running`).
- **Reacting to a click:** do it in the event handler.
- **Fetching data:** TanStack Query does it, with caching and cancelling ([L2.12](#l212-server-data-tanstack-query)).

**StrictMode runs effects twice** in development (`src/main.tsx`): set up, clean up, set up again. It is on purpose, to show effects whose cleanup is missing or wrong. Production runs them once.

**In AtleoPlan:** `src/theme/ThemeProvider.tsx` (applies the theme to `<html>`, and its cleanup stops listening to the device's theme), `src/routes/useAccountPreferences.ts` (applies the account's language and theme when they arrive).

**Recap**
- Effects are for the outside world; they run after drawing, again when a dependency changes.
- Return a cleanup for anything that keeps running: timers, listeners.
- List every dependency; compute instead of syncing state with an effect.

**Exercise.** Make the phone vibrate when the timer reaches zero (`navigator.vibrate?.(200)`; the `?.` skips browsers that cannot).

<details>
<summary>Solution</summary>

```tsx
useEffect(() => {
  if (started && left === 0) navigator.vibrate?.(200)
}, [started, left])
```

An effect is right here: vibrating is the outside world, and nothing in it sets state, so ESLint has nothing to say.
</details>

---

## L2.9 Hooks: the rules, and your own

**React** · [Rules of hooks](https://react.dev/reference/rules/rules-of-hooks), [Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

**The idea.** Functions whose name starts with `use` are **hooks**: they plug a component into something React keeps for it (state, effects, context) or into a library (the cache, the router, the translations). React identifies each hook by the **order** in which a component calls them, so the order must be the same on every draw.

**The two rules,** checked by ESLint:
1. **Call hooks only at the top level** of a component or of another hook: not inside an `if`, a loop, or an event handler.
2. **Call them only from components or hooks,** not from plain functions.

A `useState` inside an `if`, and ESLint's real answer:

```tsx
if (show) {
  const [value] = useState(0)
  …
}
```

```
15:21  error  React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
```

Call the hook first, then decide: `const [value] = useState(0); if (!show) return null`. This is also why, in `MusclesPage`, every hook comes before the early `return`s.

**Your own hooks** are functions that call hooks, named `use…`. They package some logic for reuse; every component that calls one gets its own state.

```tsx
// src/api/muscles.ts: the running example's hook for the server data (L2.12)
export function useMuscles() {
  return useQuery({ … })
}
```

**React's hooks used in the app:**

| Hook | For | Where |
|---|---|---|
| `useState` | A remembered value | `ThemeProvider` |
| `useEffect` | Talking to the outside world | `ThemeProvider`, `useAccountPreferences` |
| `useContext` | Reading a context ([L2.10](#l210-context)) | `useTheme` |
| `useMemo` | Keeping a computed object the same between draws | `ThemeProvider` |
| `useId` | A unique id, to link a `<label>` to its field | `FormField`, `ProfilePage` |

The others come from libraries: `useTranslation`, `useQuery`, `useMutation`, `useForm`, `useNavigate`, `useParams`, `useLocation`. Ours: `useTheme`, `useHealth`, `useCurrentUser`, `useSignIn`…

**In AtleoPlan:** `src/theme/useTheme.ts` (a small hook around `useContext`), `src/routes/useAccountPreferences.ts` (a hook made of other hooks), every `use…` in `src/api/`.

**Recap**
- Hooks at the top level, always in the same order; only in components and hooks.
- Your own hook = a `use…` function that calls hooks.

**Exercise.** Write a hook `useDocumentTitle(title)` that sets the browser tab's title, and use it in `MusclesPage`.

<details>
<summary>Solution</summary>

```tsx
import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title
  }, [title])
}

// in MusclesPage, with the other hooks, before any return
useDocumentTitle(t('learn.muscles.title'))
```

`document.title` is the outside world, so an effect. With `[title]`, it runs again when the language changes.
</details>

---

## L2.10 Context

**React** · [Passing data deeply with context](https://react.dev/learn/passing-data-deeply-with-context)

**The idea.** Passing a value through props, from the top of the app down to a button ten levels below, means every component in between carries a prop it does not use. **Context** shares a value with a whole part of the tree: a **provider** puts it in, and any component below reads it with `useContext`. When the value changes, the readers draw again.

**The theme, the app's one context,** in three files:

```tsx
// 1. src/theme/ThemeContext.ts: create it, with null outside any provider
export const ThemeContext = createContext<ThemeContextValue | null>(null)

// 2. src/theme/ThemeProvider.tsx: hold the state, put it in
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  // useMemo: the same object between draws, unless theme changes,
  // or every reader would draw again on every draw of the provider
  const value = useMemo(() => ({ theme, setTheme: … }), [theme])
  return <ThemeContext value={value}>{children}</ThemeContext>
}

// 3. src/theme/useTheme.ts: read it, with a clear error outside the provider
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme() must be used inside <ThemeProvider>')
  return context
}
```

`App.tsx` wraps the whole app in `<ThemeProvider>`, so any component can write `const { theme, setTheme } = useTheme()`.

**React 19:** the context itself is the provider (`<ThemeContext value={…}>`). Older code and most tutorials write `<ThemeContext.Provider value={…}>`; both work.

**Libraries use the same mechanism:** `QueryClientProvider` (the cache), `RouterProvider` (the router). That is why tests wrap the page in the same providers ([L2.18](#l218-tests-vitest-and-testing-library)).

**When to use it:** values the whole app needs, which change rarely: theme, signed-in user, language. Not for server data (TanStack Query) nor for state used by one page.

**Recap**
- `createContext` → a provider puts a value in → `useContext` reads it below.
- Wrap the reading in a hook of your own, with an error outside the provider.
- `useMemo` the value, or every reader draws again with the provider.

**Exercise.** In `MusclesPage`, show "Dark theme" or "Light theme" under the title, from the user's choice ("system" counts as either).

<details>
<summary>Solution</summary>

```tsx
const { theme } = useTheme()        // with the other hooks, at the top

<p className="text-sm text-muted-foreground">{theme === 'light' ? 'Light theme' : 'Dark theme'}</p>
```

For a real screen the two texts would go in the translations. "system" here shows "Dark theme"; telling the device's real choice apart would need `src/theme/theme.ts`.
</details>

---

## L2.11 Routing: React Router

**Library** (React Router 8) · [React Router](https://reactrouter.com/home)

**The idea.** A single-page app has one HTML page; **React Router** decides which components to draw for the address in the bar, and changes the address without reloading when a link is followed. The routes are a tree, in `src/router.tsx`.

**The running example adds two routes,** inside `AppLayout`'s children, so they get the app's frame and are protected by `RequireAuth`:

```tsx
{ path: 'muscles', element: <MusclesPage /> },
{ path: 'muscles/:slug', element: <MusclePage /> },     // :slug is a parameter
```

**The page of one muscle**, `src/learn/MusclePage.tsx`, reads the parameter:

```tsx
export function MusclePage() {
  // The :slug part of the address: /muscles/chest → 'chest'
  const { slug } = useParams()
  // The same query as the list: already in the cache when coming from it (L2.12)
  const muscles = useMuscles()
  const muscle = muscles.data?.find(item => item.slug === slug)

  if (muscles.isPending) return null
  if (!muscle) return <p role="alert">No such muscle.</p>

  return (
    <>
      <PageHeader eyebrow="Learn" title={muscle.name} />
      <Link to="/muscles">All muscles</Link>
    </>
  )
}
```

**The pieces:**

| Piece | Does | In the app |
|---|---|---|
| `createBrowserRouter([...])` | The route tree | `src/router.tsx` |
| `children`, `<Outlet />` | A parent draws its child where `<Outlet />` is | `AppLayout` |
| `<Link to="/x">` | A link that changes the page without reloading | sign-in screens |
| `<NavLink>` | A link that knows if it is the current page | `BottomTabBar`, `SideNav` |
| `useParams()` | The `:parameters` of the address | `ExerciseDetailPage`, `ExerciseEditorPage` |
| `useSearchParams()` | The `?query=string` | `ResetPasswordPage` reads the token of the email's link; `ExercisesPage` keeps its filters there |
| `useNavigate()` | Going somewhere from code | `ResetPasswordPage`, after the new password is saved; the exercise editor, after saving |
| `<Navigate to="/login" />` | Going somewhere while drawing | `RequireAuth` |
| `useLocation()` | The current address, and its `state` | `AppLayout`, `LoginPage` |
| `errorElement` | What to draw if a page crashes | `RouteErrorPage` |

**Never use `<a href="/x">`** for the app's own pages: it reloads everything, and the cache with it.

**Guards** are routes without a path whose element decides whether the children may open: `RequireAuth` draws `<Outlet />` for a signed-in user, `<Navigate to="/login" />` for a visitor. They are about what the user sees; the real protection is on the server ([C1.13.2](../concepts/C1-frontend.md#c1132-the-guards)).

**In AtleoPlan:** `src/router.tsx`, `src/components/layout/AppLayout.tsx`, `src/routes/RequireAuth.tsx`.

**Recap**
- Routes are a tree; parents draw children at `<Outlet />`.
- `:slug` in the path, `useParams()` in the page.
- `<Link>` and `<NavLink>`, never `<a>`, for the app's pages; `useNavigate()` from code.

**Exercise.** On the muscle's page, add a button that goes back to the list from code, instead of the link.

<details>
<summary>Solution</summary>

```tsx
const navigate = useNavigate()      // with the other hooks, at the top

<Button variant="outline" onClick={() => navigate('/muscles')}>All muscles</Button>
```

`navigate(-1)` would go back one step in the history instead, wherever the user came from. For a plain "go there", `<Link>` is better: it is a real link, which can be opened in a new tab.
</details>

---

## L2.12 Server data: TanStack Query

**Library** (TanStack Query 5) · **AtleoPlan** (`request()`, the `src/api/` files) · [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)

**The idea.** Data from the server is not like state: it lives elsewhere, it can change without you, it takes time to arrive, and the same data is wanted by several screens. **TanStack Query** keeps it in a shared **cache**. A component asks for a piece of data by its **key**; the library gives the cached copy at once if there is one, fetches it when it is missing or old, and draws again every component using that key when it arrives.

**The running example's API file**, `src/api/muscles.ts`, on the model of every file in `src/api/`:

```ts
import { useQuery } from '@tanstack/react-query'
import { request } from '@/lib/http'

/** A muscle group, as GET /api/muscles sends it (backend MuscleResource). */
export interface Muscle {
  id: number
  slug: string
  name: string
}

/** The cache keys of the muscles. */
export const muscleKeys = {
  all: ['muscles'] as const,
}

/** Every muscle, sorted by name in the user's language. */
export function useMuscles() {
  return useQuery({
    // Where the answer lives in the cache
    queryKey: muscleKeys.all,
    // How to get it. Laravel wraps the list in `data`; the hook returns the list itself.
    // `signal` lets TanStack Query cancel a request no longer needed
    queryFn: async ({ signal }) => {
      const answer = await request<{ data: Muscle[] }>('/api/muscles', { signal })
      return answer.data
    },
  })
}
```

**`request()`** (`src/lib/http.ts`) is **AtleoPlan's**: a small wrapper around the browser's `fetch()` that adds the headers Laravel needs (CSRF token, `Accept`, the language) and turns any failure into an `ApiError` with its status. The `Muscle` type is written by hand, in step with the backend's resource: TypeScript cannot see what the server really sends.

**What a component gets** from `useMuscles()`:

| Field | Means |
|---|---|
| `isPending` | No data yet: draw a skeleton |
| `isError`, `error` | It failed: draw a message; `error` is an `ApiError` |
| `data` | The data, once there (`Muscle[]`) |
| `isFetching` | A request is running, even in the background with data already shown |
| `refetch()` | Ask again: a "Retry" button |

**The three states,** in this order, in every component that reads server data ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)): loading, error, data. After the two early `return`s, TypeScript knows `data` is there.

**What the cache gives for free,** visible in the example:
- **One request for many readers.** `MusclesPage` and `MusclePage` both call `useMuscles()`: opening a muscle from the list draws it at once, from the cache.
- **Fresh enough data.** The app's default is 30 seconds: within that time the cache is used as it is; after, it is shown at once and refreshed in the background (`src/lib/query-client.ts`).
- **Retries** on network and server errors, not on 401, 403, 404 or 422.
- **A 401 anywhere signs the user out**, in one place, `query-client.ts`.

**Keys** are arrays, from general to specific: `['muscles']`, later `['exercises', { search: 'panca' }]`. Keeping them in one object per file (`muscleKeys`) avoids typos and lets other code refresh them ([L2.13](#l213-changing-data-mutations)).

**In AtleoPlan:** `src/api/health.ts` (the simplest), `src/api/auth.ts` (who is signed in is a query too), `src/api/exercises.ts` (a list read in pages with `useInfiniteQuery`, the language in every key: [C1.14.2](../concepts/C1-frontend.md#c1142-a-list-one-page-at-a-time)), `src/components/ServerStatus.tsx` (the three states), `src/lib/query-client.ts` (the defaults). [C1.6](../concepts/C1-frontend.md#c16-server-data) and [H3.3](../how-to/H3-frontend.md#h33-reading-data-from-the-api) explain the pattern in this app.

**Recap**
- Server data lives in TanStack Query's cache, under a key; never in `useState`.
- One file per resource in `src/api/`: types, keys, `useX()` hooks calling `request()`.
- Draw loading, error, then data.

**Exercise.** Write `useMuscle(slug)`, which returns only the muscle with that slug, reusing the same cached list. Hint: `useQuery` has a `select` option, a function that transforms the cached data for this one component.

<details>
<summary>Solution</summary>

```ts
/** Fetches the list (shared by both hooks). */
function fetchMuscles(signal?: AbortSignal) {
  return request<{ data: Muscle[] }>('/api/muscles', { signal }).then(answer => answer.data)
}

export function useMuscle(slug: string | undefined) {
  return useQuery({
    queryKey: muscleKeys.all,                    // the same key: the same cached list
    queryFn: ({ signal }) => fetchMuscles(signal),
    select: muscles => muscles.find(muscle => muscle.slug === slug),
  })
}
```

`MusclePage` then writes `const muscle = useMuscle(slug)`, and `muscle.data` is one `Muscle` or `undefined`. The cache still holds the whole list, once.
</details>

---

## L2.13 Changing data: mutations

**Library** (TanStack Query) · [Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations), [Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)

**The idea.** A request that **changes** something (create, update, delete) is a **mutation**. Unlike a query, nothing runs until you call `mutate(data)`; and after it succeeds, the cached data it affects is out of date, and must be refreshed.

**The running example's hook**, in `src/learn/QuickExerciseForm.tsx`, creates a personal exercise with `POST /api/exercises`:

```ts
function useCreateExercise() {
  // The app's cache, from QueryClientProvider in App.tsx
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: QuickExerciseValues) =>
      request<{ data: { id: number, name: string } }>('/api/exercises', { method: 'POST', body: values }),
    // The list of exercises is now out of date: read it again when next needed
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  })
}
```

```tsx
const create = useCreateExercise()
create.mutate({ name: 'Panca mia' })            // sends the request
create.isPending                                // true while it runs: disable the button
create.isSuccess, create.data                   // done, with the server's answer
create.isError, create.error                    // failed, with the ApiError
```

**Three ways to bring the cache up to date**, from simplest to fastest:

| Way | How | In the app |
|---|---|---|
| Invalidate | `invalidateQueries({ queryKey })`: marks it old; readers on screen refetch at once | After creating an exercise |
| Write the answer | `setQueryData(key, newData)`: puts the server's answer in the cache, no extra request | `useSignOut()` sets the user to `null` |
| Optimistic update | Write the expected result **before** the server answers; correct it after | `useUpdatePreferences()`: the theme changes at once |

Start with invalidating: it is always right. The optimistic update is for actions that must feel instant, and has traps of its own, explained in [C1.13.4](../concepts/C1-frontend.md#c1134-language-and-theme-on-the-account).

**`mutate(data, { onSuccess, onError })`** also takes callbacks for this one call, used by the form for what concerns the screen (empty the field, show errors); the hook's own `onSuccess` is for the cache.

**In AtleoPlan:** `src/api/auth.ts` has six mutations, from the plainest (`useForgotPassword`) to the optimistic one (`useUpdatePreferences`); `src/api/plans.ts` has `usePlanAction()`, one mutation for three actions, whose argument is the verb.

**Recap**
- `useMutation({ mutationFn })`, then `mutate(data)`; `isPending` to disable the button.
- After a change, invalidate the affected keys; write to the cache only when needed.

**Exercise.** Make the form's button read "Saving…" while the request runs.

<details>
<summary>Solution</summary>

```tsx
<Button type="submit" disabled={create.isPending}>
  {create.isPending ? t('learn.quick.saving') : t('learn.quick.save')}
</Button>
```

With a `saving` key added to the four translation files.
</details>

---
## L2.14 Forms: react-hook-form and zod

**Library** (react-hook-form, zod) · **AtleoPlan** (`FormField`, `showRequestError`) · [react-hook-form](https://react-hook-form.com/get-started), [zod](https://zod.dev)

**The idea.** A form with a few fields, each with its rules and its error, is tedious with one `useState` per field. **react-hook-form** keeps the values and errors of a whole form; **zod** describes the rules as a **schema**, from which TypeScript also derives the type of the values. The browser's own validation bubbles are turned off (`noValidate`): the messages come from the schema, in the app's language.

**The running example's form**, `src/learn/QuickExerciseForm.tsx`:

```tsx
/** The rules, with messages in the current language (hence a function of t). */
function quickExerciseSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, { error: t('learn.quick.required') }).max(100),
  })
}

/** The form's values, derived from the schema: { name: string }. */
type QuickExerciseValues = z.infer<ReturnType<typeof quickExerciseSchema>>

export function QuickExerciseForm() {
  const { t } = useTranslation()
  const create = useCreateExercise()                      // the mutation of L2.13
  const form = useForm<QuickExerciseValues>({
    resolver: zodResolver(quickExerciseSchema(t)),        // check with the schema
    defaultValues: { name: '' },
  })

  // Runs only when the values pass the schema
  function onSubmit(values: QuickExerciseValues) {
    create.mutate(values, {
      onSuccess: () => form.reset(),                      // empty the field
      // A 422 from Laravel: its message goes under the field
      onError: error => showRequestError(error, form.setError, ['name'], t),
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* register('name') connects the input: its name, ref, onChange, onBlur */}
      <FormField label={t('learn.quick.name')} error={form.formState.errors.name?.message} {...form.register('name')} />
      <Button type="submit" disabled={create.isPending}>{t('learn.quick.save')}</Button>
      {create.isSuccess && <p role="status">{t('learn.quick.saved', { name: create.data.data.name })}</p>}
    </form>
  )
}
```

**Two checks, on purpose.** The schema catches mistakes before anything is sent, at once and in the user's language. The server checks everything again (`StoreExerciseRequest`), because a browser can be made to send anything. The server's 422 messages still reach the screen, under their field, through `showRequestError` (`src/lib/form.ts`, **AtleoPlan**).

**The pieces:**

| Piece | Does |
|---|---|
| `useForm({ resolver, defaultValues })` | Holds the form |
| `form.register('name')` | Spread on an input: connects it |
| `form.handleSubmit(onSubmit)` | Validates, then calls `onSubmit` with typed values |
| `form.formState.errors.name?.message` | The field's error, if any |
| `form.setError('name', { message })` | Marks a field wrong from code; `'root'` for the whole form |
| `form.reset()` | Back to the default values |
| `z.object`, `z.string().trim().min(1)`, `z.email()`, `.refine(…)` | Rules; `refine` compares two fields |

**`FormField`** (`src/components/FormField.tsx`, **AtleoPlan**) draws the label, the input and the error, linked for screen readers. Every form of the app uses it.

**In AtleoPlan:** `src/pages/LoginPage.tsx` (the model form), `src/pages/auth-schemas.ts` (schemas with `refine`), [C1.13.3](../concepts/C1-frontend.md#c1133-a-form-step-by-step) step by step.

**Recap**
- zod schema → type with `z.infer` → `useForm` with `zodResolver`.
- `register` on each field, `handleSubmit` on the form, `noValidate`.
- The server checks again; `showRequestError` shows its 422 under the fields.

**Exercise.** Give the 100-character limit its own translated message, as the empty name has.

<details>
<summary>Solution</summary>

```ts
name: z.string().trim()
  .min(1, { error: t('learn.quick.required') })
  .max(100, { error: t('learn.quick.tooLong', { max: 100 }) }),
```

With `"tooLong": "At most {{max}} characters."` in `en.json`, and the same key in the other three files.
</details>

---

## L2.15 Translations: react-i18next

**Library** (i18next, react-i18next) · [react-i18next](https://react.i18next.com)

**The idea.** No text is written in a component. Each has a **key**, and one JSON file per language holds the texts: `src/i18n/locales/{it,en,es,de}.json`. A component asks for a text with `t('key')`, in the current language; changing language draws every component again in the new one.

**The running example's texts**, a `learn` section added to the four files:

```json
"learn": {
  "muscles": {
    "title": "Muscles",
    "search": "Search muscles",
    "count_one": "{{count}} muscle",
    "count_other": "{{count}} muscles",
    "open": "Open {{name}}"
  }
}
```

```tsx
const { t, i18n } = useTranslation()

t('learn.muscles.title')                              // "Muscles"; "Muscoli" in Italian
t('learn.muscles.open', { name: selected.name })      // "Open Chest": {{name}} is replaced
t('learn.muscles.count', { count: visible.length })   // "3 muscles"; "1 muscle" when count is 1
i18n.language                                         // "en": for formatting numbers and dates
```

**Plurals:** keys ending in `_one` and `_other` are chosen by `count`, with each language's own rules. The tests of [L2.18](#l218-tests-vitest-and-testing-library) check "3 muscles" and "2 muscles".

**Two safety nets,** both **AtleoPlan**:
- **Typed keys.** `src/i18n/i18next.d.ts` gives TypeScript the shape of `en.json`: a key that does not exist is a type error, and the editor completes the keys.
- **The four files must match.** `src/i18n/locales.test.ts` fails when a language misses a key, has an empty text, or loses a `{{placeholder}}`.

**Numbers and dates** follow the language through the browser's `Intl`, wrapped in `src/lib/format.ts`: `formatWeight(82.5, 'it')` gives "82,5 kg".

**Where the language comes from:** the browser at first, then the account once signed in; `src/i18n/index.ts` and [C1.7](../concepts/C1-frontend.md#c17-translations).

**Recap**
- `const { t } = useTranslation()`, then `t('section.key')`; never a text in the JSX.
- `{{placeholders}}` filled by the second argument; `_one`/`_other` for plurals.
- Every key in all four files; the test and the types check it.

**Exercise.** What does `t('learn.muscles.count', { count: 1 })` give in Italian, with `"count_one": "{{count}} muscolo"` and `"count_other": "{{count}} muscoli"`?

<details>
<summary>Solution</summary>

"1 muscolo". With `count: 0` Italian picks `_other`: "0 muscoli". Other languages have more forms (`_few`, `_many`), and i18next asks the browser's `Intl.PluralRules` which one applies.
</details>

---

## L2.16 Styles: Tailwind CSS

**Library** (Tailwind CSS 4) · [Tailwind CSS](https://tailwindcss.com/docs/styling-with-utility-classes)

**The idea.** Instead of writing CSS rules in a separate file, you put small ready-made classes on the elements, each doing one thing: `p-4` (padding 1rem), `rounded-xl`, `font-semibold`, `grid grid-cols-2 gap-3`. Tailwind generates only the classes the code uses.

**The running example's card,** styled:

```tsx
<button
  className={cn(
    'w-full rounded-xl border p-4 text-left font-semibold transition-colors',
    selected ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-muted',
  )}
>
```

- **`cn()`** joins classes, drops the false ones, and resolves conflicts (`cn('px-2', 'px-4')` keeps `px-4`). It is a small package, re-exported from `src/lib/utils.ts`.
- **`bg-primary/15`**: the primary colour at 15% opacity.
- **`hover:`** applies only on hover; **`sm:`**, **`lg:`** from a screen width up.

**Mobile first.** A class without a prefix applies everywhere; prefixes add from a width up. The list of the example: `grid grid-cols-2 gap-3 sm:grid-cols-3` has two columns on phones, three from 640 px.

**Colours are tokens, never values.** `bg-primary`, `text-muted-foreground`, `border`… come from CSS variables in `src/index.css`, with one value per theme: the same class gives the right colour in the dark theme and in the light one. The table of tokens: [C1.8](../concepts/C1-frontend.md#c18-styles-and-theme).

**Tailwind 4 is configured in CSS,** not in a JavaScript file: `src/index.css` starts with `@import "tailwindcss"`, and its `@theme` block defines the tokens.

**In AtleoPlan:** any page; `src/components/EmptyState.tsx` and `ProfilePage.tsx` have a comment on every class group.

**Recap**
- Classes on the element; `cn()` for conditional ones.
- No prefix = all widths; `sm:`, `lg:` from a width up; `hover:`, `dark:` for states.
- Colours by token (`bg-primary`), never by value.

**Exercise.** Make the muscles' grid four columns wide from 1024 px up.

<details>
<summary>Solution</summary>

```tsx
<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
```

`lg:` starts at 1024 px; each prefix overrides the smaller ones from its width up.
</details>

---

## L2.17 Ready-made components: shadcn/ui, Radix, lucide

**Library** (shadcn/ui, Radix UI, lucide-react, class-variance-authority) · [shadcn/ui](https://ui.shadcn.com/docs), [Radix](https://www.radix-ui.com/primitives/docs/overview/introduction), [Lucide](https://lucide.dev/guide/packages/lucide-react)

**The idea.** Buttons, selects, dialogs are hard to get right: keyboard, focus, screen readers, phones. **shadcn/ui** is not a package but a **command that copies** a component's source into `src/components/ui/`, where it becomes ours to read and change. Many of those components are built on **Radix UI**, which handles the behaviour and accessibility, and styled with Tailwind.

**Using them** in the running example:

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

<Input aria-label="Search muscles" value={search} onChange={…} />
<Skeleton role="status" className="h-40 w-full" />
<Button variant="outline" size="xl">Clear</Button>
```

**Variants.** `button.tsx` defines its looks with **cva** (class-variance-authority): one set of classes per `variant` (`default`, `outline`, `ghost`, `destructive`…) and per `size` (`sm`, `default`, `xl`…). `size="xl"` (48 px tall) is **AtleoPlan's** addition, for fingers ([D1.5](../design/D1-ui.md#d15-design-system)).

**`asChild`** lends a component's look to its child: `<Button asChild><Link to="/plans">Plans</Link></Button>` is a real link that looks like a button (`HomePage`).

**Adding one,** from `frontend/`:

```sh
npx shadcn add badge --yes
```

then `make fix`, to bring the copied file to the project's code style ([H3.9](../how-to/H3-frontend.md#h39-a-shadcnui-component) shows the output).

**Icons** come from **lucide-react**, one component per icon: `<Dumbbell aria-hidden="true" className="size-5" />`. `aria-hidden` when a text next to it already says the same.

**In AtleoPlan:** `src/components/ui/` (alert-dialog, badge, button, card, checkbox, input, label, native-select, select, separator, skeleton, tabs, textarea); `LanguageSelect` (a Radix select); `ExerciseDetailPage` (an alert dialog to confirm a delete); `PlanDetailPage` (tabs controlled from the address, [C1.15.3](../concepts/C1-frontend.md#c1153-tabs-whose-state-is-in-the-address)); `BottomTabBar` (lucide icons stored in data).

**Recap**
- shadcn/ui copies sources into `src/components/ui/`; they are ours.
- Radix gives the behaviour, Tailwind the look, cva the variants.
- `variant` and `size` props; `asChild` to style a link as a button.

**Exercise.** Draw the `MineBadge` of [L2.4](#l24-components-and-jsx) with shadcn's `Badge`, once added.

<details>
<summary>Solution</summary>

```tsx
import { Badge } from '@/components/ui/badge'

export function MineBadge() {
  return <Badge variant="secondary">Mine</Badge>
}
```

After `npx shadcn add badge --yes` and `make fix`. The variants are listed at the top of the copied `badge.tsx`.
</details>

---

## L2.18 Tests: Vitest and Testing Library

**Tool** (Vitest, jsdom) · **Library** (Testing Library) · **AtleoPlan** (`fakeApi`, `renderRoutes`) · [Vitest](https://vitest.dev/guide/), [Testing Library](https://testing-library.com/docs/react-testing-library/intro)

**The idea.** A test draws a component in a fake browser (**jsdom**), uses it as a person would (finds a button by its name, clicks, types), and checks what appears. **Vitest** runs the tests; **Testing Library** draws and finds things; **user-event** types and clicks. The API is never called for real: a fake `fetch` answers from a table.

**The tests of the running example**, `src/learn/MusclesPage.test.tsx`:

```tsx
/** The answer of GET /api/muscles, as Laravel wraps it. */
const muscles = {
  status: 200,
  body: { data: [
    { id: 1, slug: 'biceps', name: 'Biceps' },
    { id: 2, slug: 'chest', name: 'Chest' },
    { id: 3, slug: 'triceps', name: 'Triceps' },
  ] },
}

/** The two pages, as in the router. */
const routes = [
  { path: 'muscles', element: <MusclesPage /> },
  { path: 'muscles/:slug', element: <MusclePage /> },
]

describe('MusclesPage', () => {
  it('lists the muscles from the API', async () => {
    fakeApi({ 'GET /api/muscles': muscles })               // the fake server's table
    renderRoutes(routes, '/muscles')                         // draws the page at that address

    // findBy… waits for it to appear: the data arrives after a moment
    expect(await screen.findByRole('button', { name: 'Chest' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.getByText('3 muscles')).toBeInTheDocument()
  })

  it('filters as the user types', async () => {
    fakeApi({ 'GET /api/muscles': muscles })
    renderRoutes(routes, '/muscles')

    await userEvent.type(await screen.findByRole('textbox', { name: 'Search muscles' }), 'ceps')

    expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual(['Biceps', 'Triceps'])
    expect(screen.getByText('2 muscles')).toBeInTheDocument()
  })

  it('selects a muscle and opens its page', async () => {
    fakeApi({ 'GET /api/muscles': muscles })
    const { router } = renderRoutes(routes, '/muscles')

    await userEvent.click(await screen.findByRole('button', { name: 'Chest' }))
    expect(screen.getByRole('button', { name: 'Chest' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('link', { name: 'Open Chest' }))
    expect(await screen.findByRole('heading', { name: 'Chest' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/muscles/chest')
  })

  it('says so when the API fails', async () => {
    fakeApi({ 'GET /api/muscles': { status: 500 } })
    renderRoutes(routes, '/muscles')

    expect(await screen.findByRole('alert')).toHaveTextContent('The muscles could not be loaded.')
  })
})
```

```sh
npx vitest run src/learn --reporter=verbose
```

```
✓ src/learn/RestTimer.test.tsx > RestTimer > counts down to zero, then can start again
✓ src/learn/MusclesPage.test.tsx > MusclesPage > lists the muscles from the API
✓ src/learn/MusclesPage.test.tsx > MusclesPage > filters as the user types
✓ src/learn/MusclesPage.test.tsx > MusclesPage > selects a muscle and opens its page
✓ src/learn/MusclesPage.test.tsx > MusclesPage > says so when the API fails
✓ src/learn/QuickExerciseForm.test.tsx > QuickExerciseForm > refuses an empty name before sending anything
✓ src/learn/QuickExerciseForm.test.tsx > QuickExerciseForm > sends the name, then empties the field
✓ src/learn/QuickExerciseForm.test.tsx > QuickExerciseForm > shows the server's message under the field
Test Files  3 passed (3)
     Tests  8 passed (8)
```

**Finding things as a person would.** By role and accessible name first: `getByRole('button', { name: 'Chest' })`, then `getByLabelText`, then `getByText`. A test that finds a button by its name also proves that a screen reader can.

| Prefix | When nothing matches | Use |
|---|---|---|
| `getBy…` | Fails at once | What is already there |
| `findBy…` (with `await`) | Waits, then fails | What appears after data or a click |
| `queryBy…` | Returns `null` | Checking that something is **not** there |

**The project's helpers** (`src/test/auth-helpers.tsx`, **AtleoPlan**):
- **`fakeApi({ 'GET /api/muscles': answer })`** replaces `fetch`; a path not in the table answers 204. Its `mock.calls` say what was sent; `sentBody(fake, path)` decodes a body.
- **`renderRoutes(routes, '/muscles')`** draws the routes with a fresh cache, the theme and a router in memory. It returns the router, to check the address.

The form's test checks what was sent, and that nothing was when the schema refused:

```tsx
it('refuses an empty name before sending anything', async () => {
  const fake = fakeApi({})
  renderRoutes(routes, '/')

  await userEvent.click(screen.getByRole('button', { name: 'Add exercise' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Write a name.')
  expect(fake).not.toHaveBeenCalled()
})
```

**Time, faked.** The timer's test does not wait real seconds: `vi.useFakeTimers()` lets it move the clock. One trap met while writing it: advancing 2 seconds in one step left the timer at 1, not 0.

```
FAIL  src/learn/RestTimer.test.tsx > RestTimer > counts down to zero, then can start again
Expected element to have text content:
  0
Received:
  1
```

The timer schedules each second **after** React has drawn the previous one, and inside one `act()` React draws only at the end. One second per `act()` fixes it:

```tsx
act(() => vi.advanceTimersByTime(1000))
act(() => vi.advanceTimersByTime(1000))
expect(screen.getByRole('timer')).toHaveTextContent('0')
```

**In AtleoPlan:** `src/pages/ProfilePage.test.tsx` and `auth-pages.test.tsx` (pages with the API), `src/lib/format.test.ts` and `src/components/plans/plan-format.test.ts` (plain functions), `src/pages/PlanDetailPage.test.tsx` (an answer that changes after an action), `src/test/setup.ts` (what runs before each test: English, clean-up). [H3.5](../how-to/H3-frontend.md#h35-testing-a-page) builds a page's test step by step.

**Recap**
- Draw, act like a user, check what shows; never the real API.
- `getByRole` with a name first; `findBy` for what arrives later; `queryBy` for absence.
- `fakeApi` and `renderRoutes` give each test a fake server, a fresh cache and a router.

**Exercise.** Write the test "says so when no muscle matches": type "xyz", expect the text "No muscle matches." and no card.

<details>
<summary>Solution</summary>

```tsx
it('says so when no muscle matches', async () => {
  fakeApi({ 'GET /api/muscles': muscles })
  renderRoutes(routes, '/muscles')

  await userEvent.type(await screen.findByRole('textbox', { name: 'Search muscles' }), 'xyz')

  expect(screen.getByText('No muscle matches.')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
```

`queryByRole` returns `null` instead of failing, which is what `not.toBeInTheDocument()` needs.
</details>

---

## L2.19 The checks: TypeScript and ESLint

**Tool** · [TypeScript](https://www.typescriptlang.org/docs/), [ESLint](https://eslint.org/docs/latest/), [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks)

**The idea.** Two programs read the code without running it, and catch mistakes before a user does. **TypeScript** checks that every value is used as its type allows. **ESLint** checks rules: React's (hooks, effects) and the project's style. Both show their findings in VS Code as you type; `make check` runs them before every merge.

**TypeScript**, on a `MuscleCard` given a muscle without a name and a text instead of a boolean:

```tsx
<MuscleCard muscle={{ id: 1, slug: 'chest' }} selected="yes" onSelect={() => {}} />
```

```
error TS2741: Property 'name' is missing in type '{ id: number; slug: string; }' but required in type 'Muscle'.
error TS2322: Type 'string' is not assignable to type 'boolean'.
```

The project's settings are strict (`tsconfig.app.json`): `strict`, no unused variables, and `noUncheckedIndexedAccess`, which makes `list[0]` possibly `undefined`, as it really is.

**ESLint** found the two React mistakes of this course: the `useState` inside an `if` ([L2.9](#l29-hooks-the-rules-and-your-own)) and the `setState` inside an effect ([L2.8](#l28-effects)). Both rules come from `eslint-plugin-react-hooks`. The style rules (2 spaces, single quotes, no semicolons) are the project's, and `make fix` applies them.

**The commands:**

| What | From the root | In `frontend/` |
|---|---|---|
| Types | `make typecheck` | `npm run typecheck` |
| Lint | `make lint` | `npm run lint` |
| Fix what can be fixed | `make fix` | `npm run lint -- --fix` |
| Everything, before a merge | `make check` | |

**In AtleoPlan:** `tsconfig.app.json` and `eslint.config.js`, each commented.

**Recap**
- TypeScript checks types; ESLint checks rules; both in the editor and in `make check`.
- Read the message: it names the line, the rule and usually the fix.

**Exercise.** Fix the `MuscleCard` line above.

<details>
<summary>Solution</summary>

```tsx
<MuscleCard muscle={{ id: 1, slug: 'chest', name: 'Chest' }} selected={true} onSelect={() => {}} />
```

`selected` alone (`<MuscleCard … selected …/>`) also means `true`.
</details>

---

## L2.20 What React has that the project does not use yet

**React** · the pages linked below

| Part | What it is for | When it may come |
|---|---|---|
| [`useRef`](https://react.dev/reference/react/useRef) | A value that survives draws without causing one; a handle on a DOM element (to focus a field) | Workout mode: focusing the weight field |
| [`useReducer`](https://react.dev/reference/react/useReducer) | State with many related changes, written as actions | The plan editor's draft (`PlanEditor`, `plan-draft.ts`; [C1.16.2](../concepts/C1-frontend.md#c1162-the-draft-and-its-reducer)) |
| [`lazy` and `<Suspense>`](https://react.dev/reference/react/lazy) | Loading a page's code only when it is opened | When the bundle grows |
| [`memo`](https://react.dev/reference/react/memo) | Skipping a component's draw when its props did not change | Long lists, if they slow down |
| [`createPortal`](https://react.dev/reference/react-dom/createPortal) | Drawing outside the parent's element | Used by Radix for selects and dialogs, not by us directly |
| [`useActionState`, `useOptimistic`, form actions](https://react.dev/reference/react/useActionState) | React 19's own form tools | The app uses react-hook-form and TanStack Query instead |
| [Server Components](https://react.dev/reference/rsc/server-components) | Components that run on a server | Not for this app: a single-page app with a Laravel API |

---

## L2.21 What in this project is not plain React

| Piece | Kind | What it does here | Its documentation |
|---|---|---|---|
| Vite | Tool | Development server, bundling | [vite.dev](https://vite.dev/guide/) |
| TypeScript | Language, tool | Types, `make typecheck` | [typescriptlang.org](https://www.typescriptlang.org/docs/) |
| React Router | Library | Routes, links, guards | [reactrouter.com](https://reactrouter.com/home) |
| TanStack Query | Library | Server data and its cache | [tanstack.com/query](https://tanstack.com/query/latest) |
| react-i18next | Library | Translations | [react.i18next.com](https://react.i18next.com) |
| react-hook-form, zod | Library | Forms and their rules | [react-hook-form.com](https://react-hook-form.com), [zod.dev](https://zod.dev) |
| Tailwind CSS | Library | Styles as classes | [tailwindcss.com](https://tailwindcss.com/docs) |
| shadcn/ui, Radix, cva, lucide | Library | Components, behaviour, variants, icons | [ui.shadcn.com](https://ui.shadcn.com/docs) |
| Vitest, Testing Library, jsdom | Tool, library | Tests | [vitest.dev](https://vitest.dev/guide/), [testing-library.com](https://testing-library.com/docs/) |
| ESLint with `@stylistic` | Tool | Rules and code style | [eslint.org](https://eslint.org/docs/latest/) |
| `request()`, `ApiError` | AtleoPlan | The one way to call the API | `src/lib/http.ts` |
| One file per resource in `src/api/` | AtleoPlan | Types, keys, hooks | [C1.6](../concepts/C1-frontend.md#c16-server-data) |
| `FormField`, `showRequestError` | AtleoPlan | Every form's fields and server errors | [C1.13](../concepts/C1-frontend.md#c113-signing-in-and-forms) |
| `fakeApi`, `renderRoutes` | AtleoPlan | Tests with a fake server | `src/test/auth-helpers.tsx` |
| The guards in `src/routes/` | AtleoPlan | Signed-in or visitor screens | [C1.13.2](../concepts/C1-frontend.md#c1132-the-guards) |
| Comments on every line | AtleoPlan | For learning; most projects comment far less | [P1.2](../project/P1-conventions.md#p12-code) |

---

## L2.22 Final exercise and clean-up

**Build the muscles page yourself**, on the branch of [L2.1](#l21-how-this-course-works), looking back at the lessons only when stuck. Keep everything in `src/learn/`, except the API file:

1. `src/api/muscles.ts`: the `Muscle` type, `muscleKeys`, `useMuscles()` (L2.12).
2. `src/learn/MuscleCard.tsx`, with its props (L2.5) and its classes (L2.16).
3. `src/learn/MusclesPage.tsx`: the three states, the search box, the list, the selection, the link (L2.6, L2.7).
4. `src/learn/MusclePage.tsx`, and the two routes in `src/router.tsx` (L2.11). Open http://localhost:5673/muscles.
5. A `learn` section in the four files of `src/i18n/locales/`, and `t()` for every text (L2.15).
6. `src/learn/RestTimer.tsx` (L2.8) and `src/learn/QuickExerciseForm.tsx` (L2.13, L2.14), shown on the muscles page.
7. The tests of L2.18 and of the exercises; `npx vitest run src/learn` until green.
8. `make lint` and `make typecheck`; then break a rule on purpose (a hook in an `if`) and read the message.

The quick form really creates exercises in the development database, as personal exercises of the account you are signed in with.

**Then throw it all away:**

```sh
git add -A && git commit -m "Muscles exercise"   # keeps the work on the branch, so switching is clean
git switch main
git branch -D learn/muscles                      # -D: delete even though never merged
```

`main` never had the `src/learn/` folder, the routes or the `learn` translations, so switching back removes them all. The personal exercises created by the quick form stay in the database: delete them from TablePlus ([H4](../how-to/H4-database-tools.md)), or with `make fresh`, which rebuilds the development database from scratch.

---

## L2.23 Where to go next

**React's own documentation** at https://react.dev/learn, in its order: *Describing the UI*, *Adding interactivity*, *Managing state*, *Escape hatches*. The last chapter explains effects and refs better than anything else, and *You Might Not Need an Effect* is worth reading twice.

**The libraries,** each with a good guide:
- TanStack Query: the *Guides & Concepts* pages, starting from *Important Defaults* and *Query Keys*;
- React Router: *Start here* of the "data mode" (the `createBrowserRouter` style this app uses);
- react-hook-form: *Get started*, then *Advanced usage*;
- Testing Library: *Guiding principles* and *Which query should I use?*;
- Tailwind: *Styling with utility classes*, then *Responsive design*.

**Modern JavaScript and TypeScript:** https://javascript.info for the language, the TypeScript handbook for types.

**In this repository**, after the course: [C1. Frontend](../concepts/C1-frontend.md) for how the app is built, [H3](../how-to/H3-frontend.md) when building a new page, [D1](../design/D1-ui.md) for how the screens should look and behave.

---

← [L1. Laravel course](L1-laravel.md) · [Contents](../README.md)
