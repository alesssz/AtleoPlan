<?php

/**
 * The rules of a public exercise saved from the admin panel: the action
 * SavePublicExercise called directly, without Filament, as
 * SavePersonalExerciseTest does for the API.
 *
 * Fixtures: the real muscles and equipment, from their seeders; the form's
 * state built by publicExerciseForm(), with every language filled and
 * reviewed unless a test changes it.
 */

use App\Actions\Exercises\SavePublicExercise;
use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use Database\Seeders\EquipmentSeeder;
use Database\Seeders\MuscleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([MuscleSeeder::class, EquipmentSeeder::class]);
});

/**
 * Lays $changes over $base: a key holding an array with named keys is
 * merged the same way, anything else (a text, a list) is replaced.
 *
 * Not array_replace_recursive(), PHP's own: it merges lists item by item,
 * so ['instructions' => []] would keep the base's steps, and a list of two
 * steps over one of three would keep the third.
 *
 * @param  array<string, mixed>  $base  the full state
 * @param  array<string, mixed>  $changes  what to change
 * @return array<string, mixed>
 */
function overForm(array $base, array $changes): array
{
    foreach ($changes as $key => $value) {
        $base[$key] = is_array($value) && ! array_is_list($value) && is_array($base[$key] ?? null)
            ? overForm($base[$key], $value)
            : $value;
    }

    return $base;
}

/**
 * The form's state of a plank, every language filled and reviewed.
 *
 * $changes is laid over it key by key (overForm()), so a test writes only
 * what it changes: ['translations' => ['it' => ['reviewed' => false]]].
 *
 * @param  array<string, mixed>  $changes  what this test changes
 * @return array<string, mixed>
 */
function publicExerciseForm(array $changes = []): array
{
    // One language's texts
    $texts = fn (string $name, string $step, bool $reviewed = true) => [
        'name' => $name, 'aliases' => [], 'description' => null,
        'instructions' => [$step], 'reviewed' => $reviewed,
    ];

    return overForm([
        'translations' => [
            'en' => $texts('Plank', 'Hold the position.'),
            'it' => $texts('Plank', 'Mantieni la posizione.'),
            'es' => $texts('Plancha', 'Mantén la posición.'),
            'de' => $texts('Unterarmstütz', 'Halte die Position.'),
        ],
        'logging_type' => 'time',
        'equipment_id' => Equipment::where('slug', 'body-only')->value('id'),
        'youtube_url' => '',
        'primary_muscles' => [Muscle::where('slug', 'abdominals')->value('id')],
        'secondary_muscles' => [],
    ], $changes);
}

it('creates a public exercise with every language', function () {
    // The plank of publicExerciseForm(), as it is
    $exercise = app(SavePublicExercise::class)->create(publicExerciseForm());

    expect($exercise->isPublic())->toBeTrue()
        ->and($exercise->getTranslations('name'))->toBe(['en' => 'Plank', 'it' => 'Plank', 'es' => 'Plancha', 'de' => 'Unterarmstütz'])
        ->and($exercise->getTranslation('instructions', 'de'))->toBe(['Halte die Position.'])
        ->and($exercise->logging_type)->toBe(LoggingType::Time)
        ->and($exercise->equipment->slug)->toBe('body-only')
        // An empty text field becomes NULL, not ''
        ->and($exercise->youtube_url)->toBeNull()
        ->and($exercise->machine_translated)->toBe([])
        // search_text, written by the model's `saving` event, holds every language
        ->and($exercise->fresh()->search_text)->toContain('plancha');
});

// Scenario: the import's Spanish and German, not yet reviewed, and the
// admin's Italian, reviewed
it('keeps a language not reviewed in machine_translated', function () {
    // The exercise saved with those two switches off
    $exercise = app(SavePublicExercise::class)->create(publicExerciseForm([
        'translations' => ['es' => ['reviewed' => false], 'de' => ['reviewed' => false]],
    ]));

    expect($exercise->machine_translated)->toBe(['es', 'de']);
});

