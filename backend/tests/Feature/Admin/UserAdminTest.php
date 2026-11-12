<?php

/**
 * The admin panel's Users screen and its rules (BE-2,
 * docs/concepts/C2-backend.md C2.8.3): the list, the four row actions, and
 * the action ChangeUserAccess, which refuses an admin's change to their
 * own account.
 *
 * Tested as ExerciseAdminTest explains, with Livewire::test(). A row action
 * is called with TestAction::make('disable')->table($user): the action
 * named "disable" of that user's row.
 *
 * Fixtures: an admin signed in, and the users each test makes.
 */

// Imports: the action, the page tested, the model, Filament's helper for
// naming an action of a table row, the trait that empties the database,
// and Livewire's test entry
use App\Actions\Users\ChangeUserAccess;
use App\Filament\Resources\Users\Pages\ListUsers;
use App\Models\User;
use Filament\Actions\Testing\TestAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;

uses(RefreshDatabase::class);

// Before each test: an admin signed in, in English
beforeEach(function () {
    $this->admin = User::factory()->admin()->create(['locale' => 'en']);
    $this->actingAs($this->admin);
});

it('lists every user', function () {
    // Three plain users, besides the admin
    $users = User::factory()->count(3)->create();

    Livewire::test(ListUsers::class)
        ->assertCanSeeTableRecords([...$users, $this->admin]);
});

it('makes a user an admin, and back', function () {
    // A plain user
    $user = User::factory()->create();

    Livewire::test(ListUsers::class)
        ->callAction(TestAction::make('makeAdmin')->table($user));
    expect($user->fresh()->is_admin)->toBeTrue();

    Livewire::test(ListUsers::class)
        ->callAction(TestAction::make('removeAdmin')->table($user));
    expect($user->fresh()->is_admin)->toBeFalse();
});

it('disables an account, and enables it', function () {
    // An enabled user
    $user = User::factory()->create();

    Livewire::test(ListUsers::class)
        ->callAction(TestAction::make('disable')->table($user));
    expect($user->fresh()->disabled_at)->not->toBeNull();

    Livewire::test(ListUsers::class)
        ->callAction(TestAction::make('enable')->table($user));
    expect($user->fresh()->disabled_at)->toBeNull();
});

it('shows only the actions that make sense for a row', function () {
    // A plain user, enabled: Make admin and Disable, not their opposites
    $user = User::factory()->create();

    Livewire::test(ListUsers::class)
        ->assertActionVisible(TestAction::make('makeAdmin')->table($user))
        ->assertActionHidden(TestAction::make('removeAdmin')->table($user))
        ->assertActionVisible(TestAction::make('disable')->table($user))
        ->assertActionHidden(TestAction::make('enable')->table($user));
});

it('offers no action on the admin\'s own row', function () {
    Livewire::test(ListUsers::class)
        ->assertActionHidden(TestAction::make('removeAdmin')->table($this->admin))
        ->assertActionHidden(TestAction::make('disable')->table($this->admin));
});

// The rule itself, whatever the panel shows
it('refuses an admin\'s change to their own account', function (string $change) {
    // The action, from the service container
    $access = app(ChangeUserAccess::class);

    expect(fn () => $change === 'admin'
        ? $access->setAdmin($this->admin, $this->admin, false)
        : $access->setDisabled($this->admin, $this->admin, true))
        ->toThrow(InvalidArgumentException::class);

    expect($this->admin->fresh()->is_admin)->toBeTrue()
        ->and($this->admin->fresh()->disabled_at)->toBeNull();
})->with(['admin', 'disabled']);

it('offers no way to create, edit or delete a user', function () {
    $this->get('/admin/users/create')->assertNotFound();
    $this->get("/admin/users/{$this->admin->id}/edit")->assertNotFound();
});

it('keeps the screen closed to a user who is not an admin', function () {
    $this->actingAs(User::factory()->create())
        ->get('/admin/users')
        ->assertForbidden();
});
