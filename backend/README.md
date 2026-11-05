# AtleoPlan — backend

The Laravel application behind AtleoPlan. It serves:
- the JSON API the React app uses (`/api/…`);
- the sign-in cookies (Sanctum);
- the admin panel (Filament, `/admin`);
- the background jobs (the `queue` container).

It runs only in Docker: PHP and Composer are not installed on the Mac.

**The guide is [docs/05-backend.md](../docs/05-backend.md),** written for someone new to PHP and Laravel. It covers:
- the pieces of the stack;
- PHP syntax as it appears here;
- the folders;
- the life of a request;
- routes and controllers, the database, sign-in, the admin panel, queues, configuration and tests;
- step-by-step recipes.

Every PHP file starts with a comment saying what it does and pointing to the right section.

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

Setup, ports and troubleshooting: [docs/00-setup.md](../docs/00-setup.md).
