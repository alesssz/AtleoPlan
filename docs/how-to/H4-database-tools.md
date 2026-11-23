# H4. Opening the database

Connecting to the development Postgres from a database client or the terminal, and what to do when the connection is refused. Queries through the models, and the tables' structure: [H1.6](H1-database.md#h16-looking-at-the-data) and [D3. Data model](../design/D3-data-model.md).

## Contents

- [H4.1 The connection details](#h41-the-connection-details)
- [H4.2 A desktop client](#h42-a-desktop-client)
- [H4.3 Without leaving the terminal](#h43-without-leaving-the-terminal)
- [H4.5 When it does not connect](#h45-when-it-does-not-connect)

---

## H4.1 The connection details

Postgres runs in Docker ([S1.5](../start/S1-setup.md#s15-first-start-the-docker-stack)), so it is reachable only while the stack is up (`make up`, `make ps`).

| Field | Value | Notes |
|---|---|---|
| Host | `127.0.0.1` | Bound to the host only, not the network |
| Port | `5932` | Standard + 500 ([S1.4](../start/S1-setup.md#s14-ports)); `DB_FORWARD_PORT` changes it |
| User / password | `atleoplan` / `atleoplan` | Development only, set in `compose.yaml` |
| Database | `atleoplan` | The one the app at http://localhost:5673 uses |
| SSL mode | `disable` or `prefer` | The local Postgres has no SSL |

```
postgresql://atleoplan:atleoplan@127.0.0.1:5932/atleoplan
```

The same server holds **`atleoplan_test`**, which every test run empties and rebuilds: worth opening only while debugging a test. `make fresh`, `make reset` and `make down-v` empty the development database.

---

## H4.2 A desktop client

The project uses TablePlus; any Postgres client works with the values of H4.1. No web UI runs in `compose.yaml`, and Filament shows only the tables that have an admin screen ([H2.6](H2-backend.md#h26-an-admin-screen)).

- **Type the values, do not paste them.** Text pasted from a page or a terminal can carry an invisible newline or tab, which becomes part of the field while the field shows only its first line; the same happens with a client's "import from URL". The symptom is in H4.5.
- **A second connection** for `atleoplan_test`, tagged differently, so the two are never confused.
- **Change data through the app or tinker, not the client.** A change made in the client skips Laravel: no validation, no events, no file deletions ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid)), and a password typed in a cell is stored unhashed. `make db-dump` before a risky change, `make db-restore f=…` to go back.
- **Never change the structure or the `migrations` table** from a client: the structure changes only through migrations ([H1.3](H1-database.md#h13-migrations)), or other clones would miss it.
- **Making an account an admin** (`is_admin` to `true` on its row) is a safe edit, equivalent to the tinker line of [C2.8](../concepts/C2-backend.md#c28-admin-panel-filament).

---

## H4.3 Without leaving the terminal

| Command | Gives |
|---|---|
| `make psql` | psql on the development database |
| `make tinker` | The app's models: `User::count()`, `User::where('email', '…')->first()` |
| `make artisan c="db:show"` | Every table, with its size |
| `make artisan c="db:table users"` | One table: columns, types, indexes |

---

## H4.5 When it does not connect

| Message | Cause | Fix |
|---|---|---|
| `Connection refused` | The stack is down, or the port is 5432 instead of **5932** | `make up`; port `5932` |
| `password authentication failed for user "atleoplan"` | User or password mistyped | Both `atleoplan`, lowercase |
| `database "atleoplan` with the closing `"` on the next line, `does not exist` | The name was pasted with a newline or tab after it | Clear the field and type it; the same for user and password. Recreating the connection by typing every field is the surest fix |
| `database "atleoplan_test" does not exist` | A Postgres volume older than its init script | `make test-db` ([S1.6](../start/S1-setup.md#s16-the-backends-configuration)) |
| Connected, but no tables | The migrations have not run, or the database is `postgres` | `make migrate`; check the database field |

**What Postgres received.** Every refused connection is in Postgres's log with the exact names it was given; `cat -vet` makes hidden characters visible (`$` a newline, `^I` a tab):

```sh
docker compose logs postgres --since 10m --no-log-prefix | grep -A1 FATAL | cat -vet
```

---

← [H3. Frontend: how to](H3-frontend.md) · [Contents](../README.md) · [H5. Continuous integration](H5-ci.md) →
