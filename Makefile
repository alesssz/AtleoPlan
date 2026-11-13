# =============================================================================
# AtleoPlan — project commands
# Usage: make <command>     (make help for the full list)
# Backend commands run in the Docker containers (compose.yaml); frontend
# commands run with this computer's Node in frontend/. Ports: docs/start/S1-setup.md S1.4.
# On Windows, run make from Git Bash: the recipes need bash, grep and cp (S1.2).
# Commands that take a value get it as a variable, because Make reads anything
# after the target as more targets: make artisan c="route:list".
# =============================================================================

SHELL := bash
.DEFAULT_GOAL := help
.PHONY: help doctor setup urls start up down down-v build restart ps logs shell \
        artisan composer vendor migratefresh tinker routes clear psql test-db db-dump db-restore reference-data exercises-import exercises-extra exercises-correct exercises-thumbnails exercises-translate plans-demo \
        dev fe-install fe-build \
        test pint pint-check lint lint-fix typecheck fe-test fix check audit toc toc-check \
        branch sync push merge

# docker compose, and the two ways into the backend container
DC      := docker compose
ARTISAN := $(DC) exec backend php artisan
# The same, with the photos' conversions made at once instead of queued
# (QUEUE_CONVERSIONS_BY_DEFAULT, config of spatie/laravel-medialibrary):
# for commands that add or convert many photos, which `queue:listen`, starting
# Laravel again for each job, would take long to work through
# (docs/concepts/C2-backend.md C2.5.9).
ARTISAN_NOW := $(DC) exec -e QUEUE_CONVERSIONS_BY_DEFAULT=false backend php artisan
# npm, always run inside frontend/
NPM     := npm --prefix frontend
# The branch checked out, for push
BRANCH  := $(shell git branch --show-current)

help: ## Show this list
	@echo "AtleoPlan - available commands:"
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

# --- First run and status -------------------------------------------------------

doctor: ## Check this computer and clone (Docker, disk, Node, npm cache, Git identity, ports…) and print the fixes
	node scripts/doctor.mjs

# The order matters on a new clone (docs/start/S1-setup.md S1.5):
# - backend/.env comes first: without it Laravel believes it is in production
#   and `migrate` stops to ask for confirmation.
# - Composer runs before the stack starts: without vendor/ the queue worker
#   crashes and keeps restarting until the packages arrive. They go into the
#   `vendor` Docker volume, and Composer then copies them to backend/vendor/
#   for the editor (docs/how-to/H2-backend.md H2.18); about 20 s on Windows.
# - The key is generated only when empty, because replacing it would invalidate
#   existing sessions. grep -q tests the file and prints nothing: it holds secrets.
# - The fixed lists (muscles, equipment) come right after the migrations: the
#   app and the exercise import both need them (reference-data below).
setup: ## New clone, or after a pull: Git hook, backend/.env and its key, image, packages, containers, test database, migrations, muscles and equipment
	git config core.hooksPath .githooks
	test -f backend/.env || cp backend/.env.example backend/.env
	$(DC) build
	$(DC) run --rm backend composer install
	grep -q '^APP_KEY=.' backend/.env || $(DC) run --rm backend php artisan key:generate
	$(DC) up -d --wait
	$(NPM) install
	$(MAKE) --no-print-directory test-db
	$(ARTISAN) migrate
	$(MAKE) --no-print-directory reference-data
	# public/storage → storage/app/public: the web server can then serve the
	# photos, at /storage/… (docs/how-to/H3-frontend.md H3.12)
	$(ARTISAN) storage:link
	@echo ""
	@echo "✔ Ready. Laravel: http://localhost:8500 · React: make dev (http://localhost:5673)"
	@echo "  Set the Git identity once if not done: docs/start/S1-setup.md S1.3 · then: make doctor"

urls: ## The local addresses
	@echo "Laravel          http://localhost:8500"
	@echo "Filament admin   http://localhost:8500/admin"
	@echo "React (make dev) http://localhost:5673"
	@echo "Mailpit          http://localhost:8525"
	@echo "Postgres         localhost:5932  (user, password, database: atleoplan)"

# --- Docker stack ---------------------------------------------------------------

start: up dev ## Start everything: the Docker stack, then the React dev server (Ctrl+C stops React only)

up: ## Start backend, worker, Postgres and Mailpit
	$(DC) up -d

down: ## Stop everything (data is kept)
	$(DC) down

down-v: ## Stop everything and DELETE the database (and the Composer packages: make setup after)
	$(DC) down -v

build: ## Rebuild the backend image (after changing Dockerfile or docker/php/dev.ini)
	$(DC) build
	$(DC) up -d

restart: ## Restart the queue worker (e.g. after changing a job)
	$(DC) restart queue

ps: ## What is running, and on which ports
	$(DC) ps

logs: ## Follow the logs: make logs (backend) or make logs s=queue
	$(DC) logs -f $(or $(s),backend)

shell: ## A bash shell in the backend container
	$(DC) exec backend bash

# --- Laravel ------------------------------------------------------------------

