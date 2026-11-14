<?php

namespace App\Models;

use App\Enums\SetType;
use Database\Factories\PlanSetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A planned set of a plan item, with its type and targets.
 *
 * Unlike the levels above it, the id is a plain number that changes on every
 * save: SavePlan rewrites an item's sets, since nothing points to them.
 */
#[Fillable(['position', 'set_type', 'target_reps_min', 'target_reps_max', 'target_weight_kg', 'target_rpe', 'target_duration_seconds', 'target_distance_meters'])]
class PlanSet extends Model
{
    /** @use HasFactory<PlanSetFactory> */
    use HasFactory;

    /**
     * Rows rewritten on every save have no history worth keeping.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The decimals stay exact strings, "80.000" and "8.5".
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'set_type' => SetType::class,
            'target_reps_min' => 'integer',
            'target_reps_max' => 'integer',
            'target_weight_kg' => 'decimal:3',
            'target_rpe' => 'decimal:1',
            'target_duration_seconds' => 'integer',
            'target_distance_meters' => 'integer',
        ];
    }

    /**
     * The table's default, which a new model does not read back.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'set_type' => 'normal',
    ];

    /**
     * @return BelongsTo<PlanItem, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(PlanItem::class, 'plan_item_id');
    }
}
