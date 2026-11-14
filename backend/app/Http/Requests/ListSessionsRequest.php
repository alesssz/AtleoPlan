<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * GET /api/sessions:
 *
 *     /api/sessions                    all, the most recent first
 *     /api/sessions?status=open        those still in progress (Home's banner)
 *     /api/sessions?status=finished    history
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
        ];
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 20);
    }
}
