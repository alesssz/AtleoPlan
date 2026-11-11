# AtleoPlan

<img src="docs/design/brand/mark-lime.svg" alt="AtleoPlan's logo: a heavy italic A with a tick cut out of it, on a lime tile" width="72">

*Your plans, your progress.*

A workout app for building training plans out of a library of exercises, following them at the gym and logging every set to see progress over time. Exercises live in a library of their own, public or personal, with photos and videos; a plan is made of days, each holding exercises with their sets, reps and rest. Plans can be shared through a link.

It works on phones and desktop as a PWA, offline during workouts, in Italian, English, Spanish and German. Backend in Laravel (API), frontend in React + TypeScript, hosted for free on a single server ([D2.6](docs/design/D2-decisions.md#d26-hosting)).

**Status:** early. The Laravel and React apps run locally, with signing in, the app's frame and its logo, four languages and the two themes; the exercise library is filled from free-exercise-db and translated into Italian, Spanish and German, with its screens: list, search, filters, details and the editor of personal exercises. Workout plans are done: list, page and editor, with days, sets, supersets and drag and drop, exercises done as fast as possible; a plan can be exported as a file and imported again, on the same server or another, with a preview before anything is sent; `make plans-demo` adds two examples. Workout mode is done: a plan's day followed set by set, with last time's values, the rest timer and supersets, a big stepper for weights and reps, a stopwatch for timed sets, a menu to swap, skip or annotate an exercise, kept on the phone and sent when the network allows; its preferences (unit, default rest, weight step, timer sound and vibration) are on Profile, with the plan editor's RPE field, off by default. Home shows the active plan with the suggested day, Start, a free workout and the week. After a workout its summary asks how it felt, and history, under Progress, keeps every workout with its sets. Every wait for the server has a sign: grey shapes on a first load, a spinner in the search box while a search runs, and in a button while its request does; the offline app comes next. The other features come next, in the order of the [road to the MVP](docs/project/backlog.md#road-to-the-mvp). Deploying comes later ([OPS-3](docs/project/backlog.md#ops-3-deploy-to-the-free-server)).

## Contents

- [Local development](#local-development)
- [Documentation](#documentation)

---

## Local development

Needs Docker and Node only: PHP and Composer run inside the backend container (`Dockerfile`, `compose.yaml`).

Ports on your computer are each service's standard port + 500, so they never clash with other projects. On Windows, run the commands from Git Bash ([S1.2](docs/start/S1-setup.md#s12-prerequisites)).

| Service | Address |
|---|---|
| Laravel (API, admin) | http://localhost:8500 |
| Postgres | `localhost:5932`, user, password and database `atleoplan` |
| Mailpit (caught emails) | http://localhost:8525 |
| Vite (React, once it exists) | http://localhost:5673 |

```sh
make setup        # first time on a new clone
make fresh        # the fixed lists (muscles, equipment) and the development account
make exercises-import   # the public exercise library, from free-exercise-db, translated
make up           # start the backend stack;  make dev  starts React
make help         # every command
make down         # stop (data is kept)
```

First time on this computer, creating the apps, every command and known problems: [S1. Setup](docs/start/S1-setup.md).

---

## Documentation

Everything lives in [`docs/`](docs), grouped by what you are looking for. **[docs/README.md](docs/README.md)** is the index of every document.

| Folder | Look here to… |
|---|---|
| [`docs/start/`](docs/start) (S) | install and start the project, solve setup problems |
| [`docs/design/`](docs/design) (D) | know what the app does and why: screens, decisions, tables |
| [`docs/concepts/`](docs/concepts) (C) | understand how the React and Laravel code works |
| [`docs/how-to/`](docs/how-to) (H) | do something step by step, with the commands and their output |
| [`docs/project/`](docs/project) (P) | know how we work (conventions) and what comes next (backlog) |
| [`docs/learn/`](docs/learn) (L) | learn Laravel and React themselves, lesson by lesson, with exercises |

Each document has a code: its folder's letter and a number, such as `H2`. Its sections follow it, so a reference such as "see H2.3", in these pages or in a code comment, points to section 3 of `docs/how-to/H2-backend.md`.
