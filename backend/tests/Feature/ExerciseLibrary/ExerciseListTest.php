<?php

/**
 * GET /api/exercises, the library's list (docs/design/D1-ui.md D1.4.3,
 * docs/design/D3-data-model.md D3.4.6): who sees what, the language and the
 * order of the names, the four filters, the pages, and the number of queries.
 *
 * Exercises are created with only the languages a scenario needs, so that
 * each test shows which text the list reads.
 */

use App\Enums\MuscleRole;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * The names of the exercises in the list, in the order received.
 *
 * A helper for this file: a plain function, defined once and called by the
 * tests below. `$this` is the test case, passed in as $test.
 *
 * @param  mixed  $test  the running test ($this)
 * @param  User  $user  who asks
 * @param  string  $query  the query string, without the "?"
 * @param  string  $language  the Accept-Language header
 * @return list<string>
 */
function listedNames(mixed $test, User $user, string $query = '', string $language = 'en'): array
{
    return $test->actingAs($user)
        ->getJson("/api/exercises?{$query}", ['Accept-Language' => $language])
        ->assertOk()
        // json('data.*.name'): every item's name, as a PHP array
        ->json('data.*.name');
}

it('answers 401 to a visitor', function () {
    $this->getJson('/api/exercises')->assertUnauthorized();
});

it('lists the public exercises and my own, not someone else\'s or deleted ones', function () {
    $me = User::factory()->create();
    Exercise::factory()->create(['name' => ['en' => 'Public']]);
    Exercise::factory()->for($me, 'owner')->create(['name' => ['en' => 'Mine']]);
    Exercise::factory()->personal()->create(['name' => ['en' => 'Someone else\'s']]);
    Exercise::factory()->for($me, 'owner')->create(['name' => ['en' => 'Deleted']])->delete();

    expect(listedNames($this, $me))->toBe(['Mine', 'Public']);
});

it('marks my exercises with is_mine', function () {
    $me = User::factory()->create();
    Exercise::factory()->create(['name' => ['en' => 'Public']]);
    Exercise::factory()->for($me, 'owner')->create(['name' => ['en' => 'Mine']]);

    $this->actingAs($me)->getJson('/api/exercises')
        ->assertJsonPath('data.0.name', 'Mine')
        ->assertJsonPath('data.0.is_mine', true)
        ->assertJsonPath('data.1.is_mine', false);
});

it('reads and sorts the names in the request\'s language, falling back to English', function () {
    // "Squat" has no Italian name: it is read, and sorted, as English
    Exercise::factory()->create(['name' => ['en' => 'Bench press', 'it' => 'Panca piana']]);
    Exercise::factory()->create(['name' => ['en' => 'Squat']]);
    Exercise::factory()->create(['name' => ['en' => 'Deadlift', 'it' => 'Stacco']]);

    expect(listedNames($this, User::factory()->create(), language: 'it'))
        ->toBe(['Panca piana', 'Squat', 'Stacco']);
});

it('sorts names as a person would: capitals and accents together', function () {
    // With the database's own rules (bytes), the order would be
    // Bench, Curl, ab wheel, Ápice
    foreach (['Curl', 'ab wheel', 'Ápice', 'Bench'] as $name) {
        Exercise::factory()->create(['name' => ['en' => $name]]);
    }

    expect(listedNames($this, User::factory()->create()))->toBe(['ab wheel', 'Ápice', 'Bench', 'Curl']);
});

it('searches the name and the aliases in the user\'s language, ignoring case', function () {
    Exercise::factory()->create([
        'name' => ['en' => 'Barbell bench press', 'it' => 'Panca piana con bilanciere'],
        'aliases' => ['en' => ['flat bench'], 'it' => ['distensioni']],
    ]);
    Exercise::factory()->create(['name' => ['en' => 'Squat', 'it' => 'Squat']]);
    // what to search => what is found, in Italian
    $cases = [
        'PANCA' => ['Panca piana con bilanciere'],   // the name, whatever the case
        'distensioni' => ['Panca piana con bilanciere'],   // an alias
        'bench' => [],   // English text, but the exercise has Italian: not searched
        'squat' => ['Squat'],
    ];

    foreach ($cases as $term => $expected) {
        expect(listedNames($this, User::factory()->create(), "filter[search]={$term}", 'it'))->toBe($expected);
    }
});

it('searches the English name when the exercise has none in the user\'s language', function () {
    Exercise::factory()->create(['name' => ['en' => 'Barbell bench press']]);

    expect(listedNames($this, User::factory()->create(), 'filter[search]=bench', 'it'))
        ->toBe(['Barbell bench press']);
});

it('searches for a % or a comma as themselves', function () {
    Exercise::factory()->create(['name' => ['en' => 'Squat']]);
    Exercise::factory()->create(['name' => ['en' => 'Squat, paused']]);

    $user = User::factory()->create();

    // %25 is "%" in a URL: without escaping, it would match everything
    expect(listedNames($this, $user, 'filter[search]=%25'))->toBe([])
        // The comma is not a separator for the search, as it is for slugs
        ->and(listedNames($this, $user, 'filter[search]=squat, paused'))->toBe(['Squat, paused']);
});

