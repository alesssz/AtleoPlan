<?php

namespace App\Actions\Workouts;

// Imports: the resources it builds with, and the models it reads
use App\Http\Resources\PlanResource;
use App\Http\Resources\WorkoutSessionResource;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\User;
use App\Models\WorkoutSession;

/**
 * Everything Home shows, in one answer (docs/design/D1-ui.md D1.4.2), for
 * GET /api/home:
 *
 *     {
 *       "active_plan": { …PlanResource, without days… } or null,
 *       "days": [{ "id": "0192…", "name": "Day A – Push", "exercises": 5, "estimated_minutes": 62 }, …],
 *       "suggested_day_id": "0192…" or null,
 *       "last_day": { "id": "0192…", "name": "Day A – Push", "finished_at": "…" } or null,
 *       "open_session": { …WorkoutSessionResource… } or null,
 *       "recent_sessions": [{ …WorkoutSessionResource with totals… }, …]
 *     }
 *
 * - **The suggested day** is Plan::suggestedDay() (docs/design/D2-decisions.md
 *   D2.8); `last_day` gives "last time you did Day 1".
 * - **The estimated duration** of a day is worked out, never stored (D3.8):
 *   each set counts SET_SECONDS of work plus its exercise's rest (the user's
 *   default when the exercise has none). An estimate, which is all Home needs.
 * - **The session left open** is the most recent one not finished: Home offers
 *   to resume it. Two phones offline may each have opened one (D3.6.1).
 * - **The recent sessions** are the finished ones of the last 8 days, with
 *   their totals: the app picks this week's in the device's own time zone,
 *   for the week strip and its numbers (D3.2.5). Eight days cover a whole
 *   week in any zone.
 *
 * An action (docs/concepts/C2-backend.md C2.5.3): HomeController stays one line.
 */
class HomeSummary
{
    /** The time a set takes, rest excluded, in the estimate: 40 seconds. */
    public const SET_SECONDS = 40;

    /** How far back the recent sessions go, in days. */
    private const RECENT_DAYS = 8;

    /**
     * Builds Home's data for a user.
     *
     * @param  User  $user  the signed-in user
     * @return array<string, mixed> what GET /api/home sends in `data`
     */
    public function for(User $user): array
    {
        // The active plan with its days, each item and its sets: enough to
        // count and to estimate, without the exercises themselves.
        // withCount('days'): PlanResource's days_count
        $plan = $user->activePlan()->withCount('days')->with('days.items.sets')->first();
        // The day to suggest, and the id of the day done last; null without
        // an active plan. `?->` stops at null instead of failing
        $suggested = $plan?->suggestedDay();
        $lastDayId = $plan?->lastDoneDayId();
        // The most recent session not finished, if any
        $open = $user->workoutSessions()->finished(false)->latest('started_at')->first();

        return [
            // withoutRelations(): a copy of the plan without its days, so
            // the resource sends the summary only; Home lists the days below,
            // in its own shape. days_count, a column, stays
            'active_plan' => $plan ? new PlanResource($plan->withoutRelations()) : null,
            'days' => $plan ? $plan->days->map(fn (PlanDay $day) => [
                'id' => $day->id,
                'name' => $day->name,
                'exercises' => $day->items->count(),
                'estimated_minutes' => $this->estimatedMinutes($day, $user->default_rest_seconds),
            ])->values() : [],
            'suggested_day_id' => $suggested?->id,
            'last_day' => $lastDayId === null ? null : $this->lastDay($plan->id, $lastDayId),
            'open_session' => $open ? new WorkoutSessionResource($open) : null,
            'recent_sessions' => WorkoutSessionResource::collection(
                $user->workoutSessions()->finished()->withTotals()
                    ->where('started_at', '>=', now()->subDays(self::RECENT_DAYS))
                    ->latest('started_at')
                    ->get(),
            ),
        ];
    }

    /**
     * A day's estimated duration, in whole minutes, at least 1 for a day with
     * sets.
     *
     * @param  PlanDay  $day  the day, with its items and their sets loaded
     * @param  int  $defaultRest  the user's rest, for an item that sets none
     */
    private function estimatedMinutes(PlanDay $day, int $defaultRest): int
    {
        // sum(fn): adds up what the function gives for each item
        $seconds = $day->items->sum(fn (PlanItem $item) => $item->sets->count() * (self::SET_SECONDS + ($item->rest_seconds ?? $defaultRest)));

        // intdiv(…, 60) would drop the half minutes; round() keeps the nearest
        return $seconds === 0 ? 0 : max(1, (int) round($seconds / 60));
    }

    /**
     * The day done last time, with when: "last time you did Day 1".
     *
     * @param  string  $planId  the active plan's id
     * @param  string  $dayId  the day done last
     * @return array{id: string, name: string|null, finished_at: mixed}
     */
    private function lastDay(string $planId, string $dayId): array
    {
        // The session itself: its day_name is the name *at the time*
        $session = WorkoutSession::query()
            ->where('plan_id', $planId)->where('plan_day_id', $dayId)
            ->finished()->latest('started_at')->first(['day_name', 'finished_at']);

        return ['id' => $dayId, 'name' => $session?->day_name, 'finished_at' => $session?->finished_at];
    }
}
