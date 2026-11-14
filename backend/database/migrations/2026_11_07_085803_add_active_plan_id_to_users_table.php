<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The user's one active plan. A column on the user rather than
 * `plans.is_active`: one cell cannot hold two plans, and switching is one
 * update. That the plan is the user's and not archived is
 * PlanPolicy::activate()'s check.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Deleting the plan empties the cell and keeps the user
            $table->foreignUuid('active_plan_id')->nullable()->index()->constrained('plans')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('active_plan_id');
        });
    }
};
