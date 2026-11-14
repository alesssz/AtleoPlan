<?php

namespace App\Actions\Workouts;

use App\Http\Resources\PlanResource;
use App\Http\Resources\WorkoutSessionResource;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\User;
use App\Models\WorkoutSession;

/**
 * Everything Home shows, in one answer, for GET /api/home:
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
 * - **The suggested day** is Plan::suggestedDay(); `last_day` gives "last time
 *   you did Day 1".
 * - **The estimated duration** of a day is worked out, never stored: each set
 *   counts SET_SECONDS of work plus its exercise's rest (the user's default
 *   when the exercise has none). An estimate, which is all Home needs.
 * - **The session left open** is the most recent one not finished: Home offers
 *   to resume it. Two phones offline may each have opened one.
 * - **The recent sessions** are the finished ones of the last 8 days, with
 *   their totals: the app picks this week's in the device's own time zone, for
 *   the week strip and its numbers. Eight days cover a whole week in any zone.
 */
class HomeSummary
{
    /** A set's work in the estimate, rest excluded. */
    public const SET_SECONDS = 40;

    private const RECENT_DAYS = 8;

    /**
     * @return array<string, mixed> what GET /api/home sends in `data`
     */
    public function for(User $user): array
    {
        // Enough to count and estimate, without the exercises themselves
        $plan = $user->activePlan()->withCount('days')->with('days.items.sets')->first();
        $suggested = $plan?->suggestedDay();
        $lastDayId = $plan?->lastDoneDayId();
        $open = $user->workoutSessions()->finished(false)->latest('started_at')->first();

        return [
            // Without its days, which follow in Home's own shape; days_count stays
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
     * In whole minutes, at least 1 for a day with sets.
     *
     * @param  int  $defaultRest  the user's rest, for an item that sets none
     */
    private function estimatedMinutes(PlanDay $day, int $defaultRest): int
    {
        $seconds = $day->items->sum(fn (PlanItem $item) => $item->sets->count() * (self::SET_SECONDS + ($item->rest_seconds ?? $defaultRest)));

        return $seconds === 0 ? 0 : max(1, (int) round($seconds / 60));
    }

    /**
     * "Last time you did Day 1".
     *
     * @return array{id: string, name: string|null, finished_at: mixed}
     */
    private function lastDay(string $planId, string $dayId): array
    {
        // The session's day_name: the name at the time
        $session = WorkoutSession::query()
            ->where('plan_id', $planId)->where('plan_day_id', $dayId)
            ->finished()->latest('started_at')->first(['day_name', 'finished_at']);

        return ['id' => $dayId, 'name' => $session?->day_name, 'finished_at' => $session?->finished_at];
    }
}
