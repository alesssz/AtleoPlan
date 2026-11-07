<?php

namespace App\Models;

// Imports: the attribute and traits used below, and the types of the relations
use Database\Factories\SessionExerciseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One exercise as done in one session: one row of `session_exercises`
 * (docs/design/D3-data-model.md D3.6.2). A skipped exercise is a row with no
 * sets; a swapped one has another exercise_id and the same plan_item_id
 * (D3.6.4).
 *
 * workout_session_id is set by the code (SaveWorkoutSession), not fillable.
 */
#[Fillable(['id', 'exercise_id', 'plan_item_id', 'position', 'superset_group', 'notes'])]
class SessionExercise extends Model
{
    /** @use HasFactory<SessionExerciseFactory> */
    use HasFactory, HasUuids;

    /**
     * The whole numbers, read as such.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'superset_group' => 'integer',
        ];
    }

    /**
     * The session it belongs to.
     *
     * @return BelongsTo<WorkoutSession, $this>
     */
    public function session(): BelongsTo
    {
        // The method is session(), so the column is given: Laravel would
        // look for session_id
        return $this->belongsTo(WorkoutSession::class, 'workout_session_id');
    }

    /**
     * The exercise, also when it has been deleted since: history must keep
     * showing it (docs/design/D3-data-model.md D3.11).
     *
     * @return BelongsTo<Exercise, $this>
     */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class)->withTrashed();
    }

    /**
     * The plan's slot it filled; null when added on the fly.
     *
     * @return BelongsTo<PlanItem, $this>
     */
    public function planItem(): BelongsTo
    {
        return $this->belongsTo(PlanItem::class);
    }

    /**
     * Its completed sets, in order.
     *
     * @return HasMany<LoggedSet, $this>
     */
    public function sets(): HasMany
    {
        return $this->hasMany(LoggedSet::class)->orderBy('position');
    }
}
