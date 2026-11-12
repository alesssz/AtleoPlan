<?php

/**
 * The admin panel's exercise library screen (BE-1,
 * docs/concepts/C2-backend.md C2.8.2, docs/how-to/H2-backend.md H2.16).
 *
 * The pages are Livewire components, so they are tested as Livewire does:
 * Livewire::test(ListExercises::class) renders the page in memory, as the
 * admin signed in with actingAs() would see it, and Filament adds methods
 * to read its table and fill its form: assertCanSeeTableRecords(),
 * searchTable(), filterTable(), fillForm(), call('save')…
 * (https://filamentphp.com/docs, "Testing").
 *
 * Fixtures: an admin signed in, the real muscles and equipment, and
 * exercises made by the factory.
 */

// Imports: the resource and the pages tested, the enums, the models, the trait that empties
// the database, the seeders of the fixed lists, and Livewire's test entry
use App\Enums\LoggingType;
use App\Filament\Resources\Exercises\ExerciseResource;
use App\Filament\Resources\Exercises\Pages\CreateExercise;
use App\Filament\Resources\Exercises\Pages\EditExercise;
use App\Filament\Resources\Exercises\Pages\ListExercises;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\User;
use Database\Seeders\EquipmentSeeder;
use Database\Seeders\MuscleSeeder;
use Filament\Actions\DeleteAction;
use Filament\Actions\RestoreAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;

uses(RefreshDatabase::class);

// Before each test: the fixed lists, and an admin signed in, in English
beforeEach(function () {
    $this->seed([MuscleSeeder::class, EquipmentSeeder::class]);
    $this->admin = User::factory()->admin()->create(['locale' => 'en']);
    $this->actingAs($this->admin);
});

/**
 * A public exercise with a name in English and Italian.
 *
 * @param  string  $en  the English name
 * @param  string  $it  the Italian name
 * @param  array<string, mixed>  $attributes  more columns
 */
function libraryExercise(string $en, string $it, array $attributes = []): Exercise
{
    return Exercise::factory()->create(['name' => ['en' => $en, 'it' => $it], ...$attributes]);
}

it('lists the public exercises and never the personal ones', function () {
    // One public exercise, and one of a user's own
    $public = libraryExercise('Bench Press', 'Panca piana');
    $personal = Exercise::factory()->personal()->create();

    Livewire::test(ListExercises::class)
        ->assertCanSeeTableRecords([$public])
        ->assertCanNotSeeTableRecords([$personal]);
});

it('searches as the library does, in every language', function () {
    // Two exercises; only the first has "panca" in a name
    $bench = libraryExercise('Bench Press', 'Panca piana');
    $squat = libraryExercise('Squat', 'Squat con bilanciere');

    // The Italian name, with the admin's panel in English
    Livewire::test(ListExercises::class)
        ->searchTable('panca')
        ->assertCanSeeTableRecords([$bench])
        ->assertCanNotSeeTableRecords([$squat]);
});

it('filters the exercises still machine translated in a language', function () {
    // Italian still to review in the first, already reviewed in the second
    $toReview = libraryExercise('Plank', 'Plank', ['machine_translated' => ['it', 'es']]);
    $reviewed = libraryExercise('Squat', 'Squat', ['machine_translated' => ['es']]);

    Livewire::test(ListExercises::class)
        ->filterTable('to_review_in', 'it')
        ->assertCanSeeTableRecords([$toReview])
        ->assertCanNotSeeTableRecords([$reviewed]);
});

// Scenario: the admin fills the create form, English and Italian only
it('creates a public exercise from the form', function () {
    // The id of one muscle, for the select
    $abs = Muscle::where('slug', 'abdominals')->value('id');

    Livewire::test(CreateExercise::class)
        ->fillForm([
            'translations.en.name' => 'Hollow Rock',
            // A simple repeater keeps each item, inside the form, as
            // ['step' => …], its field's name; the saved state is the plain list
            'translations.en.instructions' => [['step' => 'Lie on your back.'], ['step' => 'Rock.']],
            'translations.it.name' => 'Hollow rock',
            'logging_type' => 'reps',
            'primary_muscles' => [$abs],
        ])
        ->call('create')
        ->assertHasNoFormErrors();

    // The new exercise, found by its English name
    $exercise = Exercise::where('name->en', 'Hollow Rock')->firstOrFail();

    expect($exercise->isPublic())->toBeTrue()
        ->and($exercise->getTranslations('name'))->toEqualCanonicalizing(['en' => 'Hollow Rock', 'it' => 'Hollow rock'])
        ->and($exercise->getTranslation('instructions', 'en'))->toBe(['Lie on your back.', 'Rock.'])
        ->and($exercise->logging_type)->toBe(LoggingType::Reps)
        ->and($exercise->machine_translated)->toBe([])
        ->and($exercise->muscles->pluck('slug')->all())->toBe(['abdominals']);
});

