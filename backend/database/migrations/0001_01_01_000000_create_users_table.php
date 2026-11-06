<?php

/**
 * Creates the tables for accounts and sign-in: users, password reset tokens
 * and sessions. Shipped with Laravel; comments added.
 *
 * A migration is a versioned change to the database's structure, written in
 * PHP instead of SQL (docs/concepts/C2-backend.md C2.6). `php artisan migrate` (or
 * `make migrate`) runs, in file-name order, the ones not run yet, and records
 * each in the `migrations` table. The 0001_01_01 prefix makes Laravel's own
 * migrations run before the app's, which carry their creation date.
 *
 * Once a migration has run anywhere, it is never edited: the change would not
 * reach the databases where it already ran. A change is a new migration
 * (docs/project/P1-conventions.md P1.2).
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// `new class extends Migration { ... }` creates an object of a class with no
// name (an anonymous class), and the file returns it to Laravel's migrator.
// Unnamed, two migrations can never clash over a class name.
return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Called by `php artisan migrate`. Schema is a facade: a class whose static
     * calls (Schema::create) are passed to an object Laravel builds for us,
     * here the schema builder of the current database connection. The function
     * given to Schema::create receives a Blueprint, the description of the new
     * table: each `$table->...()` call adds a column of that type, and Laravel
     * turns it into Postgres' CREATE TABLE.
     */
    public function up(): void
    {
        // One row per account; read and written by the User model
        // (app/Models/User.php)
        Schema::create('users', function (Blueprint $table) {
            // `id`: auto-incrementing big integer, the primary key
            $table->id();
            $table->string('name');
            // string() is a VARCHAR(255); unique() refuses two equal emails
            $table->string('email')->unique();
            // When the email was confirmed; nullable() allows "not yet" (NULL)
            $table->timestamp('email_verified_at')->nullable();
            // The password's hash, never the password (User's `hashed` cast)
            $table->string('password');
            // remember_token: the "remember me" cookie's secret, nullable
            $table->rememberToken();
            // created_at and updated_at, filled in by Eloquent on every save
            $table->timestamps();
        });

        // "Forgot password": one pending reset link per email
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            // The email is the primary key, so one token per address
            $table->string('email')->primary();
            // The hash of the token sent in the email link
            $table->string('token');
            // When it was sent, to make old links expire
            $table->timestamp('created_at')->nullable();
        });

        // Sign-in sessions, when the session is stored in the database (the
        // default driver): the React app (Sanctum SPA mode) and the Filament
        // panel both keep the signed-in user here (docs/concepts/C2-backend.md C2.7)
        Schema::create('sessions', function (Blueprint $table) {
            // The random session id, also the value of the session cookie
            $table->string('id')->primary();
            // Who is signed in, NULL for a visitor; foreignId() is a big
            // integer meant to hold a users.id, index() makes lookups fast
            $table->foreignId('user_id')->nullable()->index();
            // 45 characters fit the longest IPv6 address in text form
            $table->string('ip_address', 45)->nullable();
            // The browser that opened the session, e.g. to show where one is signed in
            $table->text('user_agent')->nullable();
            // The session's data, serialized and encoded by Laravel
            $table->longText('payload');
            // Unix time of the last request, used to delete expired sessions
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     *
     * Called by `php artisan migrate:rollback`: undoes up(), deleting the
     * three tables and their data.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
