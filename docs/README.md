# AtleoPlan documentation

The documents are grouped by **what you are looking for**. Each folder has a letter, and its documents are numbered from 1: `H2` is the second how-to, and `H2.3` is section 3 of it. A code comment such as `// docs/how-to/H2-backend.md H2.3` therefore points to one exact place.

## Contents

- [Where to look](#where-to-look)
- [Every document](#every-document)
  - [S · Start](#s--start)
  - [D · Design](#d--design)
  - [C · Concepts](#c--concepts)
  - [H · How to](#h--how-to)
  - [P · Project](#p--project)
  - [L · Learn](#l--learn)

## Where to look

| You want to… | Folder | Letter |
|---|---|---|
| Install the project, start it, solve a setup problem | [`start/`](start) | **S** |
| Know what the app does and why it is built this way: screens, decisions, tables | [`design/`](design) | **D** |
| Understand how the code works: React, Laravel, the concepts behind them | [`concepts/`](concepts) | **C** |
| Do something concrete, step by step, with the commands and their output | [`how-to/`](how-to) | **H** |
| Know how we work: Git, comments, docs, what comes next | [`project/`](project) | **P** |
| Learn Laravel or React themselves, lesson by lesson, with exercises | [`learn/`](learn) | **L** |

**A rule of thumb:**
- *what* and *why* → `design/`;
- *how it works* → `concepts/`;
- *how to do it* → `how-to/`;
- *learning the framework itself* → `learn/`.

The how-to guides and the concepts go in pairs: H2 shows how to build an endpoint, and C2.5 explains what a controller is.

## Every document

### S · Start

| Document | What it covers |
|---|---|
| [S1. Setup](start/S1-setup.md) | Where the project stands, prerequisites, Git identity, the port rule, creating the Laravel and React apps, everyday commands, useful links, troubleshooting |

### D · Design

| Document | What it covers |
|---|---|
| [D1. UI design](design/D1-ui.md) | Users, design principles, user journeys, navigation and routes, every screen, design system, states (empty, loading, error, offline), responsive layout and accessibility, release phases |
| [D2. Decisions](design/D2-decisions.md) | Name, stack, exercise library and its import, languages, photo and video limits and storage, hosting, offline sync, workout rules |
| [D3. Data model](design/D3-data-model.md) | Every table of the MVP, for a reader new to databases: the basic ideas, columns, relations and the Laravel code, ids, what happens on delete, what is computed, one week of training step by step, traps to avoid |

### C · Concepts

| Document | What it covers |
|---|---|
| [C1. Frontend](concepts/C1-frontend.md) | The React app, for a reader new to React: its pieces, folders, start-up, React from scratch, routing, server data, translations, styles and theme, short recipes, tests, JavaScript and TypeScript syntax, signing in and forms, the exercise library's screens, the plan screens, the plan editor (its two steps, creating an exercise from the picker, container queries), workout mode, Home, the summary and history, showing that something is loading (skeletons, spinners, buttons' `pending`) |
| [C2. Backend](concepts/C2-backend.md) | The Laravel app, for a reader new to PHP and Laravel: its pieces, PHP syntax, folders, the life of a request, routes and controllers, the exercise library's, the plans' and the workouts' endpoints, validating nested data, database, signing in with Fortify and by hand, admin panel, queues, configuration, tests, short recipes, commands, model events, a migration that writes data, Artisan commands of our own, the free-exercise-db import and the extra exercises |

### H · How to

| Document | What it covers |
|---|---|
| [H1. Database](how-to/H1-database.md) | A new table from start to finish (migration, model, factory, seeder, tinker, test), changing a table, relations, seeders and imports, looking at the data, common errors, filling the exercise library from free-exercise-db, the plan tables as built (UUID ids, check constraints, a column added to users), the translation of the library, the workout tables as built, the search text (a model event and a migration that fills a column), the extra exercises |
| [H2. Backend](how-to/H2-backend.md) | An endpoint that reads and one that changes data (controller, resource, form request, policy, tests), an admin screen, a background job, translated messages, settings, packages, debugging, common errors, the exercise library API and the plans API and the workouts API as built (a body shaped as a tree, a rule of our own, data sent late by a phone, the same day done before) |
| [H3. Frontend](how-to/H3-frontend.md) | A new page, data from the API, a form that saves, tests, translations, npm packages, the browser's tools, shadcn/ui components, common errors, the exercise library's and the plan screens, the plan editor, workout mode, Home, the summary and history as built, loose ends (a UUID without HTTPS, last used, Finish from the banner), the logo, the stepper and the exercise menu, the workout preferences, the plan editor in two steps, creating an exercise from the picker, the loading signs (shadcn's Spinner, a button's `pending`, the search box's spinner) |
| [H4. Opening the database](how-to/H4-database-tools.md) | The connection details, TablePlus step by step (connecting, browsing, SQL, editing safely, shortcuts), the terminal's ways, the alternatives (DBeaver, pgAdmin, Adminer…), connection errors |

### P · Project

| Document | What it covers |
|---|---|
| [P1. Conventions](project/P1-conventions.md) | Git, code and comments, documentation, backlog |
| [Backlog](project/backlog.md) | The work known and waiting, one entry per point with options and a recommendation; an entry is deleted when its work is done |

### L · Learn

| Document | What it covers |
|---|---|
| [L1. Laravel course](learn/L1-laravel.md) | Standard Laravel in 24 lessons, each with where the project uses it, a tried example, a recap and an exercise: PHP, Artisan, the container, migrations, Eloquent, relations, queries, collections, factories, routes, controllers, validation, policies, resources, middleware, signing in, configuration, translations, tests; what the project adds on top. A running example, training notes, built and thrown away |
| [L2. React course](learn/L2-react.md) | React and the libraries of the frontend in 23 lessons, each with where the app uses it, a tried example, a recap and an exercise: JavaScript and TypeScript, Vite, components, props, lists, state, effects, hooks, context, React Router, TanStack Query (reading and changing data), forms with react-hook-form and zod, translations, Tailwind, shadcn/ui, tests, the checks; what is React and what is a library or ours. A running example, a muscles page, built and thrown away |

**Reading order the first time:** S1, then D1 to D3, then C1 or C2, depending on the side you work on. New to Laravel or React: L1 or L2 first, at your own pace, next to C2 or C1. Keep H1 to H4 at hand while working.
