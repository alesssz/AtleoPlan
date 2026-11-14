<?php

namespace App\Models;

use Database\Factories\PlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/**
 * A workout plan, the top of plan → days → items → sets. A whole plan loads
 * with `Plan::with('days.items.sets')`, one query per level.
 *
 * The id may come from the device, which is why `id` is fillable: HasUuids
 * generates a UUIDv7 only when it is empty. StorePlanRequest refuses an id that
 * belongs to someone else's plan.
 *
 * user_id, version and archived_at are set by the code
 * (`$user->plans()->make()`, SavePlan, PlanController), never mass-assigned.
 */
#[Fillable(['id', 'name', 'goal', 'notes'])]
class Plan extends Model
{
    /** @use HasFactory<PlanFactory> */
    use HasFactory, HasUuids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'archived_at' => 'datetime',
        ];
    }

    /**
     * The table's default, which a new model does not read back.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'version' => 1,
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Sorted in the relation, so that no read forgets it.
     *
     * @return HasMany<PlanDay, $this>
     */
    public function days(): HasMany
    {
        return $this->hasMany(PlanDay::class)->orderBy('position');
    }

    /**
     * Every item of every day, in one query: SavePlan uses it to find the
     * items a save may keep, move or delete.
     *
     * @return HasManyThrough<PlanItem, PlanDay, $this>
     */
    public function items(): HasManyThrough
    {
        return $this->hasManyThrough(PlanItem::class, PlanDay::class);
    }

    /**
     * @return HasMany<WorkoutSession, $this>
     */
    public function workoutSessions(): HasMany
    {
        return $this->hasMany(WorkoutSession::class);
    }

    /**
     * The day of the last finished workout of this plan; deleted workouts do
     * not count.
     */
    public function lastDoneDayId(): ?string
    {
        return $this->workoutSessions()->finished()->latest('started_at')->value('plan_day_id');
    }

    /**
     * The suggested day: the one after the last day done, wrapping to the
     * first. The first day when nothing was done yet or the last day done has
     * been deleted; null for a plan with no days. Home still offers every day.
     */
    public function suggestedDay(): ?PlanDay
    {
        $days = $this->days()->get()->values();
        // Outside the closure: inside, it would be one query per day
        $lastDoneId = $this->lastDoneDayId();
        $index = $days->search(fn (PlanDay $day) => $day->id === $lastDoneId);

        return $index === false ? $days->first() : ($days[$index + 1] ?? $days->first());
    }

    public function isOwnedBy(?User $user): bool
    {
        return $user !== null && $this->user_id === $user->id;
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    /**
     * The plan list shows either the archived plans or the others.
     *
     * @param  Builder<Plan>  $query
     */
    #[Scope]
    protected function archived(Builder $query, bool $archived = true): void
    {
        $archived ? $query->whereNotNull('archived_at') : $query->whereNull('archived_at');
    }

    /**
     * The plan list's order: the active plan first, then the most recently
     * changed. With no active plan the comparison is null for every row and
     * only the second order counts.
     *
     * @param  Builder<Plan>  $query
     * @param  string|null  $activePlanId  the user's active_plan_id
     */
    #[Scope]
    protected function activeFirst(Builder $query, ?string $activePlanId): void
    {
        $query->orderByRaw('(id = ?) desc nulls last', [$activePlanId])
            ->orderByDesc('updated_at')
            ->orderBy('id');
    }
}
