<?php

namespace App\Http\Requests;

// Imports: the exercise model, Laravel's base class of a Form Request, and the validator
use App\Models\Exercise;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * The rules of PUT /api/exercises/{exercise}/photos: the new order of the
 * photos, as their ids, the cover first (docs/concepts/C2-backend.md C2.5.9):
 *
 *     { "ids": [14, 12, 13] }
 *
 * Generated with `make:request ReorderExercisePhotosRequest`, its
 * `authorize()` removed as in StoreExercisePhotoRequest.
 */
class ReorderExercisePhotosRequest extends FormRequest
{
    /**
     * The rules: a list of whole numbers, each once. `present` rather than
     * `required`: the field must be there, but may be an empty list, the
     * right order for an exercise with no photos (`required` refuses []).
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
     * The list must be exactly the exercise's photos: none missing, none of
     * another exercise. Otherwise a 422 on `ids`.
     *
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            // Only once the rules have passed: `ids` is then a list of numbers
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // The exercise of the URL (route() reads the route's parameter,
            // already the model), its photos' ids and the ids sent
            // (input('ids')), both sorted to compare them as sets
            $exercise = $this->route('exercise');
            $current = $exercise instanceof Exercise ? $exercise->getMedia('photos')->pluck('id')->sort()->values()->all() : [];
            $sent = collect($this->input('ids'))->map(fn ($id) => (int) $id)->sort()->values()->all();

            if ($current !== $sent) {
                $validator->errors()->add('ids', __('validation.photo_order'));
            }
        }];
    }
}
