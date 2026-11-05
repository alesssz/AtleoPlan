-- AtleoPlan — creates the database the automated tests run on.
--
-- Postgres runs the files in /docker-entrypoint-initdb.d once, when its data
-- volume is created empty (first start, or after `docker compose down -v`).
-- The development database `atleoplan` is created by POSTGRES_DB in
-- compose.yaml; this adds a second one, `atleoplan_test`, owned by the same
-- user, so tests never touch development data (backend/phpunit.xml).
CREATE DATABASE atleoplan_test OWNER atleoplan;
