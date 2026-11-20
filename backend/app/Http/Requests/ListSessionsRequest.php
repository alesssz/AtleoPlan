<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * GET /api/sessions:
 *
 *     /api/sessions                    all, the most recent first
 *     /api/sessions?status=open        those still in progress (Home's banner)
 *     /api/sessions?status=finished    history
 *     …&from=2026-11-01T00:00:00+01:00&to=2026-11-20T00:00:00+01:00
 *                                      started in that span, the device's
 *                                      midnights; either end may be left out
 *     …&page=2&per_page=20
 */
class ListSessionsRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'in:open,finished'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', Rule::when($this->filled('from'), 'after:from')],
        ];
    }

    /**
     * In UTC, as SessionCalendarRequest::span().
     *
     * @return array{?CarbonImmutable, ?CarbonImmutable} the start, included, and the end, excluded; null where not asked
     */
    public function span(): array
    {
        $moment = fn (string $key) => $this->filled($key) ? CarbonImmutable::parse((string) $this->query($key))->utc() : null;

        return [$moment('from'), $moment('to')];
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 20);
    }
}
