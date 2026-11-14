<?php

namespace App\Models;

use Database\Factories\MuscleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Translatable\HasTranslations;

/**
 * A muscle group, such as chest or lower back. The rows come from MuscleSeeder.
 *
 * `name` holds every language, {"en": "Chest", "it": "Petto"}; reading it
 * returns the request's language, set by SetLocaleFromRequest.
 */
#[Fillable(['slug', 'name'])]
class Muscle extends Model
{
    /** @use HasFactory<MuscleFactory> */
    use HasFactory, HasTranslations;

    /** @var list<string> */
    public array $translatable = ['name'];

    /**
     * Each exercise carries `pivot->role`, cast by ExerciseMuscle.
     *
     * @return BelongsToMany<Exercise, $this, ExerciseMuscle>
     */
    public function exercises(): BelongsToMany
    {
        return $this->belongsToMany(Exercise::class)->using(ExerciseMuscle::class)->withPivot('role');
    }
}
