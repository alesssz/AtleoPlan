<?php

namespace App\Models;

use Database\Factories\PlanItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An exercise in a day of a plan, with its rest, notes, superset and `for_time`
 * (done as fast as possible).
 *
 * The id comes from the device and survives every save, so workout sessions
 * stay linked to it after its sets change. plan_day_id is set by SavePlan, also
 * when the item moves to another day of the same plan.
 */
#[Fillable(['id', 'exercise_id', 'position', 'superset_group', 'rest_seconds', 'notes', 'for_time'])]
class PlanItem extends Model
{
    /** @use HasFactory<PlanItemFactory> */
    use HasFactory, HasUuids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'superset_group' => 'integer',
            'rest_seconds' => 'integer',
            'for_time' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<PlanDay, $this>
     */
    public function day(): BelongsTo
    {
        return $this->belongsTo(PlanDay::class, 'plan_day_id');
    }

    /**
     * withTrashed(): a plan keeps showing an exercise deleted since.
     *
     * @return BelongsTo<Exercise, $this>
     */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class)->withTrashed();
    }

    /**
     * @return HasMany<PlanSet, $this>
     */
    public function sets(): HasMany
    {
        return $this->hasMany(PlanSet::class)->orderBy('position');
    }
}
