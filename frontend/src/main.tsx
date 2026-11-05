/*
 * The entry point: the first file of ours the browser runs (index.html loads
 * it with <script type="module" src="/src/main.tsx">). It loads the global
 * styles, sets up the translations, and tells React to draw the app inside
 * <div id="root">. From then on React owns that <div> and everything in it.
 * The whole start-up sequence: docs/04-frontend.md 4.3.
 *
 * A .tsx file is TypeScript (JavaScript plus types) that may also contain
 * JSX, the HTML-like tags such as <App /> below (docs/04-frontend.md 4.4).
 * Vite turns it into plain JavaScript before the browser sees it.
 */

// `import { X } from 'package'` is a *named* import: it takes the thing the
// package exported under the name X. Packages come from node_modules; paths
// starting with './' are files of this project (the extension is left out).
// Syntax primer: docs/04-frontend.md 4.12.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// An import with no names runs the file only "for its effect".
// Global CSS: Tailwind and the theme's colours (Vite injects it in the page).
import './index.css'
// Sets up i18next before any component asks for a text. Also effect only.
import './i18n'
import { App } from './App'

// `const` declares a variable that is never reassigned (the usual choice;
// `let` is for the rare ones that change).
// The element React takes over; it exists in index.html. getElementById()
// may return null, and TypeScript makes us handle that case; the trailing
// `!` (the "non-null assertion") tells TypeScript "trust me, it is there".
const rootElement = document.getElementById('root')!

// createRoot() connects React to that element; render() draws <App /> in it.
createRoot(rootElement).render(
  // JSX: <StrictMode> and <App /> are components, written like HTML tags.
  // A tag that closes itself (<App />) has no content inside.
  // StrictMode, in development only, runs components and effects twice on
  // purpose to expose code that is not safe to repeat; it does nothing in
  // production. Seeing a console.log twice in development is expected.
  <StrictMode>
    <App />
  </StrictMode>,
)