it('requires an English name', function () {
    Livewire::test(CreateExercise::class)
        ->fillForm(['translations.en.name' => '', 'translations.it.name' => 'Solo italiano'])
        ->call('create')
        ->assertHasFormErrors(['translations.en.name' => 'required']);
});

// Scenario: the admin reviews the Italian of an imported exercise, fixing its name
it('opens an exercise by language and saves a reviewed translation', function () {
    // Four languages, as the import leaves them; three not reviewed
    $plank = libraryExercise('Plank', 'Plank frontale', [
        'name' => ['en' => 'Plank', 'it' => 'Plank frontale', 'es' => 'Plancha', 'de' => 'Unterarmstütz'],
        'external_id' => 'Plank',
        'logging_type' => LoggingType::Time,
        'machine_translated' => ['it', 'es', 'de'],
    ]);

    Livewire::test(EditExercise::class, ['record' => $plank->getRouteKey()])
        // What the form opened with: each language apart, the switch off
        ->assertSchemaStateSet([
            'translations.en.name' => 'Plank',
            'translations.it.name' => 'Plank frontale',
            'translations.it.reviewed' => false,
            'logging_type' => 'time',
        ])
        ->fillForm([
            'translations.it.name' => 'Plank',
            'translations.it.reviewed' => true,
        ])
        ->call('save')
        ->assertHasNoFormErrors();

    expect($plank->fresh()->getTranslation('name', 'it'))->toBe('Plank')
        ->and($plank->fresh()->machine_translated)->toBe(['es', 'de']);
});

it('does not open a personal exercise', function () {
    // A user's own exercise
    $personal = Exercise::factory()->personal()->create();

    $this->get("/admin/exercises/{$personal->id}/edit")->assertNotFound();
});

it('deletes an exercise softly, and restores it', function () {
    // A public exercise, to delete and bring back
    $plank = libraryExercise('Plank', 'Plank');

    Livewire::test(EditExercise::class, ['record' => $plank->getRouteKey()])
        ->callAction(DeleteAction::class);

    // Still in the table, with deleted_at set
    expect(Exercise::withTrashed()->find($plank->id)->trashed())->toBeTrue();

    Livewire::test(EditExercise::class, ['record' => $plank->getRouteKey()])
        ->callAction(RestoreAction::class);

    expect($plank->fresh()->trashed())->toBeFalse();
});

// Two layers: the page has no Force delete button, and the resource's
// permission refuses it, for any other way in (a bulk action added one day)
it('offers no delete for good', function () {
    // A public exercise already deleted (softly): Force delete would show on it
    $plank = libraryExercise('Plank', 'Plank');
    $plank->delete();

    Livewire::test(EditExercise::class, ['record' => $plank->getRouteKey()])
        ->assertActionDoesNotExist('forceDelete');

    expect(ExerciseResource::canForceDelete($plank))->toBeFalse()
        ->and(ExerciseResource::canEdit($plank))->toBeTrue();
});

// Scenario: the same page for an admin whose app is in Italian
it('speaks the admin\'s language', function () {
    $this->admin->update(['locale' => 'it']);
    libraryExercise('Bench Press', 'Panca piana');

    $this->get('/admin/exercises')
        ->assertOk()
        // Our label, from lang/it/admin.php, and the Italian name
        ->assertSee('Libreria esercizi')
        ->assertSee('Panca piana');
});

it('keeps the screen closed to a user who is not an admin', function () {
    $this->actingAs(User::factory()->create())
        ->get('/admin/exercises')
        ->assertForbidden();
});
