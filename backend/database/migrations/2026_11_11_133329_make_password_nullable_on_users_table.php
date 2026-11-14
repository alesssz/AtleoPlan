<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Someone who signs up with Google has no password until they set one with
 * Forgot password. A null hash never matches, so password sign-in is refused
 * for such an account, by Fortify and by the admin panel alike
 * (tests/Feature/Auth/GoogleSignInTest.php).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Fails while any user has no password, rightly: rolling back would
     * otherwise have to invent passwords.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable(false)->change();
        });
    }
};
