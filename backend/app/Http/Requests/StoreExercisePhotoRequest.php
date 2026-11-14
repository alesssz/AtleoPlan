<?php

namespace App\Http\Requests;

use App\Actions\Exercises\ExercisePhotos;
use App\Models\Exercise;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

/**
 * POST /api/exercises/{exercise}/photos: one photo, multipart field `photo`.
 *
 * JPEG, PNG or WebP, at most 10 MB, at most ExercisePhotos::MAX per exercise.
 * No HEIC: GD cannot read it, and an iPhone's browser sends a JPEG unless the
 * form asks for HEIC.
 *
 * Like every request here, no authorize(): the controller asks the policy.
 */
class StoreExercisePhotoRequest extends FormRequest
{
    /**
     * File::image() judges the content, not the name; max() is in kilobytes.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'photo' => ['required', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max(10 * 1024)],
        ];
    }

    /**
     * One photo over the limit is refused on the `photo` field, like any
     * other error.
     *
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            $exercise = $this->route('exercise');

            if ($exercise instanceof Exercise && $exercise->getMedia('photos')->count() >= ExercisePhotos::MAX) {
                $validator->errors()->add('photo', __('validation.too_many_photos', ['max' => ExercisePhotos::MAX]));
            }
        }];
    }
}
