# H4. Opening the database

How to look inside the Postgres database with a program: browse tables, read rows, run SQL. It covers the tool used on this project, **TablePlus**, the quicker ways from the terminal, and the alternatives.

**How to read this page:**

- First time: [H4.1](#h41-the-connection-details), then [H4.2](#h42-tableplus-the-tool-we-use).
- It does not connect: [H4.5](#h45-when-it-does-not-connect).
- How to write the queries themselves, and the tables' structure: [H1.7](H1-database.md#h17-looking-at-the-data) and [D3. Data model](../design/D3-data-model.md).

---

## H4.1 The connection details

Postgres runs in Docker ([S1.5](../start/S1-setup.md#s15-first-start-the-docker-stack)), so it is reachable only while the stack is up: `make up`, checked with `make ps`.

| Field | Value | Why |
|---|---|---|
| Type | PostgreSQL | |
| Host | `127.0.0.1` (or `localhost`) | Postgres listens only on your computer, not on the network |
| Port | `5932` | Postgres's standard port, 5432, plus 500 ([S1.4](../start/S1-setup.md#s14-ports)) |
| User | `atleoplan` | |
| Password | `atleoplan` | Development only, set in `compose.yaml`; a server will have its own |
| Database | `atleoplan` | The development database, the one the app at http://localhost:5673 uses |

**As a single URL,** for tools that accept one. When pasting it, make sure no new line comes with it ([H4.2.1](#h421-creating-the-connection-once)):

```
postgresql://atleoplan:atleoplan@127.0.0.1:5932/atleoplan
```

**The two databases.** The same server holds both, with the same user:

| Database | Holds | Notes |
|---|---|---|
| `atleoplan` | The development data: your account, what you create while trying the app | Survives restarts; only `make fresh` or `make down-v` empty it |
| `atleoplan_test` | What the tests create | Emptied by every test run, so it is usually empty; useful only while debugging a test |

---

## H4.2 TablePlus, the tool we use

TablePlus is a desktop program for Mac and Windows, at https://tableplus.com. The free version has limits, such as two tabs open at a time, which are enough here.

### H4.2.1 Creating the connection, once

1. Open TablePlus. In the welcome window, click **Create a new connection…** at the bottom.
2. Choose **PostgreSQL**, then **Create**.
3. Fill in the form with [H4.1](#h41-the-connection-details):
   - **Name:** `AtleoPlan (dev)`;
   - **Tag:** `local`, the green colour. The tag colours the window's top bar, so you always know which database you are on;
   - **Host:** `127.0.0.1`, **Port:** `5932`;
   - **User:** `atleoplan`, **Password:** `atleoplan`;
   - **Database:** `atleoplan`;
   - **SSL mode:** leave the default (`PREFERRED`). The local Postgres has no SSL, and TablePlus connects without it.

   **Type the fields by hand; do not paste them.** Text copied from a page or a terminal often carries an invisible new line or tab at the end. It then becomes part of the field, which shows only its first line, so the field looks right. The same happens with **Import from URL**. This happened on this project, and the result was `database "atleoplan" does not exist` with the closing quote on the next line ([H4.5](#h45-when-it-does-not-connect)).
4. Click **Test**. The fields turn green if everything is right.
5. Click **Save**. The connection stays in the welcome window: double-click it to open it.

**The test database** gets a second connection: right-click the first one, **Duplicate**, then change only the name (`AtleoPlan (test)`) and the database (`atleoplan_test`).

### H4.2.2 Looking at the data

- **The tables** are in the left sidebar. A click opens one in a tab, with its rows.
- **The two views** of a table are at the bottom of the window: **Data** shows the rows, **Structure** shows the columns, their types, the indexes and the foreign keys.
- **Filtering:** the bar above the rows works without SQL. Choose a column, an operator (`=`, `contains`, `is null`…) and a value. For example: `email` · `contains` · `example`.
- **Sorting:** click a column's name.
- **A whole row:** select it. The panel on the right (the *row detail*, toggled with the button at the top right) shows every column, long values included.
- **JSON columns** (`jsonb`, such as the translated names of [D3.4.5](../design/D3-data-model.md#d345-translations)) appear as text in the cell. The row detail shows them formatted.
- **After a change made elsewhere**, by the app or by `make migrate`, reload with `Cmd+R`. TablePlus does not refresh by itself.

### H4.2.3 Running SQL

**`Cmd+E`**, or the **SQL** button at the top, opens an editor:

```sql
-- Who has an account, and their preferences
SELECT id, name, email, is_admin, locale, theme FROM users ORDER BY id;

-- Which migrations have run (the table Laravel keeps)
SELECT migration, batch FROM migrations ORDER BY id;
```

- **`Cmd+Enter`** runs the query under the cursor, or the selected text. The results appear below.
- **Saved queries:** the editor's text stays with the connection until you delete it. Handy for the queries you reuse.
- **Queries on the tables to come** (sessions, sets, volumes per week) are in [D3](../design/D3-data-model.md) and [H1.7](H1-database.md#h17-looking-at-the-data).

### H4.2.4 Changing data, carefully

You can edit a cell with a double-click, add a row with the **Row** button at the bottom, and delete a row with `Delete`.

**Nothing is saved until `Cmd+S`.** TablePlus collects the changes, shown in colour, and sends them all together. Until then, the **Discard** button throws them away. This saves you from many mistakes, but not from all of them:

- **It is the real development data.** A deleted row does not come back. `make db-dump` saves a copy before risky changes, and `make db-restore f=…` puts it back.
- **Prefer changing data through the app, or with tinker.** A change made in TablePlus skips Laravel completely:
  - no validation;
  - no events;
  - no file deletions ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid));
  - a password typed in a cell would be stored as plain text, not hashed.
- **Never change the `migrations` table,** nor the structure of a table from the *Structure* view. The structure changes only through migrations ([H1.3](H1-database.md#h13-migrations)); a column added by hand would be missing on every other computer.
- **A good use:** making your own account an admin, with `is_admin` set to `true` on your row and `Cmd+S`. It is the same as the tinker line in [C2.8](../concepts/C2-backend.md#c28-admin-panel-filament).

### H4.2.5 Shortcuts worth knowing

| Keys | What it does |
|---|---|
| `Cmd+P` | Open any table by typing part of its name |
| `Cmd+E` | SQL editor |
| `Cmd+Enter` | Run the current query |
| `Cmd+R` | Reload the data |
| `Cmd+S` | Save the pending changes |
| `Cmd+K` | Switch to another database of the same server (`atleoplan_test`) |

On Windows, `Ctrl` takes the place of `Cmd`.

---

## H4.3 Without leaving the terminal

For a quick look, without opening a program ([H1.7](H1-database.md#h17-looking-at-the-data)):

| Command | What you get |
|---|---|
| `make psql` | The SQL console of Postgres: `\dt` lists the tables, `\d users` describes one, `\q` quits |
| `make tinker` | PHP with the app loaded: `User::count()`, `User::where('email', '…')->first()` |
| `make artisan c="db:show"` | Every table, with its size |
| `make artisan c="db:table users"` | One table: columns, types, indexes |

---

## H4.4 The alternatives

**phpMyAdmin is not one of them:** it works only with MySQL and MariaDB, and this project uses Postgres. Laravel itself has no screen for browsing the database. Filament shows only the tables that have an admin screen ([H2.4](H2-backend.md#h24-an-admin-screen)).

**Desktop programs**, installed on the computer, which connect with the details of [H4.1](#h41-the-connection-details):

| Tool | Price | Good for | Less good |
|---|---|---|---|
| **TablePlus** (our choice) | Free with limits; licence for more | Fast, clean, native on Mac; changes held until `Cmd+S` | The free version allows two tabs at a time |
| **DBeaver Community** | Free | Complete: ER diagrams of the tables, import and export, every database | Heavier (Java); busier interface |
| **DataGrip** | Paid (JetBrains) | The best SQL autocompletion | Paid; heavy |
| **VS Code extension** (e.g. Microsoft's "PostgreSQL") | Free | Without leaving the editor | Fewer comforts for browsing data |
| **Postico** | Free with limits | Simple, for Postgres only, Mac | Mac only |

**In the browser**, as a service in `compose.yaml` (not set up; it would need a task of its own):

| Tool | Good for | Less good |
|---|---|---|
| **Adminer** | phpMyAdmin's light successor: one small container, Postgres and MySQL; it would go on http://localhost:8580 | Plain look |
| **pgAdmin 4** | Postgres's official tool: complete, with query plans, users, backups | Heavy, slow to start, complex |
| **CloudBeaver** | DBeaver in the browser | Heavy (Java) |
| **phpPgAdmin** | | Abandoned for years: not to be used |

**Why a desktop program:** the database is needed only now and then, and a desktop program costs no container running all the time. A program in the browser makes sense when there is no way to install anything, for example on a shared server, and then only behind a password.

---

## H4.5 When it does not connect

| Message | Cause | Fix |
|---|---|---|
| `Connection refused` | The Docker stack is down | `make up`, then `make ps` |
| `Connection refused` with the stack up | The port is wrong: 5432 instead of **5932** | Port `5932` |
| `password authentication failed for user "atleoplan"` | User or password mistyped, with a space or a capital letter | Both `atleoplan`, lowercase |
| `database "atleoplan` with the closing `"` on the next line, `does not exist` | The name was pasted with an invisible new line (or a space) after it: Postgres looks for a database called "atleoplan + new line" | The field may show only its first line, so it looks right. Click in it, `Cmd+A`, `Backspace`, then type `atleoplan` by hand; the same for User and Password. Surest: delete the connection and create it again typing every field, without *Import from URL*. What Postgres received is in `docker compose logs postgres`, where `cat -vet` shows the hidden characters as `$` (new line) and `^I` (tab) |
| `database "atleoplan_test" does not exist` | A Postgres volume older than the script that creates it | `make test-db` ([S1.6](../start/S1-setup.md#s16-creating-the-laravel-backend)) |
| Connected, but no tables | The migrations have not run, or the database is `postgres` instead of `atleoplan` | `make migrate`; check the *Database* field |
| Any other refusal | | See what Postgres received (below) |
| A table shows old data | TablePlus does not refresh by itself | `Cmd+R` |
| Changes "lost" | They were never saved | `Cmd+S` before closing the tab |

**What Postgres received.** Every refused connection is written in Postgres's log, with the exact names it was given. `cat -vet` makes the hidden characters visible: `$` is a new line, `^I` a tab.

```sh
docker compose logs postgres --since 10m --no-log-prefix | grep -A1 FATAL | cat -vet
```

What the pasted name of [H4.2.1](#h421-creating-the-connection-once) looked like:

```
2026-11-06 09:25:48.296 UTC [46283] FATAL:  database "atleoplan$
^I" does not exist$
```

`atleoplan`, then a new line (`$`) and a tab (`^I`) inside the quotes: the field held more than it showed.

---

← [H3. Frontend: how to](H3-frontend.md) · [Contents](../README.md) · [P1. Conventions](../project/P1-conventions.md) →
