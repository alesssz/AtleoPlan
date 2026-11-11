<?php

// Imports: the base Migration class, the Blueprint that describes a table, and
// Schema, the facade that changes the database (docs/concepts/C2-backend.md C2.6)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `social_accounts`: one row for each outside account (a Google
 * account, later an Apple one) a user signs in with
 * (docs/design/D3-data-model.md D3.3.1, FEAT-9).
 *
 * A table of its own rather than a `google_id` column on `users`: Apple
 * later is new rows, not a new column, and a user who never uses Google
 * has nothing empty on their row. Created with
 * `php artisan make:model SocialAccount --migration --factory`
 * (docs/how-to/H1-database.md H1.18).
 */
return new class extends Migration
{
    /**
     * Creates the table.
     */
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            // A plain auto-incrementing id: these rows are made on the
            // server only, never on a phone offline (D3.2.1)
            $table->id();

            // Whose account it is. foreignId('user_id') makes a bigint
            // column and constrained() works out the table `users` from the
            // name. cascadeOnDelete(): deleting the user deletes these rows
            // too (D3.7.4). index() before constrained(), which returns
            // another object (D3.2.6)
            $table->foreignId('user_id')->index()->constrained()->cascadeOnDelete();

            // Which service: only the values of App\Enums\SocialProvider.
            // enum() is a text column with a check constraint on Postgres
            // (D3.2.4)
            $table->enum('provider', ['google']);

            // The service's own id of the person: for Google the `sub` of its
            // answer, a string of about 21 digits. Never the email, which a
            // person can change on Google's side
            $table->string('provider_user_id');

            // created_at (when it was linked) and updated_at
            $table->timestamps();

            // One Google account belongs to one user: the same pair twice is
            // refused by Postgres. It is also the index of the lookup made at
            // every sign-in, "which user has this Google id?"
            $table->unique(['provider', 'provider_user_id']);
        });
    }

    /**
     * Deletes the table again (`make artisan c="migrate:rollback"`).
     */
    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
    }
};
