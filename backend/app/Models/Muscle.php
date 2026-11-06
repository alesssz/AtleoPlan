<?php

namespace App\Models;

// Imports: the Fillable attribute, the trait for factories, Eloquent's base
// Model, the type of the relation below, and spatie's trait for translations
use Database\Factories\MuscleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Translatable\HasTranslations;

/**
 * A muscle group, such as chest or lower back: one row of `muscles`
 * (docs/design/D3-data-model.md D3.4.1). The 17 rows come from MuscleSeeder.
 *
 * An Eloquent model, like User (what a model is: app/Models/User.php and
 * docs/concepts/C2-backend.md C2.6). By convention the class Muscle reads the
 * table `muscles`.
 *
 * `name` holds every language at once, {"en": "Chest", "it": "Petto"}, and
 * HasTranslations makes `$muscle->name` return only the current language's
 * text (D3.4.5). The current language is the request's, set by the middleware
 * SetLocaleFromRequest.
 */
#[Fillable(['slug', 'name'])]
class Muscle extends Model
{
    // HasFactory: Muscle::factory() for tests (database/factories/MuscleFactory.php).
    // HasTranslations: one value per language in the columns listed below
    /** @use HasFactory<MuscleFactory> */
    use HasFactory, HasTranslations;

    /**
     * The columns HasTranslations manages: each holds a JSON object with one
     * value per language.
     *
     * @var list<string>
     */
    public array $translatable = ['name'];

    /**
     * The exercises that work this muscle, through the `exercise_muscle`
     * pivot table (docs/concepts/C2-backend.md C2.6, "Relations").
     *
     * belongsToMany() is the many-to-many relation: Laravel finds the pivot
     * table from the two model names. using() reads each pivot row as an
     * ExerciseMuscle, whose `role` is an enum; withPivot() adds that column,
     * which is not loaded otherwise. Each exercise then has
     * `$exercise->pivot->role`.
     *
     * @return BelongsToMany<Exercise, $this, ExerciseMuscle>
     */
    public function exercises(): BelongsToMany
    {
        return $this->belongsToMany(Exercise::class)->using(ExerciseMuscle::class)->withPivot('role');
    }
}
