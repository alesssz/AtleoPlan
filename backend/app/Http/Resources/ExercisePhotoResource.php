<?php

namespace App\Http\Resources;

// Imports: medialibrary's model of a file, the request, and Laravel's base resource
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * One photo of an exercise, as JSON (docs/concepts/C2-backend.md C2.5.9):
 *
 *     { "id": 12, "url": "/storage/12/conversions/0-large.webp",
 *       "thumb_url": "/storage/12/conversions/0-thumb.webp" }
 *
 * - `url`, for the exercise's page: the `large` conversion, at most 1600 px;
 * - `thumb_url`, for lists and workout mode: the `thumb`, at most 400 px.
 *
 * The conversions are made by a queued job a moment after the upload
 * (Exercise::registerMediaConversions()). Until one exists, its address is the
 * original's: the app shows the photo at once, heavier for a few seconds.
 * hasGeneratedConversion() reads the row's `generated_conversions`, which the
 * job fills in.
 *
 * A JsonResource wraps one object and says how it becomes JSON
 * (docs/concepts/C2-backend.md C2.5); here the object is a row of `media`,
 * reached as `$this->resource`. Generated with `make:resource ExercisePhotoResource`.
 * ExerciseResource sends one per photo, and POST /api/exercises/{id}/photos
 * answers with one.
 *
 * `$this->id` reads the Media's id: a resource passes any property it does
 * not have to the object it wraps. `@mixin Media` tells the editor and
 * static analysis so, for their completion and checks.
 *
 * @mixin Media
 */
class ExercisePhotoResource extends JsonResource
{
    /**
     * The photo's fields.
     *
     * @param  Request  $request  the current request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => self::pathOf($this->conversionUrl('large')),
            'thumb_url' => self::pathOf($this->conversionUrl('thumb')),
        ];
    }

    /**
     * A conversion's URL when it has been made, the original's otherwise.
     *
     * @param  string  $conversion  the conversion's name: thumb or large
     */
    private function conversionUrl(string $conversion): string
    {
        // $this->resource: the Media row this resource wraps
        $photo = $this->resource;

        return $photo->hasGeneratedConversion($conversion) ? $photo->getUrl($conversion) : $photo->getUrl();
    }

    /**
     * The path of a URL, without its scheme and host:
     * "http://localhost:8000/storage/1/0.jpg" → "/storage/1/0.jpg".
     *
     * medialibrary builds a photo's URL from APP_URL, the address Laravel
     * believes it has. Inside the container that is localhost:8000, while the
     * browser reaches Laravel at localhost:8500, through Vite at 5673: a full
     * URL would point to the wrong place. A path works everywhere, because the
     * React app and the files share one address: Vite forwards /storage to
     * Laravel in development (vite.config.ts), Caddy in production
     * (docs/design/D2-decisions.md D2.6). It also keeps the photos on the app's
     * own address, which the service worker will need to keep them offline.
     *
     * Moved here from ExerciseResource, which used it for the same photos.
     * parse_url() splits a URL into its parts; PHP_URL_PATH asks for the path.
     *
     * @param  string  $url  a full URL
     * @return string the path, or the URL as it was when it has none
     */
    public static function pathOf(string $url): string
    {
        return parse_url($url, PHP_URL_PATH) ?: $url;
    }
}
