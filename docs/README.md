# AtleoPlan documentation

The documents are grouped by **what you are looking for**. Each folder has a letter, and its documents are numbered from 1: `H2` is the second how-to, and `H2.3` is section 3 of it, so a reference such as "see H2.3" points to one exact place.

## Contents

- [Where to look](#where-to-look)
- [Every document](#every-document)
  - [S · Start](#s--start)
  - [D · Design](#d--design)
  - [C · Concepts](#c--concepts)
  - [H · How to](#h--how-to)
  - [P · Project](#p--project)

## Where to look

| You want to… | Folder | Letter |
|---|---|---|
| Install the project, start it, solve a setup problem | [`start/`](start) | **S** |
| Know what the app does and why it is built this way: screens, decisions, tables | [`design/`](design) | **D** |
| Understand how the code is built: the frontend's and the backend's architecture | [`concepts/`](concepts) | **C** |
| Do something concrete: recipes with the commands in order, the files, the checks | [`how-to/`](how-to) | **H** |
| Know how we work: Git, comments, docs, what comes next | [`project/`](project) | **P** |

**A rule of thumb:**
- *what* and *why* → `design/`;
- *how it works* → `concepts/`;
- *how to do it* → `how-to/`.

The how-to guides and the concepts go in pairs: H2 is the recipe for an endpoint, C2.5 describes the routes and controllers it fits into.

## Every document

### S · Start

| Document | What it covers |
|---|---|
| [S1. Setup](start/S1-setup.md) | Where the project stands, prerequisites, Git identity, ports, the first start, the backend's configuration, the frontend on the host, everyday commands, troubleshooting, the Google credentials for signing in with Google |

### D · Design

| Document | What it covers |
|---|---|
| [D1. UI design](design/D1-ui.md) | Users, design principles, user journeys, navigation and routes, every screen, design system, states (empty, loading, error, offline), responsive layout and accessibility, release phases |
| [D2. Decisions](design/D2-decisions.md) | Name, stack, exercise library and its import, languages, photo and video limits and storage, hosting, offline sync, workout rules, plan files, local development, continuous integration |
| [D3. Data model](design/D3-data-model.md) | Every table of the MVP: columns, relations, ids, what happens on delete, what is computed, traps to avoid |

### C · Concepts

| Document | What it covers |
|---|---|
| [C1. Frontend](concepts/C1-frontend.md) | The architecture of the React app: its pieces, folders, start-up, routing, server data, translations, styles and theme, component and TypeScript conventions, tests; then each feature: signing in and forms, the exercise library, the plan screens and the plan editor, workout mode, Home, the summary and history, loading states |
| [C2. Backend](concepts/C2-backend.md) | The architecture of the Laravel API: its pieces, code conventions, folders, the path of a request; the endpoints of the exercise library, the plans and the workouts, nested validation, photos; the database layer; signing in with Fortify, Sanctum and Google, disabled accounts; the admin panel; queues, configuration, tests; the commands that import and translate the exercise library |

### H · How to

| Document | What it covers |
|---|---|
| [H1. Database](how-to/H1-database.md) | Recipes: a new table from start to finish, migrations (keys, check constraints, changing a table, filling a new column), models, factories and seeders, looking at the data, testing database code, the commands that fill the exercise library, common errors |
| [H2. Backend](how-to/H2-backend.md) | Recipes: an endpoint that reads and one that changes data, a body shaped as a tree, writes from a phone that may be offline, an admin screen, a background job, translated messages, settings, packages, finding out what is going on, common errors |
| [H3. Frontend](how-to/H3-frontend.md) | Recipes: a new page, data from a new endpoint, a form that saves, testing a page, translations, npm packages (and `overrides` for a vulnerable one deep in the tree), the browser's tools, the three widths, a real Android phone and the README's screenshots, shadcn/ui components, common errors |
| [H4. Opening the database](how-to/H4-database-tools.md) | The connection details, a desktop client, the terminal, connection errors |
| [H5. Continuous integration](how-to/H5-ci.md) | What GitHub checks on every push and every week (CI, the dependency audit, Dependabot for the actions), the workflows, the settings on GitHub and `make github-check` (reading them with `gh`), CodeQL, the advisories reviewed, reading a failed run, the same checks on the computer |

### P · Project

| Document | What it covers |
|---|---|
| [P1. Conventions](project/P1-conventions.md) | Git, code and comments, documentation, backlog, the public repository (what never goes in, checking the history, the settings on GitHub, alerts and reports) |
| [Backlog](project/backlog.md) | The work known and waiting, one entry per point with options and a recommendation; an entry is deleted when its work is done |

**Reading order the first time:** S1, then D1 to D3, then C1 or C2, depending on the side you work on. Keep H1 to H5 at hand while working.
