<?php

/**
 * The limits on the signed-in API (AppServiceProvider::configureRateLimiting())
 * and the lists refused before validation (ChecksListLengthsFirst): what one
 * account can ask of the server.
 */

use App\Models\Exercise;
use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

describe('the limits', function () {
    it('counts every request of the signed-in API per user, and answers 429 past the limit', function () {
        $ann = User::factory()->create();
        $bea = User::factory()->create();

        $this->actingAs($ann)->getJson('/api/user')
            ->assertOk()
            ->assertHeader('X-RateLimit-Limit', AppServiceProvider::API_PER_MINUTE)
            ->assertHeader('X-RateLimit-Remaining', AppServiceProvider::API_PER_MINUTE - 1);
        for ($i = 1; $i < AppServiceProvider::API_PER_MINUTE; $i++) {
            $this->actingAs($ann)->getJson('/api/user');
        }

        $this->actingAs($ann)->getJson('/api/user')->assertTooManyRequests()->assertHeader('Retry-After');
        // Another account behind the same address is not held up
        $this->actingAs($bea)->getJson('/api/user')->assertOk();
        // A minute later it is over
        $this->travel(61)->seconds();
        $this->actingAs($ann)->getJson('/api/user')->assertOk();
    });

    it('gives photo files a limit of their own, wider, outside the API count', function () {
        $user = User::factory()->create();
        $exercise = Exercise::factory()->for($user, 'owner')->create();

        // No such photo: the limit is counted all the same
        $this->actingAs($user)->get("/api/exercises/{$exercise->id}/photos/999/thumb")
            ->assertNotFound()
            ->assertHeader('X-RateLimit-Limit', AppServiceProvider::PHOTO_FILES_PER_MINUTE);
        $this->actingAs($user)->getJson('/api/user')
            ->assertHeader('X-RateLimit-Remaining', AppServiceProvider::API_PER_MINUTE - 1);
    });

    it('limits photo uploads and duplicates together, per user', function () {
        $ann = User::factory()->create();
        $bea = User::factory()->create();
        $exercise = Exercise::factory()->for($ann, 'owner')->create();
        $public = Exercise::factory()->create();

        // Refused bodies count too: the limit comes before the rules
        for ($i = 0; $i < AppServiceProvider::UPLOADS_PER_MINUTE - 1; $i++) {
            $this->actingAs($ann)->postJson("/api/exercises/{$exercise->id}/photos")->assertUnprocessable();
        }
        $this->actingAs($ann)->postJson("/api/exercises/{$public->id}/duplicate")->assertCreated();

        $this->actingAs($ann)->postJson("/api/exercises/{$exercise->id}/photos")->assertTooManyRequests();
        $this->actingAs($ann)->postJson("/api/exercises/{$public->id}/duplicate")->assertTooManyRequests();
        $theirs = Exercise::factory()->for($bea, 'owner')->create();
        $this->actingAs($bea)->postJson("/api/exercises/{$theirs->id}/photos")->assertUnprocessable();
    });

    it('also limits uploads per day', function () {
        $limits = RateLimiter::limiter('uploads')(Request::create('/'));

        expect(collect($limits)->map(fn (Limit $limit) => [$limit->maxAttempts, $limit->decaySeconds])->all())
            ->toBe([[AppServiceProvider::UPLOADS_PER_MINUTE, 60], [AppServiceProvider::UPLOADS_PER_DAY, 86400]])
            // Two counts, not one shared
            ->and($limits[0]->key)->not->toBe($limits[1]->key);
    });

    it('limits plan imports per hour', function () {
        $user = User::factory()->create();

        for ($i = 0; $i < AppServiceProvider::IMPORTS_PER_HOUR; $i++) {
            $this->actingAs($user)->postJson('/api/plans/import', [])->assertUnprocessable();
        }

        $this->actingAs($user)->postJson('/api/plans/import', [])->assertTooManyRequests();
        $this->travel(61)->minutes();
        $this->actingAs($user)->postJson('/api/plans/import', [])->assertUnprocessable();
    });
});

describe('lists too long', function () {
    it('refuses a list before the rules of its elements run, with the max rule\'s message', function () {
        $user = User::factory()->create();
        $exercise = Exercise::factory()->for($user, 'owner')->create();

        // Elements that are not numbers: had the rules run, each would have its error
        $this->actingAs($user)->putJson("/api/exercises/{$exercise->id}/photos", ['ids' => array_fill(0, 100_000, 'x')])
            ->assertUnprocessable()
            ->assertExactJsonStructure(['message', 'errors' => ['ids']])
            ->assertJsonPath('errors.ids.0', 'The ids field must not have more than 5 items.');
    });

    it('counts the outer list first, then each list inside it', function () {
        $user = User::factory()->create();
        $day = fn (int $items) => ['name' => 'Day', 'items' => array_fill(0, $items, [])];

        // Too many days: their items are never counted
        $this->actingAs($user)->postJson('/api/plans', ['name' => 'Plan', 'days' => array_fill(0, 15, $day(1000))])
            ->assertUnprocessable()
            ->assertExactJsonStructure(['message', 'errors' => ['days']]);

        $this->actingAs($user)->postJson('/api/plans', ['name' => 'Plan', 'days' => [$day(1), $day(31)]])
            ->assertUnprocessable()
            ->assertExactJsonStructure(['message', 'errors' => ['days.1.items']])
            ->assertJsonPath('errors', ['days.1.items' => ['The days.1.items field must not have more than 30 items.']]);
    });

    it('leaves lists within their limits to the rules', function () {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/plans', ['name' => 'Plan', 'days' => [['name' => 'Day', 'items' => [[]]]]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['days.0.items.0.exercise_id']);
    });
});
