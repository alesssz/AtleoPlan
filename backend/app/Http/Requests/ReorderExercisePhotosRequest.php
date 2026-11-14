<?php

namespace App\Http\Requests;

use App\Models\Exercise;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * PUT /api/exercises/{exercise}/photos: the photos' ids in their new order, the
 * cover first:
 *
 *     { "ids": [14, 12, 13] }
 */
class ReorderExercisePhotosRequest extends FormRequest
{
    /**
     * `present`, not `required`: an empty list is the right order for an
     * exercise with no photos.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'ids' => ['present', 'array'],
            'ids.*' => ['integer', 'distinct'],
        ];
    }

    /**
     * Exactly the exercise's photos: none missing, none of another exercise.
     *
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            // Only once `ids` is known to be a list of numbers
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // Sorted, to compare them as sets
            $exercise = $this->route('exercise');
            $current = $exercise instanceof Exercise ? $exercise->getMedia('photos')->pluck('id')->sort()->values()->all() : [];
            $sent = collect($this->input('ids'))->map(fn ($id) => (int) $id)->sort()->values()->all();

            if ($current !== $sent) {
                $validator->errors()->add('ids', __('validation.photo_order'));
            }
        }];
    }
}
