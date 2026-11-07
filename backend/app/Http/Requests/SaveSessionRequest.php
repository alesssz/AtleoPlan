<?php

namespace App\Http\Requests;

// Imports: the enums it checks against, the model it reads, Laravel's base
// Form Request, the query builder of the rules' conditions, Rule, Unique (the
// type Rule::unique() returns), and the Validator the after-check receives
use App\Enums\LoggingType;
use App\Enums\SetType;
use App\Models\Exercise;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;
use Illuminate\Validation\Validator;

/**
 * Validates PUT /api/sessions/{session}: a whole workout, as the phone sends
 * it, often later and sometimes twice (docs/design/D3-data-model.md D3.6.5):
 *
 *     {
 *       "plan_id": "0192…", "plan_day_id": "0192…",
 *       "plan_name": "Push Pull Legs", "day_name": "Day A – Push",
 *       "started_at": "2026-11-09T18:00:00+01:00",
 *       "finished_at": "2026-11-09T19:02:00+01:00",
 *       "duration_seconds": 3540, "feeling": 4, "notes": null,
 *       "exercises": [
 *         {
 *           "id": "0192…", "exercise_id": 12, "plan_item_id": "0192…",
 *           "superset_group": null, "notes": null,
 *           "sets": [
 *             { "id": "0192…", "set_type": "warm_up", "weight_kg": 40, "reps": 10,
 *               "duration_seconds": null, "distance_meters": null,
 *               "completed_at": "2026-11-09T18:04:10+01:00" }
 *           ]
 *         }
 *       ]
 *     }
 *
 * - **The whole session, as for a plan** (PlanRequest): the order of the
 *   lists is the order; exercises and sets left out are deleted; `exercises`
 *   and `sets` must be present, even empty.
 * - **Every id is a UUID made on the phone**, and an id already used by
 *   another session is refused (its exercises' and sets' ids too). Whether
 *   the session itself is the user's is decided by SaveWorkoutSession: a
 *   known id of someone else is a 403, not a field error.
 * - **The plan, its day and its items are not checked here.** A workout must
 *   never be refused because the plan changed while it was being done,
 *   offline: SaveWorkoutSession keeps the links that still exist and are the
 *   user's, and empties the others (D3.7.1).
 * - **The values fit how the exercise is logged** (D3.6.3): reps for
 *   weight_reps and reps, with a weight that may be left out (a weighted
 *   exercise done with the body alone; a pull-up with or without added
 *   weight), a time or a distance. The rule spans two tables, so it is an
 *   after-check, below.
 *
 * The generated authorize() method was removed: permissions are checked by
 * SaveWorkoutSession and WorkoutSessionPolicy (docs/how-to/H2-backend.md H2.3.6).
 */
class SaveSessionRequest extends FormRequest
{
    /**
     * The fields each way of logging must fill (D3.6.3).
     *
     * @var array<string, list<string>>
     */
    private const REQUIRED_BY_LOGGING = [
        'weight_reps' => ['reps'],
        'reps' => ['reps'],
        'time' => ['duration_seconds'],
        'distance' => ['distance_meters'],
    ];

    /**
     * The fields each way of logging may fill or leave empty. The weight is
     * one: on weight_reps, empty for a set done with the body alone (lunges
     * without dumbbells); on reps, the added weight of a weighted pull-up or
     * dip, empty for the body alone. Any field in neither list must be empty.
     *
     * @var array<string, list<string>>
     */
    private const OPTIONAL_BY_LOGGING = [
        'weight_reps' => ['weight_kg'],
        'reps' => ['weight_kg'],
        'time' => [],
        'distance' => [],
    ];

