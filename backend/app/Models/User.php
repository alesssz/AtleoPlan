<?php

namespace App\Models;

// The namespace above places the class in App\Models, which Composer's
// autoloader maps to the app/Models folder (docs/05-backend.md 5.2).

// `use` at the top of a file imports a class by its full name, so the code
// below can write the short name (HasFactory instead of
// Illuminate\Database\Eloquent\Factories\HasFactory). `as` gives the import
// another name: Laravel's base User class is called Authenticatable here so it
// does not clash with this class, also named User.
// The commented-out import below is Laravel's hint: uncommenting it and adding
// `implements MustVerifyEmail` to the class makes users confirm their email.
// use Illuminate\Contracts\Auth\MustVerifyEmail;
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
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * A person who can sign in: an athlete using the React app, or an admin of
 * the Filament panel at /admin.
 *
 * This is an Eloquent model: one class per database table, one object per row
 * (docs/05-backend.md 5.6). By convention the table is the class name in
 * plural snake_case, so User reads and writes the `users` table created in
 * database/migrations/0001_01_01_000000_create_users_table.php; the columns
 * become properties, e.g. `$user->email`. There is no list of columns here:
 * Eloquent asks the database.
 *
 * It extends Laravel's Authenticatable (a Model plus what sign-in needs:
 * password check, "remember me" token), which is what Sanctum's session login
 * and Filament's login page work with (docs/05-backend.md 5.7, 5.8).
 *
 * The two `#[...]` lines above the class are PHP attributes: labels the
 * framework reads to configure the class, here instead of writing
 * `protected $fillable = [...]` and `protected $hidden = [...]` properties.
 * - Fillable: the columns that may be set in bulk, e.g.
 *   `User::create($request->all())`. Any other key is ignored, so a visitor
 *   cannot slip in a column they should not control ("mass assignment").
 * - Hidden: the columns left out when the user is turned into JSON or an
 *   array, so an API answer never shows the password hash or the token.
 *
 * `is_admin` is not fillable on purpose: no request can make someone an admin.
 * Every column is explained in docs/06-data-model.md 6.3.
 *
 * `implements` promises that the class has the methods an interface lists
 * (docs/05-backend.md 5.2), which is how two packages learn about it:
 * - FilamentUser: canAccessPanel(), who may open the admin panel;
 * - HasLocalePreference: preferredLocale(), which language emails to this user
 *   are written in.
 */
#[Fillable(['name', 'email', 'password', 'locale', 'theme'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements FilamentUser, HasLocalePreference
{
    // `use` inside a class pulls in traits: bundles of methods copied into the
    // class (PHP has single inheritance; traits add behaviour sideways).
    // HasFactory adds User::factory() for tests and seeders
    // (database/factories/UserFactory.php); Notifiable adds $user->notify()
    // to send emails and other notifications.
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * A cast converts a column between its database form and a PHP value
     * every time it is read or written:
     * - email_verified_at comes back as a date object (Carbon) instead of a
     *   string, so `$user->email_verified_at->diffForHumans()` works;
     * - password is hashed automatically when assigned, so the plain password
     *   is never stored, whoever sets it;
     * - locale, theme and weight_unit become PHP enums (app/Enums/), so the code
     *   compares `Theme::Dark` rather than a bare string;
     * - weight_step stays exact: `decimal:2` gives the string "2.50", because a
     *   float would lose precision (docs/06-data-model.md 6.11).
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
        ];
    }

    /**
     * Whether this user may open a Filament panel (docs/05-backend.md 5.8):
     * admins whose account is not disabled.
     *
     * @param  Panel  $panel  the panel being opened; there is only /admin
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->is_admin && $this->disabled_at === null;
    }

    /**
     * The language of emails sent to this user, such as "reset your password".
     * Laravel asks for it before writing the email, because the request that
     * triggers it may come from a browser in another language.
     *
     * @return string|null the language code; null lets Laravel use the current one
     */
    public function preferredLocale(): ?string
    {
        return $this->locale?->value;
    }
}
