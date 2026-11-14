# AtleoPlan — backend

The Laravel application behind AtleoPlan. It serves:
- the JSON API the React app uses (`/api/…`);
- the sign-in cookies (Sanctum);
- the admin panel (Filament, `/admin`);
- the background jobs (the `queue` container).

It runs only in Docker: PHP and Composer on your computer are neither needed nor used.

**Architecture:** [docs/concepts/C2-backend.md](../docs/concepts/C2-backend.md): the pieces of the stack, the folders, the life of a request, routes and controllers, the database, sign-in, the admin panel, queues, configuration and tests.

**Recipes:**
- endpoints, permissions, tests, admin screens, jobs, settings, packages: [docs/how-to/H2-backend.md](../docs/how-to/H2-backend.md);
- the database (migrations, models, factories, seeders): [docs/how-to/H1-database.md](../docs/how-to/H1-database.md).

The tables and their relations: [docs/design/D3-data-model.md](../docs/design/D3-data-model.md).

Commands, from the repository root (`make help` lists them all):

```sh
make up                          # start backend, worker, Postgres, Mailpit; Laravel at http://localhost:8500
make artisan c="route:list"      # any Artisan command, run in the container
make composer c="require x/y"    # any Composer command
make migrate                     # run new migrations; make fresh rebuilds the database with seed data
make tinker                      # PHP console with the app loaded
make test                        # Pest tests, on the atleoplan_test database
make pint                        # format the PHP code
make logs                        # follow the backend's logs (make logs s=queue for the worker)
```

Setup, ports and troubleshooting: [docs/start/S1-setup.md](../docs/start/S1-setup.md).
