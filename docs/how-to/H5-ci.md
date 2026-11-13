# H5. Continuous integration

How GitHub checks every push by itself: what runs, when, in which files, how to read a run that failed, and how the same checks run on the computer. It is written for someone who has never seen GitHub Actions. Why it is built this way: [D2.11](../design/D2-decisions.md#d211-continuous-integration).

**How to read this page:**

- What it does, in one table: [H5.1](#h51-what-runs-and-when).
- The files, line by line: [H5.2](#h52-the-files).
- The settings to make on GitHub, once: [H5.3](#h53-the-settings-on-github).
- A run failed: [H5.5](#h55-reading-a-run-and-a-failed-one).
- An advisory to review, or a package to leave out of the audit: [H5.4](#h54-the-audit-and-the-advisories-reviewed).

## Contents

- [H5.1 What runs, and when](#h51-what-runs-and-when)
- [H5.2 The files](#h52-the-files)
  - [H5.2.1 The words of GitHub Actions](#h521-the-words-of-github-actions)
  - [H5.2.2 ci.yml](#h522-ciyml)
  - [H5.2.3 audit.yml](#h523-audityml)
  - [H5.2.4 dependabot.yml](#h524-dependabotyml)
- [H5.3 The settings on GitHub](#h53-the-settings-on-github)
- [H5.4 The audit and the advisories reviewed](#h54-the-audit-and-the-advisories-reviewed)
- [H5.5 Reading a run, and a failed one](#h55-reading-a-run-and-a-failed-one)
- [H5.6 The same checks on the computer](#h56-the-same-checks-on-the-computer)
- [H5.7 As built](#h57-as-built)
  - [H5.7.1 The commands, in order](#h571-the-commands-in-order)
  - [H5.7.2 Trying the backend job in a clean clone](#h572-trying-the-backend-job-in-a-clean-clone)
  - [H5.7.3 The errors met](#h573-the-errors-met)

---

## H5.1 What runs, and when

| File | Runs | Does | Fails when |
|---|---|---|---|
| `.github/workflows/ci.yml` | every push, to any branch; by hand | the checks of `make check`, in two jobs side by side: **Frontend and docs** (contents lists, ESLint, TypeScript, Vitest, the build), **Backend** (Pint, the Pest tests on Postgres) | any check fails |
| `.github/workflows/audit.yml` | Mondays at 06:00 UTC; a push or pull request changing `package.json`, `package-lock.json`, `composer.json` or `composer.lock`; by hand | the npm and Composer packages against the advisory databases; a list of outdated packages in the run's summary | an advisory not reviewed (H5.4), or an abandoned Composer package |
| `.github/dependabot.yml` | Mondays | a pull request with new versions of the actions the workflows use (`actions/checkout`, `actions/setup-node`) | never: it is a proposal, checked by its own CI run |

**Where it sits in the way of working** ([P1.1](../project/P1-conventions.md#p11-git)): a branch is pushed with `make push`; GitHub runs CI on it, and the audit if the dependencies changed; once the run is green, `make merge` merges it on the computer and pushes `main`, which runs CI again on the merge. `make merge` also runs `make check` itself, so CI is the second look, on a clean Linux machine where nothing of the computer (a file not committed, a package installed by hand) can hide a problem.

The same layout as Chronovault's workflows ([D2.11](../design/D2-decisions.md#d211-continuous-integration)): `ci.yml`, `audit.yml`, `dependabot.yml`, a read-only token, runs on any branch.

---

## H5.2 The files

### H5.2.1 The words of GitHub Actions

| Word | Means | Here |
|---|---|---|
| **Workflow** | A YAML file in `.github/workflows/`: what to run and when | `ci.yml`, `audit.yml` |
| **Trigger** (`on:`) | The events that start it | `push`, `schedule` (a cron), `pull_request`, `workflow_dispatch` (a button in the Actions tab) |
| **Job** | A set of steps on one machine; jobs run side by side unless one `needs` another | `frontend` and `backend`; `npm` and `composer` |
| **Runner** | The machine: a fresh Linux virtual machine per job (`runs-on: ubuntu-latest`), with Git, Node, Docker; thrown away at the end | |
| **Step** | One line of the job: `uses:` an action, or `run:` a shell command | |
| **Action** | A ready-made step from another repository, `owner/name@version` | only GitHub's own: `actions/checkout`, `actions/setup-node` |
| **Token** (`GITHUB_TOKEN`) | The key the job gets to the repository; `permissions:` sets what it may do | read the code, nothing else |
| **Run** | One execution of a workflow, with its logs | the **Actions** tab |

A step fails when its command ends with an exit code other than 0; the job stops there, and the run is red.

### H5.2.2 ci.yml

```yaml
on:
  push:
    branches: ['**']        # any branch: '**' matches names with slashes too, feat/…
  workflow_dispatch:         # the "Run workflow" button
permissions:
  contents: read             # read-only token
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

- **`push` on any branch, no `pull_request`:** branches are merged on the computer, never through a pull request, so a pull request would only run the same checks twice. A pull request opened on GitHub by someone else runs nothing here until it is merged, which is the owner's choice.
- **`concurrency`:** runs of the same branch (`github.ref`) form a group; a new push cancels the one still going, since only the latest commit matters. Not on `main`: each merge keeps its run.
- **`${{ … }}`** is an expression GitHub works out before the run: `github.ref` is the branch, `refs/heads/feat/ci`.

**The frontend job:**

```yaml
defaults:
  run:
    working-directory: frontend
steps:
  - uses: actions/checkout@v7          # the repository's code, at the pushed commit
  - uses: actions/setup-node@v7
    with:
      node-version-file: .nvmrc        # Node 24, as on the computers
      cache: npm
      cache-dependency-path: frontend/package-lock.json
  - run: node scripts/docs-toc.mjs --check
    working-directory: .
  - run: npm ci
  - run: npm run lint
  - run: npm run typecheck
  - run: npm test
  - run: npm run build
```

- **`npm ci`, not `npm install`:** it installs exactly the lockfile's versions, and fails if `package-lock.json` does not match `package.json` (a package added without its lockfile committed). `npm install` would quietly fix the lockfile, and the run would test something nobody committed.
- **The npm cache** keeps the downloaded packages between runs, keyed on the lockfile: an unchanged lockfile installs in seconds.
- **The build** is the one check `make check` does not run: an import that Vitest resolves but Vite's build does not would fail only here.

**The backend job**, in the backend's own Docker image, with Postgres:

```yaml
steps:
  - uses: actions/checkout@v7
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
- **`docker compose build backend`**: the image of development (`Dockerfile`, target `dev`), the same PHP and extensions as on the computers. Built from nothing on every run: a few minutes.
- **`up -d --wait postgres`**: Postgres alone, `--wait` until its health check passes. On its first start it runs `docker/postgres/init/01-test-database.sql`, which creates `atleoplan_test`.
- **`run --rm`**: a container for one command, removed afterwards, as `make setup` does with the stack stopped. It starts Postgres and Mailpit first (`depends_on` in `compose.yaml`).
- **`if: failure()`**: a step that runs only when one before it failed, here the containers' logs, Postgres's above all.

`timeout-minutes` on each job stops a stuck run after 15 or 25 minutes, instead of GitHub's six hours.

### H5.2.3 audit.yml

```yaml
on:
  schedule:
    - cron: '0 6 * * 1'       # minute 0, hour 6 (UTC), any day of the month, any month, Monday
  workflow_dispatch:
  push:
    branches: ['**']
    paths: [frontend/package.json, frontend/package-lock.json, backend/composer.json, backend/composer.lock]
  pull_request:
    paths: [ … the same … ]
```

- **The weekly run** finds a new advisory on a package that did not change: the code is the same, the advisory database is not. A failed scheduled run is emailed to the owner.
- **`paths`:** on a push, only when one of these files changed: a branch that adds a vulnerable version fails beside its CI, before the merge.
- **`pull_request`** this time: Dependabot's security updates arrive as pull requests, and are audited there.

**The npm job:** Node, `npm ci`, `npm outdated` into the run's summary, then `node scripts/npm-audit.mjs` (H5.4).

**The Composer job** needs no PHP of the project's:

```sh
docker run --rm -v "$PWD/backend:/app:ro" -w /app composer:2 composer audit --locked
```

- **`composer:2`**, Composer's official image from Docker Hub. **`--locked`** reads `composer.lock` alone, installing nothing, which is all an audit needs; building the backend's image would take minutes for the same answer.
- **`:ro`**: `backend/` mounted read-only; neither command writes there.
- **`composer outdated --direct --locked --ignore-platform-reqs`** for the summary: the packages the project asks for, with their newer versions. `--ignore-platform-reqs` because that image lacks the project's PHP extensions (H5.7.3).

**`GITHUB_STEP_SUMMARY`** is a file whose Markdown GitHub shows on the run's page, under the jobs: `{ echo …; npm outdated || true; } >> "$GITHUB_STEP_SUMMARY"` writes the list there. `|| true`: `npm outdated` exits 1 when anything is outdated, which must not fail the run.

### H5.2.4 dependabot.yml

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

**npm and Composer are left out of version updates on purpose:** a pull request per package per week would be noise for a project of one person, and updates are made by hand, a few at a time, with `make check`. Their **security** is still watched twice: Dependabot's alerts and security updates (turned on in the settings, [P1.5.2](../project/P1-conventions.md#p152-the-account-and-the-repository-on-github)), and `audit.yml`.

---

## H5.3 The settings on GitHub

Once, by the owner, after the branch is on `main` (the workflows exist only then). These are the settings [P1.5.3](../project/P1-conventions.md#p153-from-here-on) had kept for when a CI arrived.

**Settings → Actions → General:**

| Setting | Choice | Why |
|---|---|---|
| **Actions permissions** | **Allow alesssz, and select non-alesssz, actions and reusable workflows**, with only **Allow actions created by GitHub** ticked | The workflows use only `actions/*`; an action of anyone else is code that would run with the repository's token. A workflow that names another is refused before it runs |
| **Approval for running fork pull request workflows from contributors** | **Require approval for all external contributors** | A stranger's pull request runs nothing until the owner has read it |
| **Workflow permissions** | **Read repository contents and packages permissions** | The default token reads only; each workflow says it again (`permissions: contents: read`) |
| | **Allow GitHub Actions to create and approve pull requests**: off | No workflow should open or approve pull requests |

If Actions were turned off while there was no CI, turn them on with the first setting.

**Not a required check on `main`.** A ruleset can demand that a status check passed before a push to `main` (**Require status checks to pass**). Here `make merge` pushes a merge commit made on the computer, which no check has seen yet: GitHub would refuse it. The rule stays a habit instead: a green run on the branch before `make merge`.

**How to check:** push a branch (`make push`): **Actions** shows **CI** running on it, two jobs; with a change to a lockfile, **Audit** too. **Actions → Audit → Run workflow** runs the audit by hand.

---

## H5.4 The audit and the advisories reviewed

**npm** has no way to leave an advisory out of `npm audit`, and some cannot be fixed: `deepmerge`'s has no patched version, and only shadcn's command, a development tool, uses it ([H3.7.1](H3-frontend.md#h371-a-vulnerable-package-deep-in-the-tree-overrides)). Plain `npm audit` would fail every run on it, and a failure that is always there hides the new one that matters. So `scripts/npm-audit.mjs`:

1. runs `npm audit --json` in `frontend/`;
2. keeps the **advisories** (the objects in each package's `via`), one each, by their GHSA id;
3. leaves out those in `frontend/package.json` under **`auditIgnore`**, each with the reason it was left out;
4. prints them all, says which entries of the list are no longer found, and **fails on any other advisory, of any severity**.

```json
"auditIgnore": {
  "GHSA-gcqx-w48m-w2h4": "deepmerge, low: only in shadcn's command, a development tool, never in the app; no patched version exists (docs/how-to/H3-frontend.md H3.7.1)"
}
```

```sh
make audit                       # Composer's audit, then this script
node scripts/npm-audit.mjs       # the npm part alone
```

```
npm audit: 1 advisory found, 0 new.
  GHSA-gcqx-w48m-w2h4  deepmerge  low  deepmerge mergeObject() allows prototype poisoning of returned objects
      ignored: deepmerge, low: only in shadcn's command, a development tool, never in the app; no patched version exists (docs/how-to/H3-frontend.md H3.7.1)

✔ No new advisory.
```

**A new advisory fails the Audit run. In order:**

1. Who brings the package, and does it reach the app or only the tools: `npm audit`, `npm ls <package>` ([H3.7.1](H3-frontend.md#h371-a-vulnerable-package-deep-in-the-tree-overrides)).
2. A fix, on a `chore/…` branch: update the package that brings it; or an `overrides`, checked by hand.
3. Only when no fix exists and the risk is understood: an entry in `auditIgnore`, the GHSA id and a reason a reader can check. On GitHub, the same advisory dismissed with the same reason (**Security → Dependabot → Dismiss alert**).
4. When the script says an entry is **no longer found**, the package was fixed or removed: the entry goes.

**Composer** has its own list, in `backend/composer.json`, read by `composer audit` on the computer and in the workflow alike:

```json
"config": {
  "audit": {
    "ignore": {
      "GHSA-xxxx-xxxx-xxxx": "the reason"
    }
  }
}
```

Today it is empty: `composer audit` finds nothing. Composer also fails on an **abandoned** package (`audit.abandoned: fail`, its default), one its author no longer maintains: the answer is the replacement it names.

---

## H5.5 Reading a run, and a failed one

**Where:** the repository's **Actions** tab lists the runs, newest first, with the commit's message and the branch. A red ✖ is a failure; GitHub also emails it to whoever pushed (the owner, for a scheduled run).

1. **Open the run:** its jobs, each green or red, and the **summary** under them (the audit's lists).
2. **Open the red job:** its steps; the failed one is open, its log printed as on a terminal. The last lines say why, exactly as `make check` would.
3. **Reproduce it on the computer** with the same command (H5.6), fix it on the branch, push again: a new run starts by itself.
4. **A failure that is not the code** (GitHub or Docker Hub down, a network timeout): **Re-run jobs → Re-run failed jobs**, at the top right of the run.

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

---

## H5.6 The same checks on the computer

| CI step | On the computer |
|---|---|
| contents lists | `make toc-check` |
| `npm ci` | `make fe-install` (an `npm install`, which may change the lockfile; `npm ci` in `frontend/` for the strict one) |
| lint, types, tests | `make lint`, `make typecheck`, `make fe-test` |
| build | `make fe-build` |
| Pint, Pest | `make pint-check`, `make test` |
| npm and Composer audits | `make audit` |

`make check` runs all of them but the build and the audit. The one difference that matters: on the computer the stack, the packages and the database already exist; in CI everything starts from nothing. A problem that only CI sees is almost always something the computer has and the repository does not: a file not committed, a package installed without its lockfile, a database left from before. H5.7.2 shows how to try the backend job from nothing, on the computer.

---

## H5.7 As built

`chore/ci`, modelled on Chronovault's workflows ([D2.11](../design/D2-decisions.md#d211-continuous-integration)).

| File | What |
|---|---|
| `.github/workflows/ci.yml` | New: the two jobs of H5.2.2 |
| `.github/workflows/audit.yml` | New: the two jobs of H5.2.3 |
| `.github/dependabot.yml` | New: the actions' weekly updates |
| `scripts/npm-audit.mjs` | New: npm's audit with the list of advisories reviewed (H5.4) |
| `frontend/package.json` | `auditIgnore`, with a `"//auditIgnore"` note (JSON takes no comments; npm ignores fields named `//…`) |
| `Makefile` | `make audit` runs `scripts/npm-audit.mjs` instead of `npm audit` |
| Docs | This page; [D2.11](../design/D2-decisions.md#d211-continuous-integration); [P1.1](../project/P1-conventions.md#p11-git), [P1.5.3](../project/P1-conventions.md#p153-from-here-on); the README's badge |

### H5.7.1 The commands, in order

```sh
make branch name=chore/ci
```

```
git switch -c chore/ci
Switched to a new branch 'chore/ci'
```

1. **The audit script first**, since both `make audit` and the workflow use it. Run on the project, then with the list changed by hand to prove it fails (a made-up `GHSA-xxxx-old0-0000` in place of deepmerge's), then put back:

```
npm audit: 1 advisory found, 1 new.
  GHSA-gcqx-w48m-w2h4  deepmerge  low  deepmerge mergeObject() allows prototype poisoning of returned objects
      NEW
  GHSA-xxxx-old0-0000 is in auditIgnore but no longer found: remove it from frontend/package.json

✖ 1 advisory not reviewed: fix it, or review it and add it to auditIgnore with the reason (docs/how-to/H5-ci.md H5.4).
exit 1
```

2. **The three YAML files**, then checked with **actionlint**, a linter of workflows that knows GitHub's syntax and expressions and runs shellcheck on the `run:` scripts. Run from its Docker image, nothing installed:

```sh
MSYS_NO_PATHCONV=1 docker run --rm -v "$(cygpath -m "$PWD"):/repo" -w /repo rhysd/actionlint:latest -color=false
```

   No output, exit code 0: no problem found. (`MSYS_NO_PATHCONV=1` and `cygpath -m` are for Git Bash on Windows, which would otherwise rewrite `/repo` into a Windows path; on the Mac, `-v "$PWD:/repo"`.)

3. **The backend job tried from nothing** (H5.7.2), and `npm ci` the same way: `added 537 packages, and audited 544 packages in 10s`.

4. **The Composer audit's commands**, on the repository:

```sh
docker run --rm -v "$PWD/backend:/app:ro" -w /app composer:2 composer audit --locked
```

```
No security vulnerability advisories found.
```

5. `make toc`, `make check`.

**Not tried here:** the first run on GitHub itself, which happens at the first `make push` of the branch. What to look at then is H5.3's "How to check".

### H5.7.2 Trying the backend job in a clean clone

The job starts from a repository with no `backend/.env`, no packages, no database. Its steps cannot be tried in the working copy: `cp backend/.env.example backend/.env` and `key:generate` would overwrite the real `backend/.env`. So in a throw-away clone, with a Compose project of its own (`COMPOSE_PROJECT_NAME`: its own containers and volumes) and other ports, the development stack left running:

```sh
git clone -q . /tmp/ci-clone && cd /tmp/ci-clone
cp backend/.env.example backend/.env
export COMPOSE_PROJECT_NAME=atleoplan-ci DB_FORWARD_PORT=5999 MAIL_UI_PORT=8599 APP_PORT=8599
docker compose up -d --wait postgres
docker compose run --rm backend composer install --no-interaction --no-progress
docker compose run --rm backend php artisan key:generate
docker compose run --rm backend vendor/bin/pint --test
docker compose run --rm backend php artisan test
docker compose down -v          # its containers and volumes only: the project name says which
```

```
 Container atleoplan-ci-postgres-1 Healthy
vendor/ copied in 81 s.
   INFO  Application key set successfully.
    PASS   ......................................................... 214 files
  Tests:    359 passed (17807 assertions)
  Duration: 63.41s
 Volume atleoplan-ci_vendor Removed
 Volume atleoplan-ci_composer-cache Removed
```

The image was not rebuilt (`docker compose build`): the one of development is the same `Dockerfile`. `vendor/ copied in 81 s` is the copy for the editor ([H2.18](H2-backend.md#h218-a-fast-local-backend-the-packages-in-a-volume-as-built)), slow through Windows' shared folder; on GitHub's Linux it takes a moment. The ports (`DB_FORWARD_PORT`, `MAIL_UI_PORT`) are the variables `compose.yaml` already reads; without them the clone's Postgres would ask for 5932, taken by the development one.

### H5.7.3 The errors met

| Message | Cause | Fix |
|---|---|---|
| `[DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities` | On Windows `npm` is `npm.cmd`, which only a shell starts; Node now warns when arguments are passed apart to a shell, since it joins them without escaping | On Windows the whole command as one string, `spawnSync('npm audit --json', { shell: true })`; elsewhere `spawnSync('npm', ['audit', '--json'])` with no shell |
| `spatie/laravel-medialibrary 11.23.12 ~ 8.10.2` in `composer outdated`'s list: a newer version older than the one installed | The `composer:2` image has none of the project's PHP extensions (gd, exif), so Composer offered the newest version that would install there | `--ignore-platform-reqs` for that list only: `11.23.12 ! 11.23.13`. Not for the audit, which reads advisories, not requirements |

---

← [H4. Opening the database](H4-database-tools.md) · [Contents](../README.md) · [P1. Conventions](../project/P1-conventions.md) →
