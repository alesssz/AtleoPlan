<?php

namespace Database\Factories;

// Imports: the enum of logging_type, the models used below, and Laravel's
// base Factory
use App\Enums\LoggingType;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake exercises for tests (what a factory is: UserFactory.php and
 * docs/how-to/H1-database.md H1.5).
 *
 * By default a public exercise, with no owner, no equipment and no muscles.
 * Tests add what they need:
 * - `Exercise::factory()->personal()->create()`: owned by a new user;
 * - `Exercise::factory()->for($user, 'owner')->create()`: owned by $user
 *   (for() fills a belongsTo relation, here owner());
 * - `Exercise::factory()->for($barbell)->create()`: with that equipment;
 * - `Exercise::factory()->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles')->create()`:
 *   with a row in exercise_muscle.
 *
 * @extends Factory<Exercise>
 */
class ExerciseFactory extends Factory
{
    /**
     * A public exercise with a two-word name in English and Italian.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Two random words, such as "Sit dolor"
        $name = ucfirst(fake()->words(2, true));

        return [
            'name' => ['en' => $name, 'it' => $name.' (it)'],
            // The same values as the table's defaults: a new model does not
            // read them back from the database (see Exercise::$attributes)
            'logging_type' => LoggingType::WeightReps,
            'machine_translated' => [],
        ];
    }

    /**
     * A personal exercise, owned by a new user: `Exercise::factory()->personal()`.
     *
     * A state: a named variation on definition() (UserFactory::admin() is
     * another). `User::factory()` as a value creates the user when the
     * exercise is created.
     */
    public function personal(): static
    {
        return $this->state(fn (array $attributes) => [
            'owner_id' => User::factory(),
        ]);
    }
}
