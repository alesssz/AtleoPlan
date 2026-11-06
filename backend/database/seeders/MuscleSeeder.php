<?php

namespace Database\Seeders;

// Imports: the model to write, and Laravel's base Seeder
use App\Models\Muscle;
use Illuminate\Database\Seeder;

/**
 * Writes the 17 muscle groups of the library, in the four languages of the
 * app (docs/design/D3-data-model.md D3.4.1).
 *
 * The list is free-exercise-db's, so that its exercises (DATA-1) find their
 * muscles by slug. It is data the app needs to work, not test data, so it is
 * also run on the server: `php artisan db:seed --class=MuscleSeeder --force`
 * (docs/how-to/H1-database.md H1.6).
 *
 * It can run again at any time: each muscle is looked up by its slug and
 * updated, or created if missing. Running it twice changes nothing; running
 * it after a name was corrected here updates that name.
 */
class MuscleSeeder extends Seeder
{
    /**
     * slug => name in each language. The slug is a stable English key; the
     * names are what the user reads.
     *
     * `private const`: a constant of this class, readable only inside it, as
     * `self::MUSCLES`.
     *
     * @var array<string, array<string, string>>
     */
    private const MUSCLES = [
        'abdominals' => ['en' => 'Abdominals', 'it' => 'Addominali', 'es' => 'Abdominales', 'de' => 'Bauchmuskeln'],
        'abductors' => ['en' => 'Abductors', 'it' => 'Abduttori', 'es' => 'Abductores', 'de' => 'Abduktoren'],
        'adductors' => ['en' => 'Adductors', 'it' => 'Adduttori', 'es' => 'Aductores', 'de' => 'Adduktoren'],
        'biceps' => ['en' => 'Biceps', 'it' => 'Bicipiti', 'es' => 'Bíceps', 'de' => 'Bizeps'],
        'calves' => ['en' => 'Calves', 'it' => 'Polpacci', 'es' => 'Gemelos', 'de' => 'Waden'],
        'chest' => ['en' => 'Chest', 'it' => 'Petto', 'es' => 'Pecho', 'de' => 'Brust'],
        'forearms' => ['en' => 'Forearms', 'it' => 'Avambracci', 'es' => 'Antebrazos', 'de' => 'Unterarme'],
        'glutes' => ['en' => 'Glutes', 'it' => 'Glutei', 'es' => 'Glúteos', 'de' => 'Gesäß'],
        'hamstrings' => ['en' => 'Hamstrings', 'it' => 'Femorali', 'es' => 'Isquiotibiales', 'de' => 'Beinbeuger'],
        'lats' => ['en' => 'Lats', 'it' => 'Dorsali', 'es' => 'Dorsales', 'de' => 'Latissimus'],
        'lower-back' => ['en' => 'Lower back', 'it' => 'Zona lombare', 'es' => 'Zona lumbar', 'de' => 'Unterer Rücken'],
        'middle-back' => ['en' => 'Middle back', 'it' => 'Schiena centrale', 'es' => 'Espalda media', 'de' => 'Mittlerer Rücken'],
        'neck' => ['en' => 'Neck', 'it' => 'Collo', 'es' => 'Cuello', 'de' => 'Nacken'],
        'quadriceps' => ['en' => 'Quadriceps', 'it' => 'Quadricipiti', 'es' => 'Cuádriceps', 'de' => 'Quadrizeps'],
        'shoulders' => ['en' => 'Shoulders', 'it' => 'Spalle', 'es' => 'Hombros', 'de' => 'Schultern'],
        'traps' => ['en' => 'Traps', 'it' => 'Trapezi', 'es' => 'Trapecios', 'de' => 'Trapezmuskel'],
        'triceps' => ['en' => 'Triceps', 'it' => 'Tricipiti', 'es' => 'Tríceps', 'de' => 'Trizeps'],
    ];

    /**
     * Writes the muscles.
     */
    public function run(): void
    {
        // `foreach (… as $key => $value)` walks the array, giving each slug and
        // its names in turn
        foreach (self::MUSCLES as $slug => $name) {
            // Finds the row whose slug matches the first array; updates it with
            // the second, or creates it with both if there is none
            Muscle::updateOrCreate(['slug' => $slug], ['name' => $name]);
        }
    }
}
