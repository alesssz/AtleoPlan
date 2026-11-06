<?php

/**
 * Who may open the Filament panel at /admin: admins only, in every environment
 * (User::canAccessPanel(), docs/concepts/C2-backend.md C2.8).
 */

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('lets an admin in', function () {
    $this->actingAs(User::factory()->admin()->create())->get('/admin')->assertOk();
});

it('refuses a normal user', function () {
    $this->actingAs(User::factory()->create())->get('/admin')->assertForbidden();
});

it('refuses a disabled admin', function () {
    $this->actingAs(User::factory()->admin()->disabled()->create())->get('/admin')->assertForbidden();
});

it('sends a visitor to the panel login page', function () {
    $this->get('/admin')->assertRedirect('/admin/login');
});
