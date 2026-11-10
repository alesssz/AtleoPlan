<?php

/**
 * App\Support\SearchText (docs/design/D3-data-model.md D3.4.6): how the
 * exercises' search text and the user's words are normalised, so that case,
 * accents, dashes and dots do not matter.
 *
 * A unit test (tests/Unit): plain Pest functions, no Laravel booted and no
 * database (tests/Pest.php binds Laravel's TestCase to tests/Feature only).
 * SearchText uses only Illuminate\Support\Str, which works without the app.
 */

use App\Support\SearchText;

it('normalises text: lower case, no accents, one space between words', function () {
    expect(SearchText::normalize('Pull-Up'))->toBe('pull up')
        ->and(SearchText::normalize('  pull   up '))->toBe('pull up')
        ->and(SearchText::normalize('Klimmzüge'))->toBe('klimmzuge')
        ->and(SearchText::normalize('Ápice'))->toBe('apice')
        ->and(SearchText::normalize("Dall'alto 3/4"))->toBe('dall alto 3 4')
        ->and(SearchText::normalize(' - '))->toBe('');
});

it('builds an exercise\'s search text from every name and alias, each once', function () {
    $text = SearchText::forExercise(
        ['en' => 'Pullups', 'it' => 'Trazioni alla sbarra', 'de' => 'Klimmzüge'],
        ['it' => ['trazioni presa prona', 'pull-up'], 'de' => ['Pull up']],
    );

    // "Pull up" (de) is the same as "pull-up" (it) once normalised: kept once
    expect($text)->toBe('pullups | trazioni alla sbarra | klimmzuge | trazioni presa prona | pull up');
});

it('accepts an exercise with no aliases', function () {
    expect(SearchText::forExercise(['en' => 'Plank'], []))->toBe('plank');
});

it('cuts a search into normalised words, ignoring punctuation on its own', function () {
    expect(SearchText::words('  Squat   jump '))->toBe(['squat', 'jump'])
        ->and(SearchText::words('pull-up'))->toBe(['pull', 'up'])
        ->and(SearchText::words('squat, paused'))->toBe(['squat', 'paused'])
        ->and(SearchText::words('%'))->toBe([])
        ->and(SearchText::words(''))->toBe([]);
});
