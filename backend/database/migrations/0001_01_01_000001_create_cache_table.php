<?php

/**
 * Creates the tables of Laravel's database cache store. Shipped with Laravel;
 * comments added.
 *
 * The cache keeps values that are slow to compute or fetch for a while, e.g.
 * `Cache::remember('key', 60, fn () => ...)`. With the `database` store
 * (the default of a new Laravel app) they are kept in these tables, so the
 * app needs no Redis (docs/05-backend.md 5.10). How migrations work: see the
 * header of 0001_01_01_000000_create_users_table.php and docs/05-backend.md 5.6.
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
     * database's schema builder) creates each table from the columns added to
     * the Blueprint $table.
     */
    public function up(): void
    {
        // One row per cached value
        Schema::create('cache', function (Blueprint $table) {
            // The cache key, unique
            $table->string('key')->primary();
            // The value, serialized to text by Laravel
            $table->mediumText('value');
            // Unix time after which the value is stale; indexed to purge fast
            $table->bigInteger('expiration')->index();
        });

        // Atomic locks (Cache::lock): stop two processes doing the same work
        // at the same time, e.g. two queue workers on one job
        Schema::create('cache_locks', function (Blueprint $table) {
            // The lock's name
            $table->string('key')->primary();
            // A random token of the process holding it, so only it can release it
            $table->string('owner');
            // Unix time when the lock frees itself if never released
            $table->bigInteger('expiration')->index();
        });
    }

    /**
     * Reverse the migrations.
     *
     * Called by `php artisan migrate:rollback`: deletes both tables.
     */
    public function down(): void
    {
        Schema::dropIfExists('cache');
        Schema::dropIfExists('cache_locks');
    }
};
