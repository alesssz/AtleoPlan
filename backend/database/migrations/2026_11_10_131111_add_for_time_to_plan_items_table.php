<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "As fast as possible": the reps are fixed and the time taken is the result,
 * such as 50 push-ups.
 *
 * On the plan item, not on the exercise: the same push-ups are done for reps
 * one day and for time another, and keep one history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plan_items', function (Blueprint $table) {
            $table->boolean('for_time')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('plan_items', function (Blueprint $table) {
            $table->dropColumn('for_time');
        });
    }
};
