<?php

// Imports: the base Migration class, the Blueprint that describes a table, and
// Schema, the facade that changes the database (docs/concepts/C2-backend.md C2.6)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds `plan_items.for_time`: the exercise is done "as fast as possible",
 * its reps a fixed amount and the time taken the result, such as 50
 * push-ups (docs/design/D3-data-model.md D3.5.3, D1.4.8). In workout mode
 * its sets are timed with the stopwatch, and saved with both the reps and
 * the seconds (D3.6.3).
 *
 * On the plan's item, not on the exercise: the same push-ups are done for
 * reps on one day and for time on another, and stay one exercise, with one
 * history.
 */
return new class extends Migration
{
    /**
     * Adds the column; false for every item already there.
     */
    public function up(): void
    {
        Schema::table('plan_items', function (Blueprint $table) {
            $table->boolean('for_time')->default(false);
        });
    }

    /**
     * Removes it again (`make artisan c="migrate:rollback"`).
     */
    public function down(): void
    {
        Schema::table('plan_items', function (Blueprint $table) {
            $table->dropColumn('for_time');
        });
    }
};
