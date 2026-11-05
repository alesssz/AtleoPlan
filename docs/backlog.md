# Backlog

Work that is known and waiting: features, interface, backend and data changes, tooling, docs. One entry per point, each small enough to be picked up and finished on its own, with what is missing, the options and the one recommended.

This page is not a numbered section of the docs: it changes all the time, and it empties as work gets done.

## How this page works

- **One point, one branch** ([3.1](03-conventions.md#31-git)); several small points may share one.
- **Done means deleted.** The branch that does a point removes its entry in the same commit. What the change did is told by the commit and by the section it touched, not here.
- **IDs are never reused.** Each entry has an area prefix and a number (`UI-5`, `BE-2`), kept for good. Each area counts on its own; the next number is one above the highest ever used in that area (`git log -S "UI-" -- docs/backlog.md` finds deleted ones).
- **Areas:** `UI` interface, `FEAT` features, `BE` server, `DATA` database, `OPS` tooling, CI, deployment, `DOCS` documentation. They appear with their first entry and go when they empty.
- **Priority:** high (in the way), medium (worse than it should be), low (polish).

### Template

```markdown
### UI-n Short statement of the problem

**Priority:** high | medium | low · **Kind:** e.g. missing feature, phones · **Found:** YYYY-MM-DD

**What is missing.** What, where, and why it matters.

**Options.**
- A) …
- B) …

**Recommended.** Which option and why.
```

---

## OPS

### OPS-1 Create the project skeleton

**Priority:** high · **Kind:** setup · **Found:** 2026-11-05

**What is missing.** There is no code yet: no Laravel app, no React app, no local stack.

**Options.**
- A) One repository with `backend/` (Laravel) and `frontend/` (React + Vite), and a Docker Compose for Postgres and the local services.
- B) Two repositories, one per app.

**Recommended.** A: one repository, one history, one place for the docs; the production stack is one Docker Compose anyway ([2.6](02-decisions.md#26-hosting)).

### OPS-2 Check that the AtleoPlan name is free

**Priority:** medium · **Kind:** naming · **Found:** 2026-11-05

**What is missing.** The name ([2.1](02-decisions.md#21-name)) has not been checked against domains (`.app`, `.com`), App Store, Play Store and EU trademarks (EUIPO).

**Recommended.** Check before buying a domain or opening store accounts; DuckDNS needs no check.

### OPS-3 Deploy to the free server

**Priority:** low · **Kind:** deployment, postponed · **Found:** 2026-11-05

**What is missing.** The app runs only on the local machine. Deploying waits until there is something worth using away from the desk; the plan is in [2.6](02-decisions.md#26-hosting).

**Steps, when it is time.**
- Check again the free tiers (Oracle, DuckDNS): they change often.
- Create the Oracle Always Free account (home region Milan or Frankfurt) and an ARM VM with Ubuntu 24.04.
- Open ports 80 and 443, both in the Oracle console and in the VM's `iptables`.
- Install Docker, point `atleoplan.duckdns.org` at the VM, start the production Compose.
- Set up backups of the database and of the media on the server's disk ([2.5](02-decisions.md#25-photos-and-videos)).
- Write the deployment section of the docs ([3.3](03-conventions.md#33-documentation)).

**Recommended.** Keep the local stack close to the production one (same Docker images, Postgres rather than SQLite), so that deploying is a configuration step and not a rewrite.

## DATA

### DATA-1 Import and translate free-exercise-db

**Priority:** high · **Kind:** seed data · **Found:** 2026-11-05

**What is missing.** The public library is empty until free-exercise-db is imported ([2.3](02-decisions.md#23-exercise-library)).

**Options.**
- A) A Laravel command that reads the JSON and the photos and writes them into the database, plus a separate translation script.
- B) A one-off SQL dump.

**Recommended.** A: the command can run again on a fresh database, and translations get their **Machine translated** flag as they are written.
