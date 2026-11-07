<?php

namespace App\Models;

// Imports: the attribute and traits used below, and the types of the relations
use Database\Factories\PlanDayFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One training day of a plan, such as "Day A – Push": one row of
 * `plan_days` (docs/design/D3-data-model.md D3.5.2).
 *
 * The id is a UUID created on the device (HasUuids; app/Models/Plan.php
 * explains it), and it stays the same across saves: workout sessions will
 * point to it (D3.5.6). plan_id is set through the relation,
 * `$plan->days()->make([...])`, so it is not fillable.
 */
#[Fillable(['id', 'name', 'position'])]
class PlanDay extends Model
{
    /** @use HasFactory<PlanDayFactory> */
    use HasFactory, HasUuids;

    /**
     * position is a whole number.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    /**
     * The plan it belongs to.
     *
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Its exercises, in their order (D3.2.7).
     *
     * @return HasMany<PlanItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PlanItem::class)->orderBy('position');
    }
}
