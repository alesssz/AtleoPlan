<?php

/**
 * The free-exercise-db import: the action ImportFreeExercise called directly,
 * one exercise at a time, and then the command `exercises:import` on a small
 * dataset.
 *
 * Not the real dataset: each test writes a few exercises in its shape to a
 * temporary folder, with tiny JPEGs as photos. The muscles and equipment are
 * the real seeders'.
 */

use App\Actions\Exercises\ImportFreeExercise;
use App\Enums\ImportOutcome;
use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use App\Models\Exercise;
use App\Models\Muscle;
use Database\Seeders\EquipmentSeeder;
use Database\Seeders\MuscleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * The smallest JPEG file, as base64: enough for its type to be recognised as
 * image/jpeg, which the `photos` collection accepts.
 */
const TINY_JPEG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

// The fixed lists the import points to, and a fake media disk
beforeEach(function () {
    $this->seed([MuscleSeeder::class, EquipmentSeeder::class]);
    Storage::fake('public');
});

/**
 * One exercise as free-exercise-db writes it; $changes replaces some fields.
 *
 * @param  array<string, mixed>  $changes  the fields to change
 * @return array<string, mixed>
 */
function sourceExercise(array $changes = []): array
{
    return [
        'id' => 'Barbell_Bench_Press',
        'name' => 'Barbell Bench Press',
        'force' => 'push',
        'level' => 'beginner',
        'mechanic' => 'compound',
        'equipment' => 'barbell',
        'primaryMuscles' => ['chest'],
        'secondaryMuscles' => ['shoulders', 'triceps'],
        'instructions' => ['Lie on the bench.', 'Lower the bar to the chest.'],
        'category' => 'strength',
        'images' => ['Barbell_Bench_Press/0.jpg', 'Barbell_Bench_Press/1.jpg'],
        ...$changes,
    ];
}

/**
 * Writes a dataset with these exercises, in the real one's layout:
 * dist/exercises.json, and exercises/<id>/0.jpg… for every image listed.
 *
 * @param  list<array<string, mixed>>  $exercises  the source's exercises
 * @return string the dataset's folder
 */
function writeDataset(array $exercises): string
{
    // A folder of its own in the system's temporary directory, emptied first
    $path = sys_get_temp_dir().'/atleoplan-free-exercise-db';
    File::deleteDirectory($path);
    File::ensureDirectoryExists($path.'/dist');

    File::put($path.'/dist/exercises.json', json_encode($exercises));
    foreach ($exercises as $exercise) {
        foreach ($exercise['images'] as $image) {
            File::ensureDirectoryExists(dirname($path.'/exercises/'.$image));
            File::put($path.'/exercises/'.$image, base64_decode(TINY_JPEG));
        }
    }

    return $path;
}

// --- The action, one exercise at a time ---------------------------------------

it('imports an exercise with its texts, equipment, muscles and photos', function () {
    $path = writeDataset([sourceExercise()]);

    $result = app(ImportFreeExercise::class)->import(sourceExercise(), $path.'/exercises');

    $exercise = Exercise::sole();
    expect($result->outcome)->toBe(ImportOutcome::Created)
        ->and($result->photosAdded)->toBe(2)
        ->and($exercise->isPublic())->toBeTrue()
        ->and($exercise->external_id)->toBe('Barbell_Bench_Press')
        ->and($exercise->getTranslations('name'))->toBe(['en' => 'Barbell Bench Press'])
        ->and($exercise->getTranslation('instructions', 'en'))->toBe(['Lie on the bench.', 'Lower the bar to the chest.'])
        ->and($exercise->level)->toBe('beginner')
        ->and($exercise->category)->toBe('strength')
        ->and($exercise->equipment->slug)->toBe('barbell')
        ->and($exercise->logging_type)->toBe(LoggingType::WeightReps)
        ->and($exercise->machine_translated)->toBe([]);

    // muscle slug => role
    $roles = $exercise->muscles->mapWithKeys(fn (Muscle $m) => [$m->slug => $m->pivot->role])->all();
    expect($roles)->toEqualCanonicalizing([
        'chest' => MuscleRole::Primary,
        'shoulders' => MuscleRole::Secondary,
        'triceps' => MuscleRole::Secondary,
    ]);

    // The photos in the source's order: the first is the cover
    expect($exercise->getMedia('photos')->pluck('file_name')->all())->toBe(['0.jpg', '1.jpg']);
    // Copied, not moved: the dataset still has them
    expect(File::exists($path.'/exercises/Barbell_Bench_Press/0.jpg'))->toBeTrue();
});

