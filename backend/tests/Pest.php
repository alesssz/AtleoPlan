<?php

/**
 * Pest's setup file, loaded before every test run (docs/concepts/C2-backend.md C2.11).
 *
 * Pest is the test runner, built on PHPUnit: a test is written as
 * `it('does something', function () { ... })` instead of a class with test
 * methods, and checks values with `expect($value)->toBe(...)`. Both styles
 * run side by side: the two ExampleTest.php files are PHPUnit classes. Tests
 * run with `make test` (`php artisan test`), on the separate `atleoplan_test`
 * database set in phpunit.xml (docs/start/S1-setup.md S1.6).
 */

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
| Here: in every test under tests/Feature, `$this` is a Tests\TestCase, which
| boots the Laravel app and adds its helpers ($this->getJson(), database
| assertions...). Tests under tests/Unit get plain PHPUnit, with no Laravel.
|
| RefreshDatabase, if enabled, would run the migrations and roll back each
| test's changes for every Feature test; it is left off, so a test that
| touches the database adds `uses(RefreshDatabase::class);` itself.
|
*/

pest()->extend(TestCase::class)
 // ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
| Pest's example of a custom expectation: `expect($n)->toBeOne()`. Inside the
| function `$this` is the expectation, so it reuses the built-in toBe().
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

/**
 * Pest's placeholder for a shared test helper; unused.
 */
function something()
{
    // ..
}