artisan: ## Any artisan command: make artisan c="route:list"
	@test -n "$(c)" || { echo 'Usage: make artisan c="<command>"'; exit 1; }
	$(ARTISAN) $(c)

composer: ## Any Composer command: make composer c="require vendor/package"
	@test -n "$(c)" || { echo 'Usage: make composer c="<command>"'; exit 1; }
	$(DC) exec backend composer $(c)

# The packages the app runs on live in the `vendor` Docker volume, not in the
# folder shared with the computer, so that requests are fast
# (docs/how-to/H2-backend.md H2.18). backend/vendor/ on the computer is a copy,
# for the editor: Composer refreshes it by itself after every install,
# require, update and remove, through the script docker/php/sync-vendor.sh.
# This target runs that script by hand, for when the copy is missing (a clone
# whose packages were installed before the volume existed) or was touched.
# rsync sends only what differs, so running it again is safe.
vendor: ## Copy the Composer packages to backend/vendor/ for the editor (Composer does it by itself)
	$(DC) exec backend sync-vendor

migrate: ## Run the new migrations
	$(ARTISAN) migrate

fresh: ## Empty the development database and rebuild it with test data
	$(ARTISAN) migrate:fresh --seed

tinker: ## Interactive PHP console of the app
	$(ARTISAN) tinker

routes: ## List the routes
	$(ARTISAN) route:list

clear: ## Clear Laravel's caches (config, routes, views, events): when a change seems ignored
	$(ARTISAN) optimize:clear

# --- Database -------------------------------------------------------------------

psql: ## SQL console on the development database
	$(DC) exec postgres psql -U atleoplan

test-db: ## Create the tests' database atleoplan_test if missing (a Postgres volume from before its init script)
	@$(DC) exec -T postgres psql -U atleoplan -tAc "select 1 from pg_database where datname = 'atleoplan_test'" | grep -q 1 \
		&& echo "✔ atleoplan_test already exists" \
		|| $(DC) exec -T postgres psql -U atleoplan -c "CREATE DATABASE atleoplan_test OWNER atleoplan;"

