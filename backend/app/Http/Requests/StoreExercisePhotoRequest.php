<?php

namespace App\Http\Requests;

// Imports: the action (for its limit), the exercise model, Laravel's base
// class of a Form Request, the File rule, and the validator
use App\Actions\Exercises\ExercisePhotos;
use App\Models\Exercise;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

/**
 * The rules of POST /api/exercises/{exercise}/photos: one photo, sent as a
 * multipart form with the field `photo` (docs/concepts/C2-backend.md C2.5.9).
 *
 * A Form Request validates before the controller runs
 * (docs/concepts/C2-backend.md C2.5). Generated with
 * `make:request StoreExercisePhotoRequest`; its generated `authorize()`, which
 * answered false, was removed: the controller asks the policy
 * (docs/how-to/H2-backend.md H2.3.6).
 *
 * The limits of docs/design/D2-decisions.md D2.5: JPEG, PNG or WebP, at most
 * 10 MB, at most 5 photos per exercise. No HEIC: GD cannot read it, and an
 * iPhone's browser converts a photo to JPEG when the form does not ask for
 * HEIC.
 */
class StoreExercisePhotoRequest extends FormRequest
{
    /**
     * The rules.
     *
     * File::image(): an image, judged by the file's content, not by its
     * name; types() narrows it to these extensions; max() is in kilobytes.
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
     * Checks that run after the rules: the sixth photo is refused, with the
     * error on the `photo` field like any other.
     *
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            // The exercise of the URL: route('exercise') reads the route's
            // parameter, already turned into the model by route model binding
            $exercise = $this->route('exercise');

            if ($exercise instanceof Exercise && $exercise->getMedia('photos')->count() >= ExercisePhotos::MAX) {
                // __(): the message of lang/<language>/validation.php in the
                // request's language; :max in it is replaced by the number
                $validator->errors()->add('photo', __('validation.too_many_photos', ['max' => ExercisePhotos::MAX]));
            }
        }];
    }
}