it('guesses how sets are logged from the category and the equipment', function (string $category, ?string $equipment, LoggingType $expected) {
    expect(ImportFreeExercise::loggingTypeFor($category, $equipment))->toBe($expected);
})->with([
    'a strength exercise with a barbell' => ['strength', 'barbell', LoggingType::WeightReps],
    'a strength exercise with the body only' => ['strength', 'body only', LoggingType::Reps],
    'a plyometric exercise with no equipment' => ['plyometrics', null, LoggingType::Reps],
    'a stretch, even with a foam roll' => ['stretching', 'foam roll', LoggingType::Time],
    'cardio on a machine' => ['cardio', 'machine', LoggingType::Time],
]);

it('cleans the instructions: no HTML, no spaces around, no empty steps', function () {
    expect(ImportFreeExercise::cleanInstructions(['  Lie down. ', '', '<li>Push up.</li>', '   ']))
        ->toBe(['Lie down.', 'Push up.']);
});

it('keeps primary a muscle that is listed in both lists', function () {
    app(ImportFreeExercise::class)->import(
        sourceExercise(['primaryMuscles' => ['chest'], 'secondaryMuscles' => ['chest', 'triceps']]),
        '/nowhere',
        withPhotos: false,
    );

    $roles = Exercise::sole()->muscles->mapWithKeys(fn (Muscle $m) => [$m->slug => $m->pivot->role])->all();
    expect($roles)->toEqualCanonicalizing(['chest' => MuscleRole::Primary, 'triceps' => MuscleRole::Secondary]);
});

it('imports an exercise with no equipment and no instructions', function () {
    app(ImportFreeExercise::class)->import(sourceExercise(['equipment' => null, 'instructions' => []]), '/nowhere', withPhotos: false);

    $exercise = Exercise::sole();
    expect($exercise->equipment_id)->toBeNull()
        ->and($exercise->getRawOriginal('instructions'))->toBeNull()
        ->and($exercise->logging_type)->toBe(LoggingType::Reps);
});

it('refuses a muscle that is not one of ours, saving nothing', function () {
    $import = fn () => app(ImportFreeExercise::class)->import(sourceExercise(['primaryMuscles' => ['wings']]), '/nowhere', withPhotos: false);

    expect($import)->toThrow(InvalidArgumentException::class, 'Unknown muscle "wings"');
    // The transaction undid the exercise too
    expect(Exercise::count())->toBe(0);
});

it('leaves an exercise already imported as it is, unless asked to update', function () {
    $import = app(ImportFreeExercise::class);
    $import->import(sourceExercise(), '/nowhere', withPhotos: false);

    // The source changed its name; without --update, nothing changes
    $result = $import->import(sourceExercise(['name' => 'Flat Bench Press']), '/nowhere', withPhotos: false);

    expect($result->outcome)->toBe(ImportOutcome::Unchanged)
        ->and(Exercise::sole()->getTranslation('name', 'en'))->toBe('Barbell Bench Press');
});

