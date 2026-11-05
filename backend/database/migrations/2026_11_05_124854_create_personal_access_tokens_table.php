<?php

/**
 * Creates Sanctum's `personal_access_tokens` table: the API tokens of clients
 * that cannot use the session cookie, such as the future mobile app
 * (docs/02-decisions.md 2.2, docs/05-backend.md 5.7).
 *
 * The React app does not need it: in Sanctum's SPA mode it signs in with the
 * session cookie (bootstrap/app.php). A model gets tokens with Sanctum's
 * HasApiTokens trait (`$user->createToken('phone')`), which User does not use
 * yet. Added by `php artisan install:api`; comments added. How migrations
 * work: see the header of 0001_01_01_000000_create_users_table.php and
 * docs/05-backend.md 5.6. Already applied, so it must stay as it is: a change
 * is a new migration.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The migration is an anonymous class (a class with no name), returned to Laravel
return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Schema::create (a facade: a static-looking call Laravel passes to the
     * database's schema builder) creates the table from the columns added to
     * the Blueprint $table.
     */
    public function up(): void
    {
        // One row per token
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            // Who owns the token, as a "polymorphic" link that can point to
            // any model: tokenable_type (the class, e.g. App\Models\User) and
            // tokenable_id (its id), with an index on the pair
            $table->morphs('tokenable');
            // A label chosen when creating it, e.g. the device's name
            $table->text('name');
            // The SHA-256 hash of the token (64 hex characters); the token
            // itself is shown once, at creation, and never stored
            $table->string('token', 64)->unique();
            // What the token may do, as a JSON list (e.g. ["*"] = everything)
            $table->text('abilities')->nullable();
            // Last use, and an optional expiry date (indexed, to purge
            // expired tokens)
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            // created_at and updated_at
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * Called by `php artisan migrate:rollback`: deletes the table and the tokens.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
