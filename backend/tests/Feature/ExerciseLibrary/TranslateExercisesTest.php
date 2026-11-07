<?php

/**
 * The translation of the imported exercises (DATA-1, docs/concepts/C2-backend.md
 * C2.14.4): the action TranslateExercise on one exercise, the command
 * `exercises:translate` on small translation files written to a temporary
 * folder, and the real files of the repository, checked for shape.
 */

use App\Actions\Exercises\TranslateExercise;
use App\Models\Exercise;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;

uses(RefreshDatabase::class);

/**
 * An imported exercise, in English only, with two steps.
 *
 * @param  string  $externalId  its id in free-exercise-db
 */
function importedExercise(string $externalId = 'Barbell_Squat'): Exercise
{
    return Exercise::factory()->create([
        'external_id' => $externalId,
        'name' => ['en' => 'Barbell Squat'],
        'instructions' => ['en' => ['Set the bar on your back.', 'Squat down and stand up.']],
    ]);
}

/**
 * An entry of a translation file.
 *
 * @param  array<string, mixed>  $changes  the fields to change
 * @return array{name: string, aliases: list<string>, instructions: list<string>}
 */
function italianEntry(array $changes = []): array
{
    return [
        'name' => 'Squat con bilanciere',
        'aliases' => ['squat', 'accosciata'],
        'instructions' => ['Appoggia il bilanciere sulla schiena.', 'Scendi e risali.'],
        ...$changes,
    ];
}

/**
 * Writes translation files to a new temporary folder, one per language.
 *
 * @param  array<string, array<string, mixed>>  $files  language => entries by external_id
 * @return string the folder, for --path
 */
function writeTranslations(array $files): string
{
    $folder = sys_get_temp_dir().'/translations-'.uniqid();
    File::makeDirectory($folder);
    foreach ($files as $locale => $entries) {
        File::put("{$folder}/{$locale}.json", json_encode($entries));
    }

    return $folder;
}

// --- The action ----------------------------------------------------------------

it('writes one language, keeps English, and marks it machine-translated', function () {
    $exercise = importedExercise();

    expect(app(TranslateExercise::class)->translate($exercise, 'it', italianEntry()))->toBeTrue();

    $fresh = $exercise->fresh();
    expect($fresh->getTranslation('name', 'it'))->toBe('Squat con bilanciere')
        ->and($fresh->getTranslation('name', 'en'))->toBe('Barbell Squat')
        ->and($fresh->getTranslation('aliases', 'it'))->toBe(['squat', 'accosciata'])
        ->and($fresh->getTranslation('instructions', 'it'))->toBe(['Appoggia il bilanciere sulla schiena.', 'Scendi e risali.'])
        ->and($fresh->machine_translated)->toBe(['it']);
});

it('keeps a language the exercise already has, unless forced', function () {
    $exercise = importedExercise();
    // Corrected by hand in the admin panel, say
    $exercise->setTranslation('name', 'it', 'Squat')->save();
    $translate = app(TranslateExercise::class);

    expect($translate->translate($exercise, 'it', italianEntry()))->toBeFalse()
        ->and($exercise->fresh()->getTranslation('name', 'it'))->toBe('Squat');

    expect($translate->translate($exercise, 'it', italianEntry(), force: true))->toBeTrue()
        ->and($exercise->fresh()->getTranslation('name', 'it'))->toBe('Squat con bilanciere');
});

it('refuses a translation whose steps do not match the English', function () {
    $exercise = importedExercise();

    expect(fn () => app(TranslateExercise::class)->translate($exercise, 'it', italianEntry(['instructions' => ['Uno solo.']])))
        ->toThrow(InvalidArgumentException::class, '1 steps in it, the English has 2');
    expect($exercise->fresh()->getTranslation('name', 'it', false))->toBe('');
});

it('lists each language once, and leaves no old aliases on a forced run', function () {
    $exercise = importedExercise();
    $translate = app(TranslateExercise::class);

    $translate->translate($exercise, 'de', italianEntry(['name' => 'Kniebeuge']));
    $translate->translate($exercise, 'it', italianEntry());
    $translate->translate($exercise, 'it', italianEntry(['aliases' => []]), force: true);

    $fresh = $exercise->fresh();
    expect($fresh->machine_translated)->toBe(['de', 'it'])
        ->and($fresh->getTranslation('aliases', 'it', false))->toBe('');
});

