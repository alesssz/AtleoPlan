<?php

/**
 * Error messages and emails arrive in the user's language.
 */

use App\Enums\Locale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

it('answers validation errors in the requested language', function (string $language, string $message) {
    $this->withHeader('Accept-Language', $language)
        ->postJson('/api/auth/register', [])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', $message);
})->with([
    ['it', 'Il campo email è obbligatorio.'],
    ['es', 'El campo correo es obligatorio.'],
    ['de', 'Das Feld E-Mail ist erforderlich.'],
    ['en', 'The email field is required.'],
    // Not one of ours: English
    ['fr', 'The email field is required.'],
]);

it('answers a wrong password in the requested language', function () {
    User::factory()->create(['email' => 'ann@example.com']);

    $this->withHeader('Accept-Language', 'it')
        ->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'wrong'])
        ->assertJsonPath('errors.email.0', 'Queste credenziali non corrispondono ai nostri dati.');
});

it('has every message in the three translated languages', function (string $language) {
    // Each key the app uses; __() gives the key back when a translation is missing
    $keys = [
        'auth.failed', 'auth.disabled', 'auth.throttle',
        'passwords.reset', 'passwords.sent', 'passwords.throttled', 'passwords.token', 'passwords.user',
        'validation.confirmed', 'validation.email', 'validation.enum', 'validation.max.string',
        'validation.min.string', 'validation.required', 'validation.string', 'validation.unique',
        // The exercise editor's (StoreExerciseRequest)
        'validation.array', 'validation.distinct', 'validation.exists', 'validation.integer',
        'validation.max.array', 'validation.regex', 'validation.url',
    ];

    foreach ($keys as $key) {
        // Different from the key and from English: a real translation, not a fallback
        expect(__($key, [], $language))->not->toBe($key)->not->toBe(__($key, [], 'en'));
    }

    // The fields' names. They are read as one array, because __() would take
    // the dots of `muscles.*.role` for levels of the file
    $attributes = __('validation.attributes', [], $language);
    $english = __('validation.attributes', [], 'en');
    foreach (['youtube_url', 'logging_type', 'equipment_id', 'aliases.*', 'muscles.*.id', 'muscles.*.role'] as $field) {
        expect($attributes)->toHaveKey($field)
            ->and($attributes[$field])->not->toBe($english[$field] ?? null);
    }
})->with(['it', 'es', 'de']);

it('writes the password email in the language of the account, whatever the request asks', function () {
    $user = User::factory()->create(['locale' => Locale::It]);

    // The real email, through the whole notification system; the `array`
    // mailer (phpunit.xml) keeps it in memory
    $this->withHeader('Accept-Language', 'en')
        ->postJson('/api/auth/forgot-password', ['email' => $user->email])
        ->assertOk();

    $sent = Mail::mailer('array')->getSymfonyTransport()->messages()->last();
    $html = $sent->getOriginalMessage()->getHtmlBody();

    expect($sent->getOriginalMessage()->getSubject())->toBe('Reimposta la password')
        ->and($html)
        ->toContain('Ciao!')
        ->toContain('A presto,')
        ->not->toContain('Regards')
        ->not->toContain('trouble clicking');
});
