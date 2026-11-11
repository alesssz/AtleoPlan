<?php

// Imports: the base Migration class, the Blueprint that describes a table, and
// Schema, the facade that changes the database (docs/concepts/C2-backend.md C2.6)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets `users.password` be empty: someone who signs up with Google has no
 * password (docs/design/D3-data-model.md D3.3, FEAT-9). They can set one later
 * with Forgot password.
 *
 * An empty password can never be matched: Hash::check() answers false when
 * the stored hash is empty, so signing in with an email and any password is
 * refused for such an account, by FortifyServiceProvider and by Filament's
 * login alike (tests/Feature/Auth/GoogleSignInTest.php checks it).
 */
return new class extends Migration
{
    /**
     * Changes the column. `->change()` at the end turns the line into an
     * ALTER of the existing column instead of a new one; the whole new
     * definition is written, because change() replaces it all: a string
     * (VARCHAR 255), now nullable. `make artisan c="migrate --pretend"` shows
     * the SQL first (docs/how-to/H1-database.md H1.18.2).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Makes the column required again. It fails while any user has no
     * password, which is right: rolling back would otherwise need to invent
     * passwords for them.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable(false)->change();
        });
    }
};