it('refreshes the English texts on update, keeping the other languages and the logging type', function () {
    $import = app(ImportFreeExercise::class);
    $import->import(sourceExercise(), '/nowhere', withPhotos: false);
    // Meanwhile, the translation and an admin did their part
    $exercise = Exercise::sole();
    $exercise->setTranslation('name', 'it', 'Panca piana con bilanciere');
    $exercise->logging_type = LoggingType::Reps;
    $exercise->save();

    $result = $import->import(sourceExercise(['name' => 'Flat Bench Press', 'level' => 'intermediate']), '/nowhere', update: true, withPhotos: false);

    $exercise->refresh();
    expect($result->outcome)->toBe(ImportOutcome::Updated)
        ->and($exercise->getTranslations('name'))->toBe(['en' => 'Flat Bench Press', 'it' => 'Panca piana con bilanciere'])
        ->and($exercise->level)->toBe('intermediate')
        ->and($exercise->logging_type)->toBe(LoggingType::Reps)
        ->and(Exercise::count())->toBe(1);
});

it('does not bring back an exercise deleted by an admin', function () {
    $import = app(ImportFreeExercise::class);
    $import->import(sourceExercise(), '/nowhere', withPhotos: false);
    Exercise::sole()->delete();

    $result = $import->import(sourceExercise(), '/nowhere', update: true, withPhotos: false);

    expect($result->outcome)->toBe(ImportOutcome::SkippedDeleted)
        ->and(Exercise::count())->toBe(0)
        ->and(Exercise::withTrashed()->count())->toBe(1);
});

it('adds the photos on a later run to an exercise that has none yet', function () {
    $path = writeDataset([sourceExercise()]);
    $import = app(ImportFreeExercise::class);
    // A first run without photos, as if it had stopped halfway
    $import->import(sourceExercise(), $path.'/exercises', withPhotos: false);

    $second = $import->import(sourceExercise(), $path.'/exercises');
    $third = $import->import(sourceExercise(), $path.'/exercises');

    expect($second->photosAdded)->toBe(2)
        // Never twice
        ->and($third->photosAdded)->toBe(0)
        ->and(Exercise::sole()->getMedia('photos'))->toHaveCount(2);
});

// --- The command ----------------------------------------------------------------

it('imports the whole dataset and prints a summary', function () {
    $path = writeDataset([
        sourceExercise(),
        sourceExercise(['id' => 'Plank', 'name' => 'Plank', 'equipment' => 'body only', 'images' => ['Plank/0.jpg']]),
    ]);

    $this->artisan('exercises:import', ['--path' => $path])
        ->expectsOutputToContain('Created: 2')
        ->expectsOutputToContain('Photos added: 3')
        ->assertSuccessful()
        ->run();

    expect(Exercise::count())->toBe(2);

    // A second run creates nothing
    $this->artisan('exercises:import', ['--path' => $path])
        ->expectsOutputToContain('Unchanged: 2')
        ->expectsOutputToContain('Photos added: 0')
        ->assertSuccessful()
        ->run();

    expect(Exercise::count())->toBe(2);
});

it('imports only the first exercises with --limit, and only texts with --without-photos', function () {
    $path = writeDataset([sourceExercise(), sourceExercise(['id' => 'Plank', 'name' => 'Plank', 'images' => []])]);

    $this->artisan('exercises:import', ['--path' => $path, '--limit' => 1, '--without-photos' => true])
        ->expectsOutputToContain('Created: 1')
        ->assertSuccessful()
        ->run();

    expect(Exercise::sole()->external_id)->toBe('Barbell_Bench_Press')
        ->and(Exercise::sole()->getMedia('photos'))->toBeEmpty();
});

it('reports an exercise that fails and imports the others', function () {
    $path = writeDataset([sourceExercise(['primaryMuscles' => ['wings']]), sourceExercise(['id' => 'Plank', 'name' => 'Plank', 'images' => []])]);

    $this->artisan('exercises:import', ['--path' => $path])
        ->expectsOutputToContain('Created: 1')
        ->expectsOutputToContain('Failed: 1')
        ->expectsOutputToContain('Barbell_Bench_Press: Unknown muscle "wings"')
        ->assertFailed()
        ->run();

    expect(Exercise::sole()->external_id)->toBe('Plank');
});

it('stops with a hint when the dataset is not there', function () {
    $this->artisan('exercises:import', ['--path' => '/nowhere'])
        ->expectsOutputToContain('free-exercise-db not found')
        ->assertFailed()
        ->run();
});
