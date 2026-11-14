<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The outside accounts a user signs in with. A table rather than a `google_id`
 * column: Apple later is new rows, not a new column.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            // A plain number: made on the server only
            $table->id();

            $table->foreignId('user_id')->index()->constrained()->cascadeOnDelete();

            $table->enum('provider', ['google']);

            // Google's `sub`. Never the email, which can change on Google's side
            $table->string('provider_user_id');

            $table->timestamps();

            // One outside account per user; also the index of the lookup at
            // every sign-in
            $table->unique(['provider', 'provider_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
    }
};
