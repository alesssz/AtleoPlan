# H5. Continuous integration

How GitHub checks every push by itself: what runs, when, in which files, how to read a run that failed, and how the same checks run on the computer. Why it is built this way: [D2.11](../design/D2-decisions.md#d211-continuous-integration).

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
| **CodeQL**, no file: GitHub's *default setup*, turned on in the settings | every push to `main`, and weekly | reads the TypeScript and JavaScript code, and the workflows themselves, for security mistakes (text not escaped, data from outside reaching a command…) | never fails a push: it opens **alerts** in **Security → Code scanning** |

**Where it sits in the way of working** ([P1.1](../project/P1-conventions.md#p11-git)): a branch is pushed with `make push`; GitHub runs CI on it, and the audit if the dependencies changed. `make merge` runs `make check`, opens the branch's pull request and turns on auto-merge; `main`'s ruleset lets GitHub merge it only once both CI jobs passed, and the merge runs CI again on `main`. CI is the look that counts: a clean Linux machine where nothing of the computer (a file not committed, a package installed by hand) can hide a problem.

The same layout in AtleoPlan, Chronovault and Flowboard ([D2.11](../design/D2-decisions.md#d211-continuous-integration)): `ci.yml`, `audit.yml`, `dependabot.yml`, a shared `.github/actions/setup`, actions pinned to a commit hash, a read-only token, `persist-credentials: false`, runs on any branch, merges through a pull request.

---

## H5.2 The files

### H5.2.1 ci.yml

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

- **`push` on any branch, no `pull_request`:** checks belong to a commit, so the branch's run is also its pull request's; a `pull_request` trigger would run the same checks twice. A pull request opened by someone else runs nothing until the owner approves it.
- **`concurrency`:** runs of the same branch (`github.ref`) form a group; a new push cancels the one still going, since only the latest commit matters. Not on `main`: each merge keeps its run.

**The frontend job:**

```yaml
defaults:
  run:
    working-directory: frontend
steps:
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
    with:
      persist-credentials: false       # no Git credential left on the runner
  - uses: ./.github/actions/setup      # Node of .nvmrc, npm ci in frontend/
  - run: node scripts/docs-toc.mjs --check
    working-directory: .
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
- **`docker compose build backend`**: the image of development (`Dockerfile`, target `dev`), the same PHP and extensions as on the computers. Built from nothing on every run: a few minutes.
- **`up -d --wait postgres`**: Postgres alone, `--wait` until its health check passes. On its first start it runs `docker/postgres/init/01-test-database.sql`, which creates `atleoplan_test`.
- **`run --rm`**, as `make setup` does with the stack stopped; `depends_on` starts Postgres and Mailpit first.
- **`if: failure()`** prints the containers' logs, Postgres's above all, only when a step failed.

`timeout-minutes` on each job stops a stuck run after 15 or 25 minutes, instead of GitHub's six hours.

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

- **The weekly run** finds a new advisory on a package that did not change: the code is the same, the advisory database is not. A failed scheduled run is emailed to the owner.
- **`paths`:** on a push, only when one of these files changed: a branch that adds a vulnerable version fails beside its CI, before the merge.
- **`pull_request`** only for a fork's (the job's `if`): this repository's branches are audited on push.

**The npm job:** Node, `npm ci`, `npm outdated` into the run's summary, then `node scripts/npm-audit.mjs` (H5.4).

**The Composer job** needs no PHP of the project's:

```sh
docker run --rm -v "$PWD/backend:/app:ro" -w /app composer:2 composer audit --locked
```

- **`composer:2`**, Composer's official image from Docker Hub. **`--locked`** reads `composer.lock` alone, installing nothing, which is all an audit needs; building the backend's image would take minutes for the same answer.
- **`:ro`**: `backend/` mounted read-only; neither command writes there.
- **`composer outdated --direct --locked --ignore-platform-reqs`** for the summary: the packages the project asks for, with their newer versions. `--ignore-platform-reqs` because that image lacks the project's PHP extensions (H5.7.3).

**`GITHUB_STEP_SUMMARY`** is a file whose Markdown GitHub shows on the run's page, under the jobs: `{ echo …; npm outdated || true; } >> "$GITHUB_STEP_SUMMARY"` writes the list there. `|| true`: `npm outdated` exits 1 when anything is outdated, which must not fail the run.

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

**The ruleset of `main`** (**Settings → Rules → Rulesets → main**): besides **Restrict deletions** and **Block force pushes**, **Require a pull request before merging** (no approvals needed: one person) and **Require status checks to pass** with the two jobs, **Frontend and docs** and **Backend**. In **Settings → General → Pull Requests**: **Allow merge commits** and **Allow auto-merge** on, so `make merge` can hand the merge to GitHub.

**Settings → Advanced Security** (on some accounts **Code security**), besides the protections of [P1.5.2](../project/P1-conventions.md#p152-the-account-and-the-repository-on-github):

| Setting | Choice | Why |
|---|---|---|
| **CodeQL analysis** | **Set up → Default**, with the languages it finds (here `actions` and `javascript-typescript`), suite **Default** | GitHub's own code analysis, free on a public repository, run by GitHub with its own action (`github/codeql-action`), so the rule "GitHub's actions only" still holds. It reads TypeScript and the workflows; not PHP, which CodeQL does not know, and where the tests and the policies stand guard |

Two more options of secret scanning, **non-provider patterns** (generic secrets: private keys, connection strings) and **validity checks** (whether a secret found still works), were asked for through the API and stayed off without an error: on a repository of a personal account GitHub does not offer them. If the page shows them one day, they cost nothing.

**How to check:** push a branch (`make push`): **Actions** shows **CI** running on it, two jobs; with a change to a lockfile, **Audit** too. **Actions → Audit → Run workflow** runs the audit by hand. And every setting of this section and of P1.5.2 at once, from the terminal: `make github-check`, below.

### H5.3.1 Checking everything from the terminal: make github-check

GitHub's command line, **`gh`**, reads the same settings as the pages, through GitHub's API. `scripts/github-check.mjs` asks for each one and compares it with the value decided, as `make doctor` does for the computer: ✔, ⚠ worth a look, ✖ with where to change it. It only reads.

**Once per computer:**

1. Install it: on Windows the installer from [cli.github.com](https://cli.github.com), or `winget install GitHub.cli`; on the Mac `brew install gh`. **Reopen the terminal**: one opened before does not see the new program (on Windows the script also looks in `C:\Program Files\GitHub CLI\` by itself).
2. Sign in, in your own terminal (it asks questions and opens the browser):

```sh
gh auth login
```

   **GitHub.com** → **HTTPS** → **Yes** to use it as Git's credential (or No, to keep pushing as before) → **Login with a web browser**: a code to type into the page that opens. `gh auth status` then says:

```
github.com
  ✓ Logged in to github.com account alesssz (keyring)
  - Git operations protocol: https
  - Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

   The token is kept in the computer's keychain (Windows' Credential Manager, the Mac's Keychain), never in a file of the project.

**Then, whenever:**

```sh
make github-check
```

```
gh
  ✔ signed in, repository alesssz/AtleoPlan
Actions
  ✔ Actions on, only selected actions allowed
  ✔ only actions created by GitHub
  ✔ workflow token read-only, cannot approve pull requests
  ✔ approval required for all external contributors
Code security
  ✔ repository public
  ✔ secret scanning on
  ✔ push protection on
  ✔ Dependabot security updates on
  ✔ private vulnerability reporting on
  ✔ CodeQL default setup on
Ruleset
  ✔ main: deletion and force pushes blocked
Alerts
  ✔ no open Dependabot alert
  ✔ no open secret scanning alert
  ⚠ 1 open CodeQL alert(s)
      → Security → Code scanning (docs/how-to/H5-ci.md H5.5)
Last runs on main
  ✔ ci.yml: success (2026-11-13)
  ✔ audit.yml: success (2026-11-13)

✔ All as decided.
```

(The CodeQL alert of that day is the one of H5.7.4, fixed by the same branch.) An open Dependabot or CodeQL alert is a warning, to read; an open **secret** alert is a failure: a secret is in the repository, and is revoked first (P1.5.3).

**How the script asks:** `gh api <path>` calls `https://api.github.com/<path>` with the signed-in account's token and prints the JSON answer. One example per kind of setting, to try by hand:

```sh
gh api repos/alesssz/AtleoPlan/actions/permissions/selected-actions   # {"github_owned_allowed":true,"patterns_allowed":[],"verified_allowed":false}
gh api repos/alesssz/AtleoPlan/actions/permissions/workflow            # {"default_workflow_permissions":"read","can_approve_pull_request_reviews":false}
gh api repos/alesssz/AtleoPlan/code-scanning/default-setup --jq .state # configured
gh run list --limit 5                                                  # the last runs, every workflow
```

`--jq` picks a field from the answer, in the language of the `jq` tool. Some answers need the repository's owner: another account gets `Not Found`, which the script reports as a failure.

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

**A CodeQL alert** is not a failed run: it appears in **Security → Code scanning**, and `make github-check` counts it. Each one names a rule (`js/incomplete-sanitization`), a file and a line, with an explanation and an example of the fix. The way through is the same as for a test: a `fix/…` branch, the code corrected, and the alert closes by itself at the next analysis of `main`. One that is a false alarm is closed with **Dismiss alert** and the reason ("False positive", "Used in tests"), as the advisories of H5.4 are.

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

← [H4. Opening the database](H4-database-tools.md) · [Contents](../README.md) · [P1. Conventions](../project/P1-conventions.md) →
