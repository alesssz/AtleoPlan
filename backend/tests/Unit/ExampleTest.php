<?php

namespace Tests\Unit;

// The namespace above maps to the tests/Unit folder (composer.json, autoload-dev).

// PHPUnit's own base class, not Laravel's: the app is not booted
use PHPUnit\Framework\TestCase;

/**
 * Laravel's example Unit test, kept as a check that the runner works.
 *
 * Unit tests check one piece of code on its own, without booting Laravel:
 * they are fast, but cannot use the database, facades or HTTP helpers
 * (docs/05-backend.md 5.11). Written PHPUnit's way, a class whose `test_...`
 * methods are the tests.
 */
class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     *
     * Always passes.
     */
    public function test_that_true_is_true(): void
    {
        $this->assertTrue(true);
    }
}
