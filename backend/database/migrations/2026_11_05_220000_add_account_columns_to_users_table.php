<?php

// Imports: the base Migration class, the Blueprint that describes a table, and
// Schema, the facade that changes the database (docs/05-backend.md 5.6)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds to `users` what sign-in and the preferences need (every column
 * explained in docs/06-data-model.md 6.3). `active_plan_id` comes later, with
 * the `plans` table it points to (FEAT-2).
 *
 * The file returns an anonymous class: Laravel creates it and calls up() to
 * apply the change, or down() to undo it. Schema::table() changes an existing
 * table, where Schema::create() would make a new one.
 */
return new class extends Migration
{
    /**
     * Adds the columns. Each default fills the rows that already exist, and
     * any new row that does not set its own value.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Opens the Filament panel. Never fillable from a request
            // (app/Models/User.php), or anyone could make themselves an admin
            $table->boolean('is_admin')->default(false);
            // Filled when an admin disables the account: sign-in is then refused
            $table->timestampTz('disabled_at')->nullable();
            // The interface's language. enum() is a text column with a check
            // constraint on Postgres: only these values are accepted
            $table->enum('locale', ['it', 'en', 'es', 'de'])->default('en');
            // Saved on the account, so it follows the user to another device
            $table->enum('theme', ['dark', 'light', 'system'])->default('dark');
            // Which unit weights are shown in; they are always stored in kg (6.2.3)
            $table->enum('weight_unit', ['kg', 'lb'])->default('kg');
            // Rest between sets when a plan item sets none
            $table->integer('default_rest_seconds')->default(90);
            // The stepper's step in workout mode, in the user's unit. decimal
            // is exact: 5 digits, 2 of them after the point
            $table->decimal('weight_step', 5, 2)->default(2.5);
            // What happens when the rest timer ends
            $table->boolean('timer_sound')->default(true);
            $table->boolean('timer_vibration')->default(true);
        });
    }

    /**
     * Removes the columns again (`make artisan c="migrate:rollback"`).
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'is_admin',
                'disabled_at',
                'locale',
                'theme',
                'weight_unit',
                'default_rest_seconds',
                'weight_step',
                'timer_sound',
                'timer_vibration',
            ]);
        });
    }
};
