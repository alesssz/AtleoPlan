<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * GET /api/sessions/calendar?from=2026-11-01T00:00:00+01:00&to=2026-12-01T00:00:00+01:00:
 * the moments are the device's start and end of the span shown, since a day
 * begins at midnight where the user is, which only the device knows.
 */
class SessionCalendarRequest extends FormRequest
{
    /**
     * A year in the device's time zone, plus a day for the hour a daylight
     * saving change adds and for a leap year: the answer has no pages, so its
     * size must stay bounded.
     */
    public const MAX_DAYS = 367;

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after:from'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }
                [$from, $to] = $this->span();
                $latest = $from->addDays(self::MAX_DAYS);
                if ($to->greaterThan($latest)) {
                    $validator->errors()->add('to', __('validation.before_or_equal', ['attribute' => 'to', 'date' => $latest->toIso8601String()]));
                }
            },
        ];
    }

    /**
     * In UTC: a query writes a date without its offset, so `+01:00` kept
     * would move the span by an hour.
     *
     * @return array{CarbonImmutable, CarbonImmutable} the start, included, and the end, excluded
     */
    public function span(): array
    {
        return [CarbonImmutable::parse((string) $this->query('from'))->utc(), CarbonImmutable::parse((string) $this->query('to'))->utc()];
    }
}
