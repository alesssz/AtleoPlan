<?php

/**
 * GET /api/health: public, answers { "status": "ok" } in JSON. The React
 * app's Profile page reads it to show whether the server is reachable
 * (frontend/src/api/health.ts). The route is in routes/api.php.
 *
 * A Pest test file has no class: each `it('...', function () { ... })` is
 * one test, and its description reads as a sentence ("it answers ok...").
 * In tests/Feature, `$this` inside the function is a Tests\TestCase
 * (tests/Pest.php), with Laravel's HTTP helpers (docs/05-backend.md 5.11).
 */
it('answers ok without signing in', function () {
    // getJson() sends a fake GET request asking for JSON, through the whole
    // app, no web server involved, and returns the response to check. No user
    // is signed in. assertOk() checks the 200 status; assertExactJson() checks
    // the body is exactly this, with no other keys.
    $this->getJson('/api/health')
        ->assertOk()
        ->assertExactJson(['status' => 'ok']);
});
