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
        artisan composer migrate fresh tinker routes clear psql test-db db-dump db-restore \
        dev fe-install fe-build \
        test pint pint-check lint lint-fix typecheck fe-test fix check audit \
        branch sync push merge

# docker compose, and the two ways into the backend container
DC      := docker compose
ARTISAN := $(DC) exec backend php artisan
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
#   crashes and keeps restarting until the packages arrive.
# - The key is generated only when empty, because replacing it would invalidate
#   existing sessions. grep -q tests the file and prints nothing: it holds secrets.
setup: ## New clone: Git hook, backend/.env and its key, image, Composer and npm packages, containers, test database, migrations
	git config core.hooksPath .githooks
	test -f backend/.env || cp backend/.env.example backend/.env
	$(DC) build
	$(DC) run --rm backend composer install
	grep -q '^APP_KEY=.' backend/.env || $(DC) run --rm backend php artisan key:generate
	$(DC) up -d --wait
	$(NPM) install
	$(MAKE) --no-print-directory test-db
	$(ARTISAN) migrate
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

down-v: ## Stop everything and DELETE the database
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

# --- Frontend -----------------------------------------------------------------

dev: ## Start the React dev server (http://localhost:5673)
	$(NPM) run dev

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

check: pint-check test lint typecheck fe-test ## Everything before a merge (needs the stack up)

# The leading "-" lets the second audit run when the first finds something.
audit: ## Known vulnerabilities in the Composer and npm packages (report only, changes nothing)
	-$(DC) exec backend composer audit
	-$(NPM) audit

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