it('filters by primary muscle, one or several', function () {
    $chest = Muscle::factory()->create(['slug' => 'chest']);
    $triceps = Muscle::factory()->create(['slug' => 'triceps']);
    $back = Muscle::factory()->create(['slug' => 'lats']);
    Exercise::factory()
        ->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles')
        ->hasAttached($triceps, ['role' => MuscleRole::Secondary], 'muscles')
        ->create(['name' => ['en' => 'Bench press']]);
    Exercise::factory()->hasAttached($triceps, ['role' => MuscleRole::Primary], 'muscles')
        ->create(['name' => ['en' => 'Dip']]);
    Exercise::factory()->hasAttached($back, ['role' => MuscleRole::Primary], 'muscles')
        ->create(['name' => ['en' => 'Pull-up']]);

    $user = User::factory()->create();

    // The bench press works the triceps too, but not as a primary muscle
    expect(listedNames($this, $user, 'filter[muscle]=triceps'))->toBe(['Dip'])
        ->and(listedNames($this, $user, 'filter[muscle]=chest,triceps'))->toBe(['Bench press', 'Dip']);
});

it('filters by equipment', function () {
    $barbell = Equipment::factory()->create(['slug' => 'barbell']);
    Exercise::factory()->for($barbell)->create(['name' => ['en' => 'Bench press']]);
    Exercise::factory()->create(['name' => ['en' => 'Push-up']]);

    expect(listedNames($this, User::factory()->create(), 'filter[equipment]=barbell'))->toBe(['Bench press']);
});

it('filters by source: mine or public', function () {
    $me = User::factory()->create();
    Exercise::factory()->create(['name' => ['en' => 'Public']]);
    Exercise::factory()->for($me, 'owner')->create(['name' => ['en' => 'Mine']]);

    expect(listedNames($this, $me, 'filter[source]=mine'))->toBe(['Mine'])
        ->and(listedNames($this, $me, 'filter[source]=public'))->toBe(['Public']);
});

it('refuses wrong values with a 422 and unknown filters with a 400', function () {
    $this->actingAs(User::factory()->create());

    $this->getJson('/api/exercises?filter[source]=everyone')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['filter.source']);
    $this->getJson('/api/exercises?per_page=500')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['per_page']);
    // Refused by spatie/laravel-query-builder, before any query
    $this->getJson('/api/exercises?filter[owner_id]=1')->assertStatus(400);
});

it('answers one page at a time, with links that keep the filters', function () {
    Exercise::factory()->count(5)->create();

    $this->actingAs(User::factory()->create())
        ->getJson('/api/exercises?per_page=2&page=2&filter[source]=public')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.current_page', 2)
        ->assertJsonPath('meta.last_page', 3)
        ->assertJsonPath('meta.total', 5)
        // The URL of the next page, with the filter still in it (%5B, %5D: [ ])
        ->assertJsonPath('links.next', fn (string $url) => str_contains($url, 'page=3')
            && str_contains($url, 'filter%5Bsource%5D=public'));
});

it('sends the equipment and the muscles, primary first', function () {
    $barbell = Equipment::factory()->create(['slug' => 'barbell', 'name' => ['en' => 'Barbell']]);
    $triceps = Muscle::factory()->create(['slug' => 'triceps', 'name' => ['en' => 'Triceps']]);
    $chest = Muscle::factory()->create(['slug' => 'chest', 'name' => ['en' => 'Chest']]);
    Exercise::factory()->for($barbell)
        ->hasAttached($triceps, ['role' => MuscleRole::Secondary], 'muscles')
        ->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles')
        ->create();

    $this->actingAs(User::factory()->create())->getJson('/api/exercises')
        ->assertJsonPath('data.0.equipment.slug', 'barbell')
        ->assertJsonPath('data.0.muscles.0', ['id' => $chest->id, 'slug' => 'chest', 'name' => 'Chest', 'role' => 'primary'])
        ->assertJsonPath('data.0.muscles.1.slug', 'triceps');
});

it('runs the same number of queries for one exercise or many', function () {
    // The number of queries of one call to the list
    $countQueries = function (): int {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson('/api/exercises')->assertOk();

        return count(DB::getQueryLog());
    };
    $this->actingAs(User::factory()->create());
    $barbell = Equipment::factory()->create();
    $chest = Muscle::factory()->create();
    // A factory "recipe", used twice below
    $exercise = Exercise::factory()->for($barbell)->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles');

    $exercise->create();
    $withOne = $countQueries();
    $exercise->count(9)->create();

    // Without with(), each exercise would add two queries (N+1)
    expect($countQueries())->toBe($withOne);
});
