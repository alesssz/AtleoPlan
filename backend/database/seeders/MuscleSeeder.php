<?php

namespace Database\Seeders;

use App\Models\Muscle;
use Illuminate\Database\Seeder;

/**
 * The muscle groups, in the app's four languages.
 *
 * free-exercise-db's list, so that its exercises find their muscles by slug.
 * Data the app needs, so it runs on the server too. Upserted by slug: running
 * it again changes nothing, or applies a corrected name.
 */
class MuscleSeeder extends Seeder
{
    /**
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

    public function run(): void
    {
        foreach (self::MUSCLES as $slug => $name) {
            Muscle::updateOrCreate(['slug' => $slug], ['name' => $name]);
        }
    }
}
