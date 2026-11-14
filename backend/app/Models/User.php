<?php

namespace App\Models;

use App\Enums\Locale;
use App\Enums\Theme;
use App\Enums\WeightUnit;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * A person who can sign in: an athlete using the app, or an admin of the
 * Filament panel at /admin.
 *
 * is_admin, disabled_at and active_plan_id are not fillable: no request can
 * make someone an admin, re-enable an account or point to another user's plan.
 */
#[Fillable(['name', 'email', 'password', 'locale', 'theme', 'weight_unit', 'default_rest_seconds', 'weight_step', 'timer_sound', 'timer_vibration', 'show_rpe'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements FilamentUser, HasLocalePreference
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * weight_step stays exact text, "2.50".
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'disabled_at' => 'datetime',
            'locale' => Locale::class,
            'theme' => Theme::class,
            'weight_unit' => WeightUnit::class,
            'default_rest_seconds' => 'integer',
            'weight_step' => 'decimal:2',
            'timer_sound' => 'boolean',
            'timer_vibration' => 'boolean',
            'show_rpe' => 'boolean',
        ];
    }

    /**
     * Admins whose account is not disabled.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->is_admin && $this->disabled_at === null;
    }

    /**
     * The user's personal exercises.
     *
     * @return HasMany<Exercise, $this>
     */
    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class, 'owner_id');
    }

    /**
     * @return HasMany<Plan, $this>
     */
    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }

    /**
     * Set only by PlanController::activate(), after PlanPolicy::activate().
     *
     * @return BelongsTo<Plan, $this>
     */
    public function activePlan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'active_plan_id');
    }

    /**
     * @return HasMany<WorkoutSession, $this>
     */
    public function workoutSessions(): HasMany
    {
        return $this->hasMany(WorkoutSession::class);
    }

    /**
     * Today a Google account or none. A user who signed up with Google has a
     * null password until they set one through Forgot password.
     *
     * @return HasMany<SocialAccount, $this>
     */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    /**
     * The language of emails sent to this user: the request that triggers one
     * may come from a browser in another language.
     */
    public function preferredLocale(): ?string
    {
        return $this->locale?->value;
    }
}
