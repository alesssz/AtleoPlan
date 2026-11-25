<?php

namespace App\Rules;

use App\Actions\Exercises\ExercisePhotos;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * At most ExercisePhotos::MAX_PIXELS. The bytes are not enough: a PNG of a
 * few megabytes can declare 20,000 × 20,000 pixels, which GD would need
 * gigabytes to open, on upload and in the queue's conversions.
 * getimagesize() reads only the header. What it cannot read passes: the image
 * rules beside this one refuse it.
 */
class PhotoPixels implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            return;
        }

        [$width, $height] = @getimagesize($value->getRealPath()) ?: [0, 0];

        if ($width * $height > ExercisePhotos::MAX_PIXELS) {
            $fail('validation.photo_too_large')->translate(['max' => ExercisePhotos::MAX_PIXELS / 1_000_000]);
        }
    }
}
