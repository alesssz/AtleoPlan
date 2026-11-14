<?php

/**
 * GET /api/health, which Profile reads to show whether the server is
 * reachable (frontend/src/api/health.ts).
 */
it('answers ok without signing in', function () {
    $this->getJson('/api/health')
        ->assertOk()
        ->assertExactJson(['status' => 'ok']);
});
