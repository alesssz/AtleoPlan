# H5. Continuous integration

What GitHub runs on every push: the workflows and their triggers, the repository settings they rely on, the audit's reviewed advisories, reading a failed run, and the same checks run locally. Why it is built this way: [D2.11](../design/D2-decisions.md#d211-continuous-integration).

## Contents

- [H5.1 What runs, and when](#h51-what-runs-and-when)
- [H5.2 The files](#h52-the-files)
  - [H5.2.1 ci.yml](#h521-ciyml)
  - [H5.2.2 audit.yml](#h522-audityml)
  - [H5.2.3 dependabot.yml](#h523-dependabotyml)
- [H5.3 The settings on GitHub](#h53-the-settings-on-github)
  - [H5.3.1 Checking everything from the terminal: make github-check](#h531-checking-everything-from-the-terminal-make-github-check)
- [H5.4 The audit and the advisories reviewed](#h54-the-audit-and-the-advisories-reviewed)
- [H5.5 Reading a run, and a failed one](#h55-reading-a-run-and-a-failed-one)
- [H5.6 The same checks on the computer](#h56-the-same-checks-on-the-computer)

---

## H5.1 What runs, and when

| File | Runs | Does | Fails when |
|---|---|---|---|
| `.github/workflows/ci.yml` | every push, to any branch; by hand | the checks of `make check`, in two jobs side by side: **Frontend and docs** (contents lists, ESLint, TypeScript, Vitest, the build), **Backend** (Pint, the Pest tests on Postgres) | any check fails |
| `.github/workflows/audit.yml` | Mondays at 06:00 UTC; a push or pull request changing `package.json`, `package-lock.json`, `composer.json` or `composer.lock`; by hand | the npm and Composer packages against the advisory databases; a list of outdated packages in the run's summary | an advisory not reviewed (H5.4), or an abandoned Composer package |
| `.github/dependabot.yml` | Mondays | a pull request with new versions of the actions the workflows use (`actions/checkout`, `actions/setup-node`) | never: it is a proposal, checked by its own CI run |
| **CodeQL**, no file: GitHub's *default setup*, turned on in the settings | every push to `main`, and weekly | analyses the TypeScript and JavaScript code and the workflows for security issues | never fails a push: it opens **alerts** in **Security → Code scanning** |

**Where it sits in the way of working** ([P1.1](../project/P1-conventions.md#p11-git)): a branch is pushed with `make push`; GitHub runs CI on it, and the audit if the dependencies changed. `make merge` runs `make check`, opens the branch's pull request and turns on auto-merge; `main`'s ruleset lets GitHub merge it only once both CI jobs passed, and the merge runs CI again on `main`. CI runs on a clean machine, so a file not committed or a package installed by hand cannot hide a problem.

Every workflow uses only GitHub's own actions, pinned to a commit hash (the shared `.github/actions/setup` included), a read-only token and `persist-credentials: false` ([D2.11](../design/D2-decisions.md#d211-continuous-integration)).

---

## H5.2 The files

### H5.2.1 ci.yml

```yaml
on:
  push:
    branches: ['**']
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

- **`push` on any branch (`'**'` includes names with slashes), no `pull_request`:** the branch's run is also its pull request's; a `pull_request` trigger would run the same checks twice. A fork's pull request runs nothing until the owner approves it.
- **`concurrency`:** a new push to a branch cancels its run still going; on `main` each merge keeps its run.

**The frontend job:**

```yaml
defaults:
  run:
    working-directory: frontend
steps:
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
    with:
      persist-credentials: false
  - uses: ./.github/actions/setup      # Node of .nvmrc, npm ci in frontend/
  - run: node scripts/docs-toc.mjs --check
    working-directory: .
  - run: npm run lint
  - run: npm run typecheck
  - run: npm test
  - run: npm run build
```

- **`npm ci`** fails when `package-lock.json` does not match `package.json`, so a run never tests a lockfile nobody committed. The npm cache is keyed on the lockfile.
- **The build** is the one check `make check` does not run: an import that Vitest resolves but Vite's build does not would fail only here.

**The backend job**, in the backend's own Docker image, with Postgres:

```yaml
steps:
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
    with:
      persist-credentials: false
  - run: cp backend/.env.example backend/.env
  - run: docker compose build backend
  - run: docker compose up -d --wait postgres
  - run: docker compose run --rm backend composer install --no-interaction --no-progress
  - run: docker compose run --rm backend php artisan key:generate
  - run: docker compose run --rm backend vendor/bin/pint --test
  - run: docker compose run --rm backend php artisan test
  - if: failure()
    run: docker compose logs --no-color
```

These are `make setup`'s steps ([S1.5](../start/S1-setup.md#s15-first-start-the-docker-stack)), then `make pint-check` and `make test`:

- **`backend/.env`** comes from the example: the repository holds no secret, and the tests need none. Their own settings come from `backend/phpunit.xml`, which forces the test database `atleoplan_test`, the mail kept in memory and the jobs run at once ([C2.11](../concepts/C2-backend.md#c211-tests-with-pest)).
- **`docker compose build backend`**: the development image (`Dockerfile`, target `dev`), the same PHP and extensions as locally. Built from scratch on every run: a few minutes.
- **`up -d --wait postgres`**: Postgres alone, until its health check passes. Its first start runs `docker/postgres/init/01-test-database.sql`, which creates `atleoplan_test`.
- **`run --rm`**, as `make setup` does with the stack stopped; `depends_on` starts Postgres and Mailpit first.
- **`if: failure()`** prints the containers' logs only when a step failed.

`timeout-minutes` stops a stuck job after 15 (frontend) or 25 (backend) minutes.

### H5.2.2 audit.yml

```yaml
on:
  schedule:
    - cron: '0 6 * * 1'       # Mondays, 06:00 UTC
  workflow_dispatch:
  push:
    branches: ['**']
    paths: [frontend/package.json, frontend/package-lock.json, backend/composer.json, backend/composer.lock]
  pull_request:
    paths: [ … the same … ]
```

- **The weekly run** catches a new advisory on a package that did not change. A failed scheduled run is emailed to the owner.
- **`paths`:** a branch that brings a vulnerable version fails beside its CI, before the merge.
- **`pull_request`** only for a fork's (the job's `if`): this repository's branches are audited on push.

**The npm job:** Node, `npm ci`, `npm outdated` into the run's summary, then `node scripts/npm-audit.mjs` (H5.4).

**The Composer job** runs Composer's official image on the lockfile, without building the backend's image:

```sh
docker run --rm -v "$PWD/backend:/app:ro" -w /app composer:2 composer audit --locked
```

- **`--locked`** reads `composer.lock` alone, installing nothing; `backend/` is mounted read-only.
- **`composer outdated --direct --locked --ignore-platform-reqs`** writes the summary's list: `composer:2` lacks the project's PHP extensions, which an outdated check does not need.
- **The outdated lists** go to `$GITHUB_STEP_SUMMARY`, each command followed by `|| true`: `npm outdated` exits 1 when anything is outdated, which must not fail the run.

### H5.2.3 dependabot.yml

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
    groups:
      github-actions:
        patterns: ['*']
```

Once a week, one pull request (`groups`) with the new versions of the actions in the workflows. Its CI runs on its branch; it is merged like any branch, after reading what changed.

**npm and Composer are left out of version updates on purpose:** a pull request per package per week would be noise for a single maintainer; updates are made by hand, a few at a time, with `make check`. Their **security** is still watched twice: Dependabot's alerts and security updates (turned on in the settings, [P1.5.2](../project/P1-conventions.md#p152-the-repositorys-settings-on-github)), and `audit.yml`.

---

## H5.3 The settings on GitHub

Set by the repository's owner; [P1.5.2](../project/P1-conventions.md#p152-the-repositorys-settings-on-github) lists the rest of the repository's settings.

**Settings → Actions → General:**

| Setting | Choice | Why |
|---|---|---|
| **Actions permissions** | **Allow alesssz, and select non-alesssz, actions and reusable workflows**, with only **Allow actions created by GitHub** ticked | The workflows use only `actions/*`; an action of anyone else is code that would run with the repository's token. A workflow that names another is refused before it runs |
| **Approval for running fork pull request workflows from contributors** | **Require approval for all external contributors** | A stranger's pull request runs nothing until the owner has read it |
| **Workflow permissions** | **Read repository contents and packages permissions** | The default token reads only; each workflow says it again (`permissions: contents: read`) |
| | **Allow GitHub Actions to create and approve pull requests**: off | No workflow should open or approve pull requests |

**The ruleset of `main`** (**Settings → Rules → Rulesets → main**): besides **Restrict deletions** and **Block force pushes**, **Require a pull request before merging** (no approvals needed: one person) and **Require status checks to pass** with the two jobs, **Frontend and docs** and **Backend**. In **Settings → General → Pull Requests**: **Allow merge commits** and **Allow auto-merge** on, so `make merge` can hand the merge to GitHub.

**Settings → Advanced Security** (on some accounts **Code security**), besides the protections of [P1.5.2](../project/P1-conventions.md#p152-the-repositorys-settings-on-github):

| Setting | Choice | Why |
|---|---|---|
| **CodeQL analysis** | **Set up → Default**, with the languages it finds (here `actions` and `javascript-typescript`), suite **Default** | Free on a public repository, run with GitHub's own action (`github/codeql-action`), so "GitHub's actions only" still holds. CodeQL does not support PHP: there, the tests and the policies stand guard |

Secret scanning's **non-provider patterns** and **validity checks** are not offered on a personal account's repository; turn them on if they appear.

**How to check:** after `make push`, **Actions** shows **CI** on the branch, two jobs, and **Audit** when a lockfile changed. Every setting of this section and of P1.5.2: `make github-check`, below.

### H5.3.1 Checking everything from the terminal: make github-check

`scripts/github-check.mjs` reads each setting of H5.3 and P1.5.2 through GitHub's API with `gh`, and compares it with the value decided, as `make doctor` does for the local machine: ✔, ⚠ worth a look, ✖ with where to change it. It only reads. It is run after changing a setting, and once a month.

**Prerequisite:** `gh` installed ([cli.github.com](https://cli.github.com); on Windows the script also looks in `C:\Program Files\GitHub CLI\`) and signed in with `gh auth login` as the repository's owner: another account gets `Not Found` on the owner-only endpoints, reported as failures.

```sh
make github-check
```

It reports, in groups: `gh` and the repository; Actions permissions; code security (secret scanning, push protection, Dependabot security updates, private vulnerability reporting, CodeQL); `main`'s ruleset; open alerts; the last runs of `ci.yml` and `audit.yml` on `main`. An open Dependabot or CodeQL alert is a warning; an open **secret scanning** alert is a failure: the secret is revoked first ([P1.5.3](../project/P1-conventions.md#p153-alerts-and-reports)).

A single setting by hand, e.g. `gh api repos/alesssz/AtleoPlan/actions/permissions/workflow`, or `gh run list --limit 5` for the last runs.

---

## H5.4 The audit and the advisories reviewed

**npm** has no way to leave an advisory out of `npm audit`, and some cannot be fixed: no patched version exists, or the packages that bring it do not work with the patched one. Plain `npm audit` would fail every run on it, and a failure that is always there hides the new one that matters. So `scripts/npm-audit.mjs`:

1. runs `npm audit --json` in `frontend/`;
2. keeps the **advisories** (the objects in each package's `via`), one each, by their GHSA id;
3. leaves out those in `frontend/package.json` under **`auditIgnore`**, each with the reason it was left out;
4. prints them all, says which entries of the list are no longer found, and **fails on any other advisory, of any severity**.

```json
"auditIgnore": {
  "GHSA-xxxx-xxxx-xxxx": "package, severity: who brings it, why it cannot reach the app, why there is no fix"
}
```

It is empty today.

```sh
make audit                       # Composer's audit, then this script
node scripts/npm-audit.mjs       # the npm part alone
```

**A new advisory fails the Audit run. In order:**

1. Who brings the package, and does it reach the app or only the tools: `npm audit`, `npm ls <package>` ([H3.7.1](H3-frontend.md#h371-a-vulnerable-package-deep-in-the-tree-overrides)).
2. A fix, on a `chore/…` branch: update the package that brings it; or an `overrides`, checked by hand.
3. Only when no fix exists and the risk is understood: an entry in `auditIgnore`, the GHSA id and a reason a reader can check. On GitHub, the same advisory dismissed with the same reason (**Security → Dependabot → Dismiss alert**).
4. When the script says an entry is **no longer found**, the package was fixed or removed: the entry goes.

**Composer** has its own list, in `backend/composer.json`, read by `composer audit` locally and in the workflow alike:

```json
"config": {
  "audit": {
    "ignore": {
      "GHSA-xxxx-xxxx-xxxx": "the reason"
    }
  }
}
```

It is empty. Composer also fails on an **abandoned** package (`audit.abandoned: fail`, its default): the fix is the replacement it names.

---

## H5.5 Reading a run, and a failed one

1. **Open the failed job** in the **Actions** tab: the failed step's last lines say why, as `make check` would. The audit's outdated lists are in the run's summary.
2. **Reproduce it locally** with the same command (H5.6), fix it on the branch, push again.
3. **A failure that is not the code** (GitHub or Docker Hub down, a network timeout): **Re-run failed jobs**.

| The step that failed | Usually | On the computer |
|---|---|---|
| `node scripts/docs-toc.mjs --check` | A heading changed without `make toc` | `make toc`, commit |
| `npm ci` | `package.json` changed, `package-lock.json` not committed | `npm install` in `frontend/`, commit the lockfile |
| `npm run lint`, `typecheck`, `npm test`, `npm run build` | As on the computer | the same command in `frontend/` |
| `docker compose build backend` | The `Dockerfile` changed and does not build, or Docker Hub is down | `make build` |
| `composer install` | `composer.json` changed, `composer.lock` not committed | `make composer c="update --lock"` or the command that changed it, commit the lock |
| `pint --test` | PHP not formatted | `make pint`, commit |
| `php artisan test` | A test fails; the logs of `docker compose logs`, printed after it, help when the database is involved | `make test` |
| `npm-audit.mjs`, `composer audit` | A new advisory | H5.4 |

**A CodeQL alert** is not a failed run: it appears in **Security → Code scanning**, and `make github-check` counts it. It is fixed on a `fix/…` branch and closes by itself at the next analysis of `main`; a false positive is dismissed with its reason, as the advisories of H5.4 are.

---

## H5.6 The same checks on the computer

| CI step | On the computer |
|---|---|
| contents lists | `make toc-check` |
| `npm ci` | `npm ci` in `frontend/` (`make fe-install` runs `npm install`, which may change the lockfile) |
| lint, types, tests | `make lint`, `make typecheck`, `make fe-test` |
| build | `make fe-build` |
| Pint, Pest | `make pint-check`, `make test` |
| npm and Composer audits | `make audit` |

`make check` runs all of them but the build and the audit. Locally the stack, the packages and the database already exist; in CI everything starts from scratch. A problem only CI sees is almost always something the local clone has and the repository does not: a file not committed, a package installed without its lockfile, a database left from an earlier migration. To reproduce the backend job from scratch, run its steps (H5.2.1) on a fresh clone.

---

← [H4. Opening the database](H4-database-tools.md) · [Contents](../README.md) · [P1. Conventions](../project/P1-conventions.md) →
