<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Accounts made before addresses were confirmed count as confirmed, from the
 * day they were made, so nobody is stopped at "Confirm your email" for an
 * account they already use. Only development data existed then.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->whereNull('email_verified_at')->update(['email_verified_at' => DB::raw('created_at')]);
    }

    /**
     * Nothing: which accounts were confirmed this way is not recorded.
     */
    public function down(): void
    {
        //
    }
};
