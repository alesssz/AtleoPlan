<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * The development database (`make fresh`). The public exercise library comes
 * from outside and has its own command, `make exercises-import`; tests seed
 * nothing and use factories.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * The fixed lists first, since exercises point to them; then the
     * development account, test@example.com with password `password`, an admin.
     */
    public function run(): void
    {
        $this->call([
            MuscleSeeder::class,
            EquipmentSeeder::class,
        ]);

        User::factory()->admin()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
