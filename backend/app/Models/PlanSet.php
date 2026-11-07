<?php

namespace App\Models;

// Imports: the enum of set_type, the attribute and traits used below, and the
// type of the relation
use App\Enums\SetType;
use Database\Factories\PlanSetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One planned set of a plan item, with its type and targets: one row of
 * `plan_sets` (docs/design/D3-data-model.md D3.5.4).
 *
 * Unlike the levels above it, its id is a plain number and changes on every
 * save: SavePlan deletes an item's sets and writes them again, since nothing
 * points to them (D3.5.6).
 */
#[Fillable(['position', 'set_type', 'target_reps_min', 'target_reps_max', 'target_weight_kg', 'target_rpe', 'target_duration_seconds', 'target_distance_meters'])]
class PlanSet extends Model
{
    /** @use HasFactory<PlanSetFactory> */
    use HasFactory;

    /**
     * The table has no created_at and updated_at: rows rewritten on every
     * save have no history worth keeping. Without this, Laravel would try to
     * fill those columns and Postgres would answer that they do not exist.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The casts:
     * - set_type becomes the enum SetType;
     * - the decimals stay exact strings: "80.000", "8.5". A float would turn
     *   0.1 + 0.2 into 0.30000000000000004 (docs/design/D3-data-model.md D3.11);
     * - the rest are whole numbers.
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
     * A new set is a normal one, as in the table.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'set_type' => 'normal',
    ];

    /**
     * The item it belongs to.
     *
     * @return BelongsTo<PlanItem, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(PlanItem::class, 'plan_item_id');
    }
}