    /**
     * The rules.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        // The prefix of a set's fields, to keep the lines short
        $set = 'exercises.*.sets.*.';

        return [
            // The plan and its day: only their format here (see above)
            'plan_id' => ['nullable', 'uuid'],
            'plan_day_id' => ['nullable', 'uuid'],
            'plan_name' => ['nullable', 'string', 'max:255'],
            'day_name' => ['nullable', 'string', 'max:255'],
            // date: any text PHP reads as a moment; the app sends ISO 8601
            // with the device's offset, which keeps the exact moment (D3.2.5)
            'started_at' => ['required', 'date'],
            'finished_at' => ['nullable', 'date', 'after_or_equal:started_at'],
            'duration_seconds' => ['nullable', 'integer', 'between:0,86400'],
            'feeling' => ['nullable', 'integer', 'between:1,5'],
            'notes' => ['nullable', 'string', 'max:2000'],

            'exercises' => ['present', 'array', 'max:50'],
            'exercises.*.id' => ['required', 'uuid', 'distinct', $this->freeIn('session_exercises')],
            // Public or the user's own; a deleted one too, as for a plan
            'exercises.*.exercise_id' => ['required', 'integer', Rule::exists('exercises', 'id')
                ->where(fn (Builder $query) => $query
                    ->whereNull('owner_id')
                    ->orWhere('owner_id', $this->user()->id))],
            'exercises.*.plan_item_id' => ['nullable', 'uuid'],
            'exercises.*.superset_group' => ['nullable', 'integer', 'between:1,99'],
            'exercises.*.notes' => ['nullable', 'string', 'max:500'],
            'exercises.*.sets' => ['present', 'array', 'max:50'],

            $set.'id' => ['required', 'uuid', 'distinct', $this->freeIn('logged_sets')],
            $set.'set_type' => ['required', Rule::enum(SetType::class)],
            $set.'weight_kg' => ['nullable', 'numeric', 'between:0,9999.999', 'decimal:0,3'],
            $set.'reps' => ['nullable', 'integer', 'between:0,9999'],
            $set.'duration_seconds' => ['nullable', 'integer', 'between:0,86400'],
            $set.'distance_meters' => ['nullable', 'integer', 'between:0,1000000'],
            $set.'completed_at' => ['required', 'date'],
        ];
    }

    /**
     * Checks that run after the rules: Laravel calls each function with the
     * validator, which may add errors. Here, the values of each set against
     * how its exercise is logged.
     *
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            // The exercises sent, as a list; anything else is the rules' job
            $exercises = $this->input('exercises');
            if (! is_array($exercises)) {
                return;
            }

            // How each exercise is logged, by id, in one query. Only whole
            // numbers reach the query: the rules have not stopped anything yet
            $ids = collect($exercises)->pluck('exercise_id')->filter(fn ($id) => is_int($id))->unique();
            // pluck('logging_type', 'id'): id => logging type, as a collection
            $loggingTypes = Exercise::withTrashed()->whereIn('id', $ids)->pluck('logging_type', 'id');

            foreach ($exercises as $e => $exercise) {
                // get(): null for an id that is missing or unknown, where
                // $loggingTypes[$id] would warn about an undefined key
                $type = is_array($exercise) ? $loggingTypes->get($exercise['exercise_id'] ?? null) : null;
                if (! $type instanceof LoggingType || ! is_array($exercise['sets'] ?? null)) {
                    continue;
                }
                // The value fields this exercise's sets must fill, and
                // those they may fill
                $required = self::REQUIRED_BY_LOGGING[$type->value];
                $optional = self::OPTIONAL_BY_LOGGING[$type->value];

                foreach ($exercise['sets'] as $s => $set) {
                    foreach (['weight_kg', 'reps', 'duration_seconds', 'distance_meters'] as $field) {
                        // The field's path, as in the rules' errors
                        $key = "exercises.{$e}.sets.{$s}.{$field}";
                        // What was sent for it; null when nothing was
                        $value = is_array($set) ? ($set[$field] ?? null) : null;
                        // getDisplayableAttribute(): the field's name in the
                        // request's language, from lang/*/validation.php
                        $name = $validator->getDisplayableAttribute($key);
                        if (in_array($field, $required, true) && $value === null) {
                            $validator->errors()->add($key, __('validation.required', ['attribute' => $name]));
                        } elseif (! in_array($field, $required, true) && ! in_array($field, $optional, true) && $value !== null) {
                            $validator->errors()->add($key, __('validation.logged_value_mismatch', ['attribute' => $name]));
                        }
                    }
                }
            }
        }];
    }

    /**
     * The rule for an exercise's or a set's id: not used by another session.
     *
     * Rows of the session in the URL do not count, so sending a session again
     * is fine. Exercises point to the session directly; sets through their
     * exercise, hence the subquery.
     *
     * @param  string  $table  session_exercises or logged_sets
     */
    private function freeIn(string $table): Unique
    {
        // Refused when any row of the table has this id…
        $rule = Rule::unique($table, 'id');
        // The session in the URL; only a real UUID reaches a query
        $sessionId = (string) $this->route('session');
        if (! Str::isUuid($sessionId)) {
            return $rule;
        }

        return $table === 'session_exercises'
            ? $rule->whereNot('workout_session_id', $sessionId)
            : $rule->where(fn (Builder $query) => $query
                ->whereNotIn('session_exercise_id', fn (Builder $exercises) => $exercises
                    ->select('id')->from('session_exercises')->where('workout_session_id', $sessionId)));
    }
}
