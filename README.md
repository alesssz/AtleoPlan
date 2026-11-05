# AtleoPlan

*Your plans, your progress.*

A workout app for building training plans out of a library of exercises, following them at the gym and logging every set to see progress over time. Exercises live in a library of their own, public or personal, with photos and videos; a plan is made of days, each holding exercises with their sets, reps and rest. Plans can be shared through a link.

It works on phones and desktop as a PWA, offline during workouts, in Italian, English, Spanish and German. Backend in Laravel (API), frontend in React + TypeScript, hosted for free on a single server ([2.6](docs/02-decisions.md#26-hosting)).

**Status:** design. There is no code yet; the next step is the project skeleton ([OPS-1](docs/backlog.md#ops-1-create-the-project-skeleton)). Development runs locally; deploying comes later ([OPS-3](docs/backlog.md#ops-3-deploy-to-the-free-server)).

---

## Documentation

Everything lives in [`docs/`](docs/), one file per section. Sections keep their numbers, so a reference such as "see 2.5" (in these pages or in a code comment) points to section 2.5 of `docs/02-decisions.md`.

| Section | What it covers |
|---|---|
| [1. UI design](docs/01-ui-design.md) | Users, design principles, user journeys, navigation and routes, every screen, design system, states (empty, loading, error, offline), responsive layout and accessibility, release phases |
| [2. Decisions](docs/02-decisions.md) | Name, stack, exercise library and its import, languages, photo and video limits and storage, hosting, offline sync, workout rules |
| [3. Conventions](docs/03-conventions.md) | Git, code and comments, documentation, backlog |

Outside the numbered sections, **[Backlog](docs/backlog.md)** lists the work known and waiting, one entry per point with options and a recommendation; an entry is deleted when its work is done.