it('never puts English in machine_translated, nor a language with no text', function () {
    // The exercise saved with English "not reviewed" and German empty
    $exercise = app(SavePublicExercise::class)->create(publicExerciseForm([
        // English has no switch on the form; sent false, it is ignored
        'translations' => [
            'en' => ['reviewed' => false],
            'de' => ['name' => '', 'instructions' => [], 'reviewed' => false],
        ],
    ]));

    expect($exercise->machine_translated)->toBe([]);
});

// Scenario: the admin empties the German tab
it('removes a language left empty, and keeps the others', function () {
    // The action, and an exercise in four languages
    $save = app(SavePublicExercise::class);
    $exercise = $save->create(publicExerciseForm());

    $save->update($exercise, publicExerciseForm([
        'translations' => ['de' => ['name' => '  ', 'instructions' => ['', ' ']]],
    ]));

    // jsonb keeps its keys in its own order: en, es, it
    expect(array_keys($exercise->fresh()->getTranslations('name')))->toEqualCanonicalizing(['en', 'it', 'es'])
        ->and(array_keys($exercise->fresh()->getTranslations('instructions')))->toEqualCanonicalizing(['en', 'it', 'es']);
});

it('renumbers the steps, as the repeater keeps them under random keys', function () {
    // Set directly: with named keys, overForm() would merge it with the base's steps
    $form = publicExerciseForm();
    $form['translations']['en']['instructions'] = ['a1b2' => 'Lie down.', 'c3d4' => ' ', 'e5f6' => 'Lift.'];

    // The exercise saved from that form
    $exercise = app(SavePublicExercise::class)->create($form);

    expect($exercise->getTranslation('instructions', 'en'))->toBe(['Lie down.', 'Lift.']);
});

it('saves the muscles with their roles, a muscle in both lists as primary', function () {
    // Three muscles by slug, as ids
    [$abs, $lowerBack, $shoulders] = collect(['abdominals', 'lower-back', 'shoulders'])
        ->map(fn (string $slug) => Muscle::where('slug', $slug)->value('id'))
        ->all();

    // Abdominals in both lists
    $exercise = app(SavePublicExercise::class)->create(publicExerciseForm([
        'primary_muscles' => [$abs],
        'secondary_muscles' => [$lowerBack, $shoulders, $abs],
    ]));

    // The role of each muscle, by slug
    $roles = $exercise->muscles->mapWithKeys(fn (Muscle $m) => [$m->slug => $m->pivot->role])->all();

    expect($roles)->toEqual([
        'abdominals' => MuscleRole::Primary,
        'lower-back' => MuscleRole::Secondary,
        'shoulders' => MuscleRole::Secondary,
    ]);
});

it('gives back as form state what it saved', function () {
    // A form with the Italian not reviewed, and the exercise saved from it
    $form = publicExerciseForm(['translations' => ['it' => ['reviewed' => false]]]);
    $exercise = app(SavePublicExercise::class)->create($form);

    // The state the edit page opens with
    $state = SavePublicExercise::formState($exercise->fresh());

    expect($state['translations']['it'])->toBe(['name' => 'Plank', 'aliases' => [], 'description' => null, 'instructions' => ['Mantieni la posizione.'], 'reviewed' => false])
        ->and($state['translations']['es']['reviewed'])->toBeTrue()
        ->and($state['logging_type'])->toBe('time')
        ->and($state['primary_muscles'])->toBe($form['primary_muscles'])
        ->and($state['secondary_muscles'])->toBe([]);
});

it('refuses to change a personal exercise', function () {
    // A user's own exercise
    $personal = Exercise::factory()->personal()->create();

    expect(fn () => app(SavePublicExercise::class)->update($personal, publicExerciseForm()))
        ->toThrow(LogicException::class);
});
