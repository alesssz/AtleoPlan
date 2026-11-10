<?php

namespace App\Models;

// Imports: the attribute and traits used below, and the types of the relations
use Database\Factories\PlanItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One exercise in one day of a plan, with its rest, notes and superset, and
 * whether it is done as fast as possible (`for_time`): one
 * row of `plan_items` (docs/design/D3-data-model.md D3.5.3).
 *
 * The id is a UUID created on the device and kept across saves, so that the
 * workout sessions of FEAT-3 stay linked to it even after its sets change
 * (D3.5.6). plan_day_id is not fillable: SavePlan sets it, also when the
 * item moves to another day of the same plan.
 */
#[Fillable(['id', 'exercise_id', 'position', 'superset_group', 'rest_seconds', 'notes', 'for_time'])]
class PlanItem extends Model
{
    /** @use HasFactory<PlanItemFactory> */
    use HasFactory, HasUuids;

    /**
     * The whole numbers, read as such; for_time as true or false.
     *
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
     * The day it is in.
     *
     * @return BelongsTo<PlanDay, $this>
     */
    public function day(): BelongsTo
    {
        // The method is day(), not planDay(), so the column is given: Laravel
        // would otherwise look for day_id
        return $this->belongsTo(PlanDay::class, 'plan_day_id');
    }

    /**
     * The exercise, also when it has been deleted.
     *
     * withTrashed(): an exercise is soft-deleted (D3.7.2), and a plain
     * belongsTo() would then give null, and the plan page would break on
     * `$item->exercise->name` (D3.11). The plan keeps showing it instead.
     *
     * @return BelongsTo<Exercise, $this>
     */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class)->withTrashed();
    }

    /**
     * Its planned sets, in their order.
     *
     * @return HasMany<PlanSet, $this>
     */
    public function sets(): HasMany
    {
        return $this->hasMany(PlanSet::class)->orderBy('position');
    }
}
