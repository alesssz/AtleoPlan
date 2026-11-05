# AtleoPlan

*Your plans, your progress.*

A workout app for building training plans out of a library of exercises, following them at the gym and logging every set to see progress over time. Exercises live in a library of their own, public or personal, with photos and videos; a plan is made of days, each holding exercises with their sets, reps and rest. Plans can be shared through a link.

It works on phones and desktop as a PWA, offline during workouts, in Italian, English, Spanish and German. Backend in Laravel (API), frontend in React + TypeScript, hosted for free on a single server ([2.6](docs/02-decisions.md#26-hosting)).

**Status:** skeleton. The Laravel and React apps run locally, with the app's frame, four languages and the two themes; the features come next, in the order of the [road to the MVP](docs/backlog.md#road-to-the-mvp). Deploying comes later ([OPS-3](docs/backlog.md#ops-3-deploy-to-the-free-server)).

---

## Local development

Needs Docker and Node only: PHP and Composer run inside the backend container (`Dockerfile`, `compose.yaml`).

Ports on your computer are each service's standard port + 500, so they never clash with other projects. On Windows, run the commands from Git Bash ([0.2](docs/00-setup.md#02-prerequisites)).

| Service | Address |
|---|---|
| Laravel (API, admin) | http://localhost:8500 |
| Postgres | `localhost:5932`, user, password and database `atleoplan` |
| Mailpit (caught emails) | http://localhost:8525 |
| Vite (React, once it exists) | http://localhost:5673 |

```sh
make setup        # first time on a new clone
make up           # start the backend stack;  make dev  starts React
make help         # every command
make down         # stop (data is kept)
```

First time on this computer, creating the apps, every command and known problems: [0. Setup](docs/00-setup.md).

---

## Documentation

Everything lives in [`docs/`](docs/), one file per section. Sections keep their numbers, so a reference such as "see 2.5" (in these pages or in a code comment) points to section 2.5 of `docs/02-decisions.md`.

| Section | What it covers |
|---|---|
| [0. Setup](docs/00-setup.md) | Where the project stands, prerequisites, Git identity, the port rule, creating the Laravel and React apps, everyday commands, useful links, troubleshooting |
| [1. UI design](docs/01-ui-design.md) | Users, design principles, user journeys, navigation and routes, every screen, design system, states (empty, loading, error, offline), responsive layout and accessibility, release phases |
| [2. Decisions](docs/02-decisions.md) | Name, stack, exercise library and its import, languages, photo and video limits and storage, hosting, offline sync, workout rules |
| [3. Conventions](docs/03-conventions.md) | Git, code and comments, documentation, backlog |
| [4. Frontend](docs/04-frontend.md) | The React app, for a reader new to React: its pieces, folders, start-up, React from scratch, routing, server data, translations, styles and theme, recipes, tests, JavaScript and TypeScript syntax |
| [5. Backend](docs/05-backend.md) | The Laravel app, for a reader new to PHP and Laravel: its pieces, PHP syntax, folders, the life of a request, routes and controllers, database, sign-in, admin panel, queues, configuration, tests, recipes, commands |

Outside the numbered sections, **[Backlog](docs/backlog.md)** lists the work known and waiting, one entry per point with options and a recommendation; an entry is deleted when its work is done.
