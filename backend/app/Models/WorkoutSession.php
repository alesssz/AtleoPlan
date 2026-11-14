<?php

namespace App\Models;

use App\Enums\SetType;
use Database\Factories\WorkoutSessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Query\Builder as QueryBuilder;

/**
 * A workout: its exercises are SessionExercise rows, their sets LoggedSet rows.
 *
 * - The id is made on the phone and kept; SaveWorkoutSession checks that a
 *   known id is the user's own.
 * - Soft-deleted: a phone that sends a session again after it was deleted
 *   elsewhere finds it deleted and does not bring it back. Every question about
 *   history starts from this model, so deleted sessions are always left out.
 *
 * user_id is set by the code, never from a request.
 */
#[Fillable(['id', 'plan_id', 'plan_day_id', 'plan_name', 'day_name', 'started_at', 'finished_at', 'duration_seconds', 'feeling', 'notes'])]
class WorkoutSession extends Model
{
    /** @use HasFactory<WorkoutSessionFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'duration_seconds' => 'integer',
            'feeling' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Null for a free workout, or once the plan is deleted.
     *
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Null for a free workout, or once the day is deleted.
     *
     * @return BelongsTo<PlanDay, $this>
     */
    public function planDay(): BelongsTo
    {
        return $this->belongsTo(PlanDay::class);
    }

    /**
     * Not exercises(): each row is an exercise as done in this session, which
     * points to an Exercise of the library.
     *
     * @return HasMany<SessionExercise, $this>
     */
    public function sessionExercises(): HasMany
    {
        return $this->hasMany(SessionExercise::class)->orderBy('position');
    }

    public function isOpen(): bool
    {
        return $this->finished_at === null;
    }

    /**
     * @param  Builder<WorkoutSession>  $query
     */
    #[Scope]
    protected function finished(Builder $query, bool $finished = true): void
    {
        $finished ? $query->whereNotNull('finished_at') : $query->whereNull('finished_at');
    }

    /**
     * Adds four totals, computed by Postgres and never stored:
     *
     * - `exercises_done`: exercises with at least one set;
     * - `sets_done`: sets, warm-ups excluded;
     * - `reps_done`: their reps, bodyweight sets included, which is what the
     *   screens show;
     * - `volume_kg`: weight × reps, warm-ups excluded. Still sent, but no
     *   screen shows it as a workout's total: it adds up unlike exercises and
     *   misses bodyweight work.
     *
     * Correlated subqueries: one query for a whole page of sessions, summed
     * exactly on numeric values.
     *
     * @param  Builder<WorkoutSession>  $query
     */
    #[Scope]
    protected function withTotals(Builder $query): void
    {
        $sets = fn (QueryBuilder $q) => $q->from('logged_sets')
            ->join('session_exercises', 'session_exercises.id', '=', 'logged_sets.session_exercise_id')
            ->whereColumn('session_exercises.workout_session_id', 'workout_sessions.id')
            ->where('logged_sets.set_type', '!=', SetType::WarmUp->value);

        // addSelect() alone would replace the default `select *`
        $query->select('workout_sessions.*')
            ->selectSub(fn (QueryBuilder $q) => $q->from('session_exercises')
                ->selectRaw('count(*)')
                ->whereColumn('session_exercises.workout_session_id', 'workout_sessions.id')
                ->whereExists(fn (QueryBuilder $s) => $s->from('logged_sets')
                    ->whereColumn('logged_sets.session_exercise_id', 'session_exercises.id')), 'exercises_done')
            ->selectSub(fn (QueryBuilder $q) => $sets($q)->selectRaw('count(*)'), 'sets_done')
            // coalesce: a session with only timed sets has 0 reps, not null
            ->selectSub(fn (QueryBuilder $q) => $sets($q)->selectRaw('coalesce(sum(logged_sets.reps), 0)'), 'reps_done')
            ->selectSub(fn (QueryBuilder $q) => $sets($q)->selectRaw('coalesce(sum(logged_sets.weight_kg * logged_sets.reps), 0)'), 'volume_kg');
    }
}
