<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The signed-in user (frontend/src/api/auth.ts holds the matching type).
 * Fields are listed one by one, so a new column stays private until it is
 * added here.
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'is_admin' => $this->is_admin,
            // Profile links to the panel only when this is set
            'admin_url' => $this->is_admin ? config('app.admin_url') : null,
            'locale' => $this->locale,
            'theme' => $this->theme,
            'weight_unit' => $this->weight_unit,
            'default_rest_seconds' => $this->default_rest_seconds,
            'weight_step' => $this->weight_step,
            'timer_sound' => $this->timer_sound,
            'timer_vibration' => $this->timer_vibration,
            'show_rpe' => $this->show_rpe,
        ];
    }
}