db-dump: ## Save the development database to backups/atleoplan-<date>.sql (before make fresh, say)
	@mkdir -p backups
	$(DC) exec -T postgres pg_dump -U atleoplan --clean --if-exists atleoplan > backups/atleoplan-$$(date +%Y%m%d-%H%M%S).sql
	@ls -t backups/*.sql | head -1

db-restore: ## Replace the development database with a dump: make db-restore f=backups/<file>.sql
	@test -f "$(f)" || { echo 'Usage: make db-restore f=backups/<file>.sql'; exit 1; }
	$(DC) exec -T postgres psql -U atleoplan -q -v ON_ERROR_STOP=1 atleoplan < $(f) > /dev/null
	@echo "✔ Restored $(f)"

# The public exercise library (DATA-1, docs/how-to/H1-database.md H1.12). The
# dataset is cloned once into backend/storage/app/, which Git ignores, and the
# container sees it there through the ./backend volume. --depth 1: only the
# latest version, without the repository's history. Options of the command go
# in o="…": make exercises-import o="--limit=5", o="--update".
FREE_EXERCISE_DB := backend/storage/app/free-exercise-db

# After the import, the translation: the Italian, Spanish and German texts
# kept in backend/database/data/exercise-translations (docs/how-to/H1-database.md
# H1.14). A language an exercise already has is kept, so running both again
# never undoes a correction made by hand.
# The muscles and the equipment, the fixed lists every exercise points to
# (docs/design/D3-data-model.md D3.4.1). Their seeders use updateOrCreate(),
# so running them again changes nothing: setup and exercises-import call this
# every time, and a database emptied without --seed is covered too.
reference-data: ## Muscles and equipment, the lists the library points to; safe to run again (setup and exercises-import do it)
	$(ARTISAN) db:seed --class=MuscleSeeder
	$(ARTISAN) db:seed --class=EquipmentSeeder

exercises-import: ## Fill the public exercise library from free-exercise-db (downloads it the first time) and the extra exercises, then translate it: make exercises-import o="--limit=5"
	@test -d $(FREE_EXERCISE_DB) || git clone --depth 1 https://github.com/yuhonas/free-exercise-db.git $(FREE_EXERCISE_DB)
	$(MAKE) --no-print-directory reference-data
	$(ARTISAN_NOW) exercises:import $(o)
	$(ARTISAN) exercises:correct-logging-types
	$(ARTISAN) exercises:import-extra
	$(ARTISAN) exercises:translate

# The project's own exercises, those free-exercise-db lacks (calisthenics),
# kept in backend/database/data/extra-exercises.json with their translations
# (docs/how-to/H1-database.md H1.17). exercises-import does this too; alone,
# it adds the extras to a library imported before they existed, in seconds.
exercises-extra: ## Add the extra exercises (calisthenics) to the library, then translate them; safe to run again
	$(MAKE) --no-print-directory reference-data
	$(ARTISAN) exercises:import-extra
	$(ARTISAN) exercises:translate

# The logging types the import guesses wrong (Plank, held for a time, guessed
# as reps), corrected from backend/database/data/logging-type-corrections.json
# (DATA-3, docs/how-to/H1-database.md H1.19). exercises-import does this too;
# alone, it puts right a library imported before the list existed. Only
# exercises still on the guess and not yet in a plan or a workout change.
exercises-correct: ## Correct the logging types the import guessed wrong (Plank as time); safe to run again
	$(ARTISAN) exercises:correct-logging-types

# The small (400 px) and large (1600 px) WebP copies of every photo
# (feat/exercise-media, docs/how-to/H2-backend.md H2.17). New photos get them
# by themselves; this makes them for photos added before they existed, such
# as a library imported earlier. --only-missing: those already made are kept,
# so running it again only does what is left.
exercises-thumbnails: ## Make the missing small and large copies of the exercises' photos (a library imported before them)
	$(ARTISAN_NOW) media-library:regenerate --only-missing

exercises-translate: ## Translate the imported exercises into it, es, de; options in o="…": make exercises-translate o="--locale=it --force"
	$(ARTISAN) exercises:translate $(o)

# Two example plans for every user who has none (FEAT-2,
# docs/how-to/H3-frontend.md H3.13.1), to look at the plan screens and the
# editor without building a plan by hand. Development only; needs the
# library imported first.
plans-demo: ## Give every user with no plans two example plans (after exercises-import)
	$(ARTISAN) db:seed --class=DemoPlanSeeder

# --- Frontend -----------------------------------------------------------------

dev: ## Start the React dev server (http://localhost:5673)
	$(NPM) run dev

# adb, Android's tool for talking to a phone over USB: the one on the PATH, or
# the copy unzipped into the home folder (docs/how-to/H3-frontend.md H3.8.2).
# $(shell …) runs a command when the Makefile is read; `a || b` runs b when a
# fails. Git Bash finds adb.exe from the name without .exe
ADB := $(shell command -v adb 2>/dev/null || echo "$(HOME)/platform-tools/adb")

phone: ## Android phone on USB: its own localhost:5673 opens this computer's dev app (H3.8.2)
	@"$(ADB)" devices -l
	@"$(ADB)" reverse tcp:5673 tcp:5673 >/dev/null && echo "✔ On the phone, in Chrome: http://localhost:5673 (until the cable is unplugged)"

fe-install: ## Install the frontend's npm packages
	$(NPM) install

fe-build: ## Production build of the React app
	$(NPM) run build

# --- Quality and tests --------------------------------------------------------

test: ## Backend tests (Pest, on atleoplan_test); only some: make test f=TestDatabase
	$(ARTISAN) test $(if $(f),--filter=$(f))

pint: ## Format the PHP code
	$(DC) exec backend vendor/bin/pint

pint-check: ## Check the PHP format without changing files
	$(DC) exec backend vendor/bin/pint --test

lint: ## ESLint on the frontend
	$(NPM) run lint

lint-fix: ## ESLint with automatic fixes
	$(NPM) run lint -- --fix

typecheck: ## TypeScript check of the frontend
	$(NPM) run typecheck

fe-test: ## Frontend tests (Vitest); while coding, npm --prefix frontend run test:watch reruns them on save
	$(NPM) test

fix: pint lint-fix ## Fix what can be fixed automatically: PHP format and ESLint

check: pint-check test lint typecheck fe-test toc-check ## Everything before a merge (needs the stack up)

# --- Docs ---------------------------------------------------------------------

# The "Contents" list at the top of each doc is generated from its headings
# (scripts/docs-toc.mjs, docs/project/P1-conventions.md P1.3).
toc: ## Rebuild the contents list at the top of every doc, after changing a heading
	node scripts/docs-toc.mjs

toc-check: ## Fail if a doc's contents list is out of date (part of make check)
	node scripts/docs-toc.mjs --check

# The leading "-" lets the second audit run when the first finds something.
# npm's goes through scripts/npm-audit.mjs, which leaves out the advisories
# reviewed in frontend/package.json (auditIgnore), as the Audit workflow
# does (.github/workflows/audit.yml, docs/how-to/H5-ci.md H5.4).
audit: ## Known vulnerabilities in the Composer and npm packages (report only, changes nothing)
	-$(DC) exec backend composer audit
	-node scripts/npm-audit.mjs

# --- Git ----------------------------------------------------------------------

branch: ## New branch from an up-to-date main: make branch name=feat/plan-editor
	@test -n "$(name)" || { echo 'Usage: make branch name=feat/<short-name>'; exit 1; }
	git switch main
	git pull --ff-only origin main
	git switch -c $(name)

sync: ## Go to main and bring it up to date with GitHub (and forget deleted branches)
	git switch main
	git pull --ff-only origin main
	git fetch --prune origin

push: ## Push the current branch to GitHub (sets the upstream the first time)
	git push -u origin $(BRANCH)

# Make treats anything starting with "--" as one of its own options, so the
# script's flags are variables instead (yes=1 → --yes, checks=0 → --no-checks).
merge: ## make check, merge the current branch into main, push, delete it (asks first; yes=1 skips the question, checks=0 the checks)
	node scripts/merge-main.mjs $(if $(yes),--yes) $(if $(filter 0,$(checks)),--no-checks)
