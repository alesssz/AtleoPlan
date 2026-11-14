<?php

/**
 * Tests must never run on the development database. compose.yaml gives the
 * containers its settings, and phpunit.xml overrides them with force="true"; if
 * that override is ever lost, this fails before another test's RefreshDatabase
 * empties the development data.
 */

use Illuminate\Support\Facades\DB;

it('runs on the Postgres test database', function () {
    $connection = DB::connection();

    expect($connection->getDriverName())->toBe('pgsql')
        ->and($connection->getDatabaseName())->toBe('atleoplan_test');
});
