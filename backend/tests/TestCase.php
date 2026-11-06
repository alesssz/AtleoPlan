<?php

namespace Tests;

// The namespace above maps to the tests/ folder (composer.json, autoload-dev).

// Laravel's test base class, imported under another name (`as`) so this
// class can also be called TestCase
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

/**
 * The base of every Feature test (docs/concepts/C2-backend.md C2.11).
 *
 * tests/Pest.php makes each Pest test in tests/Feature run as an object of
 * this class, so `$this` inside the test is one. Laravel's base class boots a
 * fresh copy of the app before each test and adds the helpers that call it
 * without a real server: `$this->getJson('/api/health')`, `$this->actingAs($user)`,
 * `$this->assertDatabaseHas(...)`.
 *
 * Empty for now; helpers every Feature test needs go here. `abstract`: it is
 * only ever extended, never run itself.
 */
abstract class TestCase extends BaseTestCase
{
    //
}
