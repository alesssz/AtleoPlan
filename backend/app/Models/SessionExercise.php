<?php

namespace App\Models;

use Database\Factories\SessionExerciseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An exercise as done in one session. A skipped exercise is a row with no sets;
 * a swapped one has another exercise_id and the same plan_item_id.
 *
 * workout_session_id is set by SaveWorkoutSession, never mass-assigned.
 */
#[Fillable(['id', 'exercise_id', 'plan_item_id', 'position', 'superset_group', 'notes'])]
class SessionExercise extends Model
{
    /** @use HasFactory<SessionExerciseFactory> */
    use HasFactory, HasUuids;

    /**
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
     * @return BelongsTo<WorkoutSession, $this>
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(WorkoutSession::class, 'workout_session_id');
    }

    /**
     * withTrashed(): history keeps showing an exercise deleted since.
     *
     * @return BelongsTo<Exercise, $this>
     */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class)->withTrashed();
    }

    /**
     * The plan's slot it filled; null for an exercise added during the workout.
     *
     * @return BelongsTo<PlanItem, $this>
     */
    public function planItem(): BelongsTo
    {
        return $this->belongsTo(PlanItem::class);
    }

    /**
     * @return HasMany<LoggedSet, $this>
     */
    public function sets(): HasMany
    {
        return $this->hasMany(LoggedSet::class)->orderBy('position');
    }
}
