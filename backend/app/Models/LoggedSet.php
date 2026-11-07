<?php

namespace App\Models;

// Imports: the enum of set_type, the attribute and traits used below, and the
// type of the relation
use App\Enums\SetType;
use Database\Factories\LoggedSetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One completed set: one row of `logged_sets`, the tap on ✓
 * (docs/design/D3-data-model.md D3.6.3). Unticking a set removes its row.
 *
 * Which of weight_kg, reps, duration_seconds and distance_meters are filled
 * depends on how the exercise is logged; SaveSessionRequest enforces it,
 * since the rule spans two tables, which a check constraint cannot see.
 *
 * session_exercise_id is set by the code (SaveWorkoutSession), not fillable.
 */
#[Fillable(['id', 'position', 'set_type', 'weight_kg', 'reps', 'duration_seconds', 'distance_meters', 'completed_at'])]
class LoggedSet extends Model
{
    /** @use HasFactory<LoggedSetFactory> */
    use HasFactory, HasUuids;

    /**
     * The casts: set_type to the enum, the weight exact text ("80.000",
     * D3.11), the moment a date object, the rest whole numbers.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'set_type' => SetType::class,
            'weight_kg' => 'decimal:3',
            'reps' => 'integer',
            'duration_seconds' => 'integer',
            'distance_meters' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * A new set is a normal one, as in the table.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'set_type' => 'normal',
    ];

    /**
     * The exercise of the session it belongs to.
     *
     * @return BelongsTo<SessionExercise, $this>
     */
    public function sessionExercise(): BelongsTo
    {
        return $this->belongsTo(SessionExercise::class);
    }
}
