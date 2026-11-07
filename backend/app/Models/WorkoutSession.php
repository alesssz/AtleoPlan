<?php

namespace App\Models;

// Imports: the enum of the set types, the attributes and traits used below,
// the query builders, and the types of the relations
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
 * One workout: one row of `workout_sessions` (docs/design/D3-data-model.md
 * D3.6.1). Its exercises are SessionExercise rows, their sets LoggedSet rows.
 *
 * - HasUuids: the id is a UUID made on the phone, and kept (app/Models/Plan.php
 *   explains the trait). `id` is in Fillable for that reason, and the action
 *   that saves a session checks that a known id is the user's own
 *   (SaveWorkoutSession).
 * - SoftDeletes: delete() fills deleted_at. A phone that sends a session
 *   again after it was deleted elsewhere finds it deleted and does not bring
 *   it back (D3.7.3). Queries on this model leave deleted sessions out, so
 *   every question about history starts from here (D3.11).
 *
 * user_id is set by the code, never from a request.
 */
#[Fillable(['id', 'plan_id', 'plan_day_id', 'plan_name', 'day_name', 'started_at', 'finished_at', 'duration_seconds', 'feeling', 'notes'])]
class WorkoutSession extends Model
{
    /** @use HasFactory<WorkoutSessionFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The casts: the moments become date objects, the numbers whole numbers.
     *
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
     * Whose workout it is.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The plan it followed; null for a free workout, or once the plan is deleted.
     *
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * The day of the plan it followed; null the same way.
     *
     * @return BelongsTo<PlanDay, $this>
     */
    public function planDay(): BelongsTo
    {
        return $this->belongsTo(PlanDay::class);
    }

    /**
     * The exercises done, in order. Named sessionExercises(), not
     * exercises(), because each row is an exercise *as done in this session*,
     * not an Exercise of the library (it points to one).
     *
     * @return HasMany<SessionExercise, $this>
     */
    public function sessionExercises(): HasMany
    {
        return $this->hasMany(SessionExercise::class)->orderBy('position');
    }

    /**
     * Whether it is still in progress.
     */
    public function isOpen(): bool
    {
        return $this->finished_at === null;
    }

    /**
     * Only the finished sessions, or only those still in progress.
     *
     * @param  Builder<WorkoutSession>  $query  the query being built
     * @param  bool  $finished  true: finished; false: in progress
     */
    #[Scope]
    protected function finished(Builder $query, bool $finished = true): void
    {
        $finished ? $query->whereNotNull('finished_at') : $query->whereNull('finished_at');
    }

    /**
     * Adds three totals to each session, worked out by the database, never
     * stored (docs/design/D3-data-model.md D3.8):
     *
     * - `exercises_done`: exercises with at least one set;
     * - `sets_done`: sets, warm-ups excluded;
     * - `volume_kg`: weight × reps, warm-ups excluded, in kilograms.
     *
     * Each is a subquery in the SELECT: `(select sum(…) from logged_sets join
     * session_exercises … where session_exercises.workout_session_id =
     * workout_sessions.id) as volume_kg`. One query for a whole page of
     * sessions, and exact: the sum happens in Postgres, on numeric values.
     *
     * @param  Builder<WorkoutSession>  $query  the query being built
     */
    #[Scope]
    protected function withTotals(Builder $query): void
    {
        // The sets of this session, warm-ups excluded: the start of two of
        // the subqueries. `fn (QueryBuilder $q)` receives a fresh query
        $sets = fn (QueryBuilder $q) => $q->from('logged_sets')
            ->join('session_exercises', 'session_exercises.id', '=', 'logged_sets.session_exercise_id')
            ->whereColumn('session_exercises.workout_session_id', 'workout_sessions.id')
            // ->value: the plain string the column holds (D3.11)
            ->where('logged_sets.set_type', '!=', SetType::WarmUp->value);

        // select('workout_sessions.*') first: addSelect() alone would replace
        // the default `select *`
        $query->select('workout_sessions.*')
            ->selectSub(fn (QueryBuilder $q) => $q->from('session_exercises')
                ->selectRaw('count(*)')
                ->whereColumn('session_exercises.workout_session_id', 'workout_sessions.id')
                // whereExists(): only exercises with at least one set
                ->whereExists(fn (QueryBuilder $s) => $s->from('logged_sets')
                    ->whereColumn('logged_sets.session_exercise_id', 'session_exercises.id')), 'exercises_done')
            ->selectSub(fn (QueryBuilder $q) => $sets($q)->selectRaw('count(*)'), 'sets_done')
            // coalesce(…, 0): a session with no sets weighs 0, not null
            ->selectSub(fn (QueryBuilder $q) => $sets($q)->selectRaw('coalesce(sum(logged_sets.weight_kg * logged_sets.reps), 0)'), 'volume_kg');
    }
}
