<?php

namespace App\Models;

// Imports: the enum of the role column, and Laravel's base class for pivot rows
use App\Enums\MuscleRole;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * One row of the `exercise_muscle` pivot table: an exercise, a muscle, and
 * the muscle's role in it (docs/design/D3-data-model.md D3.4.3).
 *
 * A pivot table needs no model of its own: Exercise::muscles() and
 * Muscle::exercises() read it directly. This class exists only so that the
 * `role` column can have a cast, like any model's column. The two relations
 * point to it with ->using(ExerciseMuscle::class), and then
 * `$muscle->pivot->role` is MuscleRole::Primary rather than the string
 * "primary". Created with `make artisan c="make:model ExerciseMuscle --pivot"`.
 */
class ExerciseMuscle extends Pivot
{
    /**
     * The table, written out: Laravel would otherwise guess `exercise_muscles`
     * from the class name.
     *
     * @var string
     */
    protected $table = 'exercise_muscle';

    /**
     * No created_at and updated_at in this table.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The casts, as in any model (app/Models/User.php explains them).
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => MuscleRole::class,
        ];
    }
}