it('makes the exercise found by its Italian name and aliases', function () {
    app(TranslateExercise::class)->translate(importedExercise(), 'it', italianEntry());
    app()->setLocale('it');

    expect(Exercise::search('accosciata')->count())->toBe(1)
        ->and(Exercise::search('bilanciere')->count())->toBe(1);
});

// --- The command ---------------------------------------------------------------

it('translates every imported exercise from the files, and sums up', function () {
    importedExercise('Barbell_Squat');
    $folder = writeTranslations([
        'it' => ['Barbell_Squat' => italianEntry(), 'Not_Imported' => italianEntry()],
        'es' => ['Barbell_Squat' => italianEntry(['name' => 'Sentadilla con barra'])],
        'de' => ['Barbell_Squat' => italianEntry(['name' => 'Kniebeuge mit Langhantel'])],
    ]);

    $this->artisan('exercises:translate', ['--path' => $folder])
        ->expectsOutputToContain('Translating into it: 2 exercises in the file')
        ->expectsOutputToContain('Not in the library: 1')
        ->assertSuccessful();

    $squat = Exercise::where('external_id', 'Barbell_Squat')->first();
    // toEqual(), not toBe(): Postgres's jsonb keeps an object's keys in an
    // order of its own (shorter first), so only the pairs are compared
    expect($squat->getTranslations('name'))->toEqual([
        'en' => 'Barbell Squat',
        'it' => 'Squat con bilanciere',
        'es' => 'Sentadilla con barra',
        'de' => 'Kniebeuge mit Langhantel',
    ])->and($squat->machine_translated)->toBe(['it', 'es', 'de']);

    // A second run keeps what is there
    $this->artisan('exercises:translate', ['--path' => $folder])
        ->expectsOutputToContain('Kept, already in it: 1')
        ->assertSuccessful();
});

it('translates only the languages asked for', function () {
    importedExercise();
    $folder = writeTranslations(['it' => ['Barbell_Squat' => italianEntry()], 'es' => ['Barbell_Squat' => italianEntry()]]);

    $this->artisan('exercises:translate', ['--path' => $folder, '--locale' => ['it']])->assertSuccessful();

    expect(Exercise::first()->machine_translated)->toBe(['it']);
});

it('lists the exercises that failed, writes the others, and fails', function () {
    importedExercise('Barbell_Squat');
    importedExercise('Front_Squat');
    $folder = writeTranslations(['it' => [
        'Barbell_Squat' => italianEntry(['instructions' => ['Uno solo.']]),
        'Front_Squat' => italianEntry(['name' => 'Front squat']),
    ]]);

    $this->artisan('exercises:translate', ['--path' => $folder, '--locale' => ['it']])
        ->expectsOutputToContain('Barbell_Squat: 1 steps in it, the English has 2')
        ->assertFailed();

    expect(Exercise::where('external_id', 'Front_Squat')->first()->getTranslation('name', 'it'))->toBe('Front squat');
});

it('refuses a language that is not ours, and says when a file is missing', function () {
    $this->artisan('exercises:translate', ['--locale' => ['fr']])
        ->expectsOutputToContain('Unknown language: fr')
        ->assertFailed();

    $this->artisan('exercises:translate', ['--path' => writeTranslations([]), '--locale' => ['it']])
        ->expectsOutputToContain('No translation file')
        ->assertFailed();
});

// --- The files of the repository -------------------------------------------------

it('ships the three languages for the same exercises, each entry complete', function () {
    $files = collect(['it', 'es', 'de'])->mapWithKeys(fn (string $locale) => [
        $locale => json_decode(File::get(database_path("data/exercise-translations/{$locale}.json")), true, flags: JSON_THROW_ON_ERROR),
    ]);

    // The same 876 exercises in each, every one with its three fields
    expect(array_keys($files['it']))->toHaveCount(876)
        ->and(array_keys($files['es']))->toBe(array_keys($files['it']))
        ->and(array_keys($files['de']))->toBe(array_keys($files['it']));
    foreach ($files as $locale => $entries) {
        foreach ($entries as $id => $entry) {
            expect(array_keys($entry))->toBe(['name', 'aliases', 'instructions'], "{$locale} {$id}")
                ->and($entry['name'])->toBeString()->not->toBeEmpty()
                ->and(count($entry['aliases']))->toBeLessThanOrEqual(3)
                // The same number of steps in every language
                ->and(count($entry['instructions']))->toBe(count($files['it'][$id]['instructions']), "{$locale} {$id}");
        }
    }
});
