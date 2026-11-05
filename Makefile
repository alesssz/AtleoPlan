# =============================================================================
# AtleoPlan — project commands
# Usage: make <command>     (make help for the full list)
# Backend commands run in the Docker containers (compose.yaml); frontend
# commands run with the Mac's Node in frontend/. Ports: docs/00-setup.md 0.4.
# Commands that take a value get it as a variable, because Make reads anything
# after the target as more targets: make artisan c="route:list".
# =============================================================================

SHELL := bash
.DEFAULT_GOAL := help
.PHONY: help setup up down down-v build restart ps logs shell \
        artisan composer migrate fresh tinker routes psql \
        dev fe-install fe-build \
        test pint pint-check lint typecheck check \
        push merge

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

# --- First run ----------------------------------------------------------------

setup: ## New clone: Git hook, image, containers, Composer and npm packages, migrations
	git config core.hooksPath .githooks
	$(DC) build
	$(DC) up -d --wait
	$(DC) exec backend composer install
	$(NPM) install
	$(ARTISAN) migrate
	@echo ""
	@echo "✔ Ready. Laravel: http://localhost:8500 · React: make dev (http://localhost:5673)"
	@echo "  Set the Git identity once if not done: docs/00-setup.md 0.3"

# --- Docker stack ---------------------------------------------------------------

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

psql: ## SQL console on the development database
	$(DC) exec postgres psql -U atleoplan

# --- Frontend -----------------------------------------------------------------

dev: ## Start the React dev server (http://localhost:5673)
	$(NPM) run dev

fe-install: ## Install the frontend's npm packages
	$(NPM) install

fe-build: ## Production build of the React app
	$(NPM) run build

# --- Quality and tests --------------------------------------------------------

test: ## Backend tests (Pest, on the atleoplan_test database)
	$(ARTISAN) test

pint: ## Format the PHP code
	$(DC) exec backend vendor/bin/pint

pint-check: ## Check the PHP format without changing files
	$(DC) exec backend vendor/bin/pint --test

lint: ## ESLint on the frontend
	$(NPM) run lint

typecheck: ## TypeScript check of the frontend
	$(NPM) run typecheck

check: pint-check test lint typecheck ## Everything before a merge (needs the stack up)

# --- Git ----------------------------------------------------------------------

push: ## Push the current branch to GitHub (sets the upstream the first time)
	git push -u origin $(BRANCH)

# Make treats anything starting with "--" as one of its own options, so the
# script's flags are variables instead (yes=1 → --yes, checks=0 → --no-checks).
merge: ## make check, merge the current branch into main, push, delete it (asks first; yes=1 skips the question, checks=0 the checks)
	node scripts/merge-main.mjs $(if $(yes),--yes) $(if $(filter 0,$(checks)),--no-checks)
