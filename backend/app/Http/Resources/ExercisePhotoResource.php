<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * One photo of an exercise:
 *
 *     { "id": 12, "url": "/storage/12/conversions/0-large.webp",
 *       "thumb_url": "/storage/12/conversions/0-thumb.webp" }
 *
 * - `url`, for the exercise's page: the `large` conversion, at most 1600 px;
 * - `thumb_url`, for lists and workout mode: the `thumb`, at most 400 px.
 *
 * Conversions are queued (Exercise::registerMediaConversions()); until one
 * exists, its address is the original's, so the app shows the photo at once,
 * only heavier for a few seconds.
 *
 * @mixin Media
 */
class ExercisePhotoResource extends JsonResource
{
    /**
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
     * @param  string  $conversion  thumb or large
     */
    private function conversionUrl(string $conversion): string
    {
        $photo = $this->resource;

        return $photo->hasGeneratedConversion($conversion) ? $photo->getUrl($conversion) : $photo->getUrl();
    }

    /**
     * "http://localhost:8000/storage/1/0.jpg" → "/storage/1/0.jpg".
     *
     * medialibrary builds URLs from APP_URL, which inside the container is not
     * the address the browser uses. A path works everywhere, because the app
     * and the files share one origin: Vite forwards /storage in development
     * (vite.config.ts), Caddy in production. The same origin also lets the
     * service worker keep the photos offline.
     *
     * @return string the path, or the URL unchanged when it has none
     */
    public static function pathOf(string $url): string
    {
        return parse_url($url, PHP_URL_PATH) ?: $url;
    }
}
