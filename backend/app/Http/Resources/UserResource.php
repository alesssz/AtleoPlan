<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of the signed-in user, as the React app receives it
 * (frontend/src/api/auth.ts holds the matching TypeScript type).
 *
 * An API Resource decides which columns leave the server and how they are
 * named (docs/05-backend.md 5.5). Listing them one by one means a new column,
 * such as a secret, stays private until someone adds it here. Laravel wraps the
 * answer in a `data` key: { "data": { "id": 1, … } }.
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * The fields to send.
     *
     * `$this->name` reads the wrapped user's column (the @mixin line above
     * tells editors so). Enums become their plain string in JSON.
     *
     * @param  Request  $request  the current request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'is_admin' => $this->is_admin,
            'locale' => $this->locale,
            'theme' => $this->theme,
            'weight_unit' => $this->weight_unit,
            'default_rest_seconds' => $this->default_rest_seconds,
            'weight_step' => $this->weight_step,
            'timer_sound' => $this->timer_sound,
            'timer_vibration' => $this->timer_vibration,
        ];
    }
}
