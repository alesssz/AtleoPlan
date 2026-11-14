<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What sign-in and the preferences need.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Never fillable from a request (app/Models/User.php)
            $table->boolean('is_admin')->default(false);
            // Set by an admin; sign-in is then refused
            $table->timestampTz('disabled_at')->nullable();
            $table->enum('locale', ['it', 'en', 'es', 'de'])->default('en');
            // On the account, so it follows the user to another device
            $table->enum('theme', ['dark', 'light', 'system'])->default('dark');
            // Display only: weights are always stored in kg
            $table->enum('weight_unit', ['kg', 'lb'])->default('kg');
            // For plan items that set no rest
            $table->integer('default_rest_seconds')->default(90);
            // Workout mode's stepper, in the user's unit
            $table->decimal('weight_step', 5, 2)->default(2.5);
            $table->boolean('timer_sound')->default(true);
            $table->boolean('timer_vibration')->default(true);
        });
    }

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
