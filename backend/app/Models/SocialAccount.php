<?php

namespace App\Models;

// Imports: the enum of the providers, the factory for tests, Eloquent's pieces
use App\Enums\SocialProvider;
use Database\Factories\SocialAccountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An outside account a user signs in with: today a Google account
 * (docs/design/D3-data-model.md D3.3.1, FEAT-9). One row of
 * `social_accounts`.
 *
 * An Eloquent model (docs/concepts/C2-backend.md C2.6): the table is the
 * class name in plural snake_case, so nothing needs to name it. Rows are made
 * by app/Actions/Auth/SignInWithSocialAccount.php, through the user:
 * `$user->socialAccounts()->create([...])`, which fills user_id by itself.
 *
 * Fillable: the two columns the action sets. user_id is not fillable, so no
 * array of data, even a mistaken one, can move an account to another user.
 */
#[Fillable(['provider', 'provider_user_id'])]
class SocialAccount extends Model
{
    // HasFactory adds SocialAccount::factory() for tests
    // (database/factories/SocialAccountFactory.php)
    /** @use HasFactory<SocialAccountFactory> */
    use HasFactory;

    /**
     * The column read as an enum: `$account->provider === SocialProvider::Google`.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'provider' => SocialProvider::class,
        ];
    }

    /**
     * The user this account signs in. A belongsTo: this table holds the
     * column, user_id, that points to the other.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
