<?php

namespace App\Models;

// Imports: the attributes and traits used below, and the types of the
// relations
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
 * A workout plan: one row of `plans`, the top of the four levels
 * plan → days → items → sets (docs/design/D3-data-model.md D3.5).
 *
 * Loading a whole plan is one line, and one query per level, whatever the
 * number of rows ("eager loading", docs/concepts/C2-backend.md C2.5.2):
 *
 *     Plan::with('days.items.sets')->find($id);
 *
 * HasUuids: the id is a UUID. Laravel creates one (a UUIDv7, which sorts by
 * creation time) only when the id is empty, so an id created on the device
 * is kept; that is why `id` is in Fillable (D3.2.1). Accepting the device's
 * id means checking who owns it: StorePlanRequest refuses an id that is
 * someone else's plan.
 *
 * Fillable has what the plan editor sends. user_id, version and archived_at
 * are set by the code: `$user->plans()->make()`, SavePlan, PlanController.
 */
#[Fillable(['id', 'name', 'goal', 'notes'])]
class Plan extends Model
{
    /** @use HasFactory<PlanFactory> */
    use HasFactory, HasUuids;

    /**
     * The casts (what a cast is: app/Models/User.php): archived_at becomes a
     * date object; version a whole number.
     *
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
     * The values a new plan gets before it is saved: the table has the same
     * default, but a new model does not read it back (Exercise::$attributes).
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'version' => 1,
    ];

    /**
     * Whose plan it is.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The days, in their order. orderBy() inside the relation: rows have no
     * order of their own, so every read of the days sorts them (D3.2.7).
     *
     * @return HasMany<PlanDay, $this>
     */
    public function days(): HasMany
    {
        return $this->hasMany(PlanDay::class)->orderBy('position');
    }

    /**
     * Every item of every day, skipping the level in between: a "has many
     * through" relation. It reads plan_items joined to plan_days, so
     * `$plan->items()->pluck('id')` is one query. SavePlan uses it to find
     * the items a save may keep, move or delete.
     *
     * @return HasManyThrough<PlanItem, PlanDay, $this>
     */
    public function items(): HasManyThrough
    {
        return $this->hasManyThrough(PlanItem::class, PlanDay::class);
    }

    /**
     * The workouts done following this plan (docs/design/D3-data-model.md D3.6.1).
     *
     * @return HasMany<WorkoutSession, $this>
     */
    public function workoutSessions(): HasMany
    {
        return $this->hasMany(WorkoutSession::class);
    }

    /**
     * The id of the day done in the last finished workout of this plan, or
     * null when none was done yet. Deleted workouts do not count.
     */
    public function lastDoneDayId(): ?string
    {
        // latest('started_at'): the most recent first; value(): one column
        // of the first row, with no model built
        return $this->workoutSessions()->finished()->latest('started_at')->value('plan_day_id');
    }

    /**
     * The suggested day (docs/design/D2-decisions.md D2.8): the one after the
     * last day done, in the plan's order, back to the first after the last.
     * The first day when nothing was done yet, or when the last day done has
     * been deleted since. Null for a plan with no days.
     *
     * It is only a suggestion: Home shows every day, and the choice is the
     * user's (docs/design/D1-ui.md D1.4.2).
     */
    public function suggestedDay(): ?PlanDay
    {
        // The days in order; the relation sorts them by position
        $days = $this->days()->get()->values();
        // Read once, here: inside the function below it would be one query per day
        $lastDoneId = $this->lastDoneDayId();
        // search(): the index of the first day the function accepts, or false
        $index = $days->search(fn (PlanDay $day) => $day->id === $lastDoneId);

        // `$days[$index + 1] ?? …`: the next day, or the first when the last
        // was the last of the plan
        return $index === false ? $days->first() : ($days[$index + 1] ?? $days->first());
    }

    /**
     * Whether it is this user's plan.
     *
     * @param  User|null  $user  the user asking; null owns nothing
     */
    public function isOwnedBy(?User $user): bool
    {
        return $user !== null && $this->user_id === $user->id;
    }

    /**
     * Whether it is archived.
     */
    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    /**
     * Only archived plans, or only the others: the list shows one or the
     * other (docs/design/D1-ui.md D1.4.6). A query scope (what a scope is:
     * app/Models/Exercise.php, visibleTo()).
     *
     * @param  Builder<Plan>  $query  the query being built
     * @param  bool  $archived  true: the archived ones; false: the others
     */
    #[Scope]
    protected function archived(Builder $query, bool $archived = true): void
    {
        $archived ? $query->whereNotNull('archived_at') : $query->whereNull('archived_at');
    }

    /**
     * The order of the plan list: this plan first (the active one), then the
     * most recently changed (D1.4.6).
     *
     * `(id = ?) desc`: the comparison is true for one row and false for the
     * others, and true sorts first in descending order. With no active plan
     * the comparison is empty for every row, and only the second order counts.
     *
     * @param  Builder<Plan>  $query  the query being built
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
