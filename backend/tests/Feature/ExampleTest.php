<?php

namespace Tests\Feature;

// The namespace above maps to the tests/Feature folder (composer.json, autoload-dev).

// Imports. The commented-out one is Laravel's hint for tests that touch the
// database: RefreshDatabase resets it around each test.
// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Laravel's example Feature test, kept as a smoke test: the home page loads.
 *
 * A Feature test sends a request through the whole app (routes, middleware,
 * response) without a real web server (docs/05-backend.md 5.11). It is
 * written PHPUnit's way, a class whose `test_...` methods are the tests;
 * Pest runs it like its own `it()` tests.
 */
class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     *
     * GET / (routes/web.php) answers 200 OK with the welcome page.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        // The response to a fake GET / request
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
