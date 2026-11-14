<?php

namespace App\Models;

use App\Enums\MuscleRole;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * A row of the `exercise_muscle` pivot. It exists only to cast `role`:
 * Exercise::muscles() and Muscle::exercises() read the pivot through it, so
 * `$muscle->pivot->role` is a MuscleRole.
 */
class ExerciseMuscle extends Pivot
{
    /**
     * Written out: the class name would give `exercise_muscles`.
     *
     * @var string
     */
    protected $table = 'exercise_muscle';

    /** @var bool */
    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => MuscleRole::class,
        ];
    }
}
