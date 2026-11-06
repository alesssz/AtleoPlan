<?php

/**
 * Guard for the test setup: tests must run on the `atleoplan_test` database,
 * never on the development one.
 *
 * compose.yaml gives the containers the development database's settings, and
 * phpunit.xml overrides them with force="true". If that override is ever lost,
 * this test fails before RefreshDatabase in another test empties the
 * development data (docs/start/S1-setup.md S1.6).
 *
 * A Pest test: `it()` declares it, `expect()` checks values
 * (docs/concepts/C2-backend.md C2.11).
 */

// DB is a facade: a static-looking call Laravel passes to its database manager
use Illuminate\Support\Facades\DB;

it('runs on the Postgres test database', function () {
    // The connection the tests actually use, as Laravel resolved it
    $connection = DB::connection();

    // Postgres driver, test database; and() starts a second expectation
    // in the same chain
    expect($connection->getDriverName())->toBe('pgsql')
        ->and($connection->getDatabaseName())->toBe('atleoplan_test');
});
