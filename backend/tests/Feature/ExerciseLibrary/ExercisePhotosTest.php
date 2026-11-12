<?php

/**
 * The photos of a personal exercise (BE-1, docs/concepts/C2-backend.md
 * C2.5.9): adding one, its conversions, the limits, removing one, the order,
 * and who may do it; then Duplicate as mine, which copies the photos too.
 *
 * Fixtures: Storage::fake('public') replaces the disk the photos go to with
 * an empty one in a temporary folder, so no file reaches storage/app/public;
 * UploadedFile::fake()->image() makes a real, small JPEG or PNG for each
 * upload. The queue runs jobs at once in the tests (QUEUE_CONNECTION=sync,
 * phpunit.xml), so the conversions exist as soon as the request ends.
 */

// Imports: the models, the seeder of the muscles, the trait that empties the
// database, Laravel's fake upload, the Storage facade, and the type of a
// test's response
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\User;
use Database\Seeders\MuscleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;

uses(RefreshDatabase::class);

// Before each test: an empty fake disk, and Ann signed in with an exercise of her own
beforeEach(function () {
    Storage::fake('public');
    $this->ann = User::factory()->create();
    $this->mine = Exercise::factory()->for($this->ann, 'owner')->create();
    $this->actingAs($this->ann);
});

/**
 * Uploads one fake photo to an exercise, as the React app does.
 *
 * postJson() cannot send a file; post() with an UploadedFile sends a
 * multipart form, and the Accept header asks for JSON answers and errors.
 *
 * @param  Exercise  $exercise  where to add it
 * @param  UploadedFile|null  $file  the file; a 1200 × 900 JPEG when null
 */
function uploadPhoto(Exercise $exercise, ?UploadedFile $file = null): TestResponse
{
    return test()->post("/api/exercises/{$exercise->id}/photos", ['photo' => $file ?? UploadedFile::fake()->image('IMG_4032.JPG', 1200, 900)], ['Accept' => 'application/json']);
}

describe('adding', function () {
    it('adds a photo, answering with the original, then sends its two conversions', function () {
        // The answer: the new photo, as it is before the queue converts it
        $response = uploadPhoto($this->mine)->assertCreated();

        // The row medialibrary wrote
        $photo = $this->mine->fresh()->getFirstMedia('photos');

        expect($response->json('data.id'))->toBe($photo->id)
            // A path on the app's own address; the phone's name is replaced by ours
            ->and($response->json('data.url'))->toBe("/storage/{$photo->id}/photo.jpg")
            ->and($photo->file_name)->toBe('photo.jpg');

        // Read again, the exercise sends the WebP conversions the job made
        $this->getJson("/api/exercises/{$this->mine->id}")
            ->assertJsonPath('data.photos.0.url', "/storage/{$photo->id}/conversions/photo-large.webp")
            ->assertJsonPath('data.photos.0.thumb_url', "/storage/{$photo->id}/conversions/photo-thumb.webp");
        Storage::disk('public')->assertExists("{$photo->id}/conversions/photo-thumb.webp");
    });

    it('makes the thumbnail at most 400 px, keeping the proportions', function () {
        uploadPhoto($this->mine)->assertCreated();

        // The thumbnail's file, read from the fake disk
        $photo = $this->mine->fresh()->getFirstMedia('photos');
        [$width, $height] = getimagesize($photo->getPath('thumb'));

        expect([$width, $height])->toBe([400, 300]);
    });

    it('sends the photos with the exercise, first one first', function () {
        uploadPhoto($this->mine);
        uploadPhoto($this->mine);

        // The two photos, as the exercise's page reads them
        $photos = $this->getJson("/api/exercises/{$this->mine->id}")->assertOk()->json('data.photos');

        expect($photos)->toHaveCount(2)
            ->and($photos[0])->toHaveKeys(['id', 'url', 'thumb_url'])
            ->and($photos[0]['id'])->toBeLessThan($photos[1]['id']);
    });

    it('refuses what is not a photo it can read', function (UploadedFile $file) {
        uploadPhoto($this->mine, $file)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('photo');

        expect($this->mine->fresh()->getMedia('photos'))->toHaveCount(0);
    })->with([
        // GD cannot read HEIC, and an iPhone's browser sends a JPEG anyway (D2.5)
        'a HEIC photo' => fn () => UploadedFile::fake()->create('IMG_1.heic', 500, 'image/heic'),
        'a PDF' => fn () => UploadedFile::fake()->create('plan.pdf', 100, 'application/pdf'),
        // size() is in kilobytes: 11 MB, over the 10 MB of D2.5
        'a photo over 10 MB' => fn () => UploadedFile::fake()->image('big.jpg')->size(11 * 1024),
    ]);

    it('refuses a sixth photo, with a message', function () {
        foreach (range(1, 5) as $n) {
            uploadPhoto($this->mine)->assertCreated();
        }

        uploadPhoto($this->mine)
            ->assertUnprocessable()
            ->assertJsonPath('errors.photo.0', 'An exercise can have at most 5 photos.');
    });
});

describe('ordering and removing', function () {
    it('puts the photos in a new order, the cover first', function () {
        // Three photos, by id in the order they were added
        $ids = collect(range(1, 3))->map(fn () => uploadPhoto($this->mine)->json('data.id'))->all();

        $this->putJson("/api/exercises/{$this->mine->id}/photos", ['ids' => [$ids[2], $ids[0], $ids[1]]])
            ->assertOk()
            ->assertJsonPath('data.0.id', $ids[2]);

        expect($this->mine->fresh()->getMedia('photos')->pluck('id')->all())->toBe([$ids[2], $ids[0], $ids[1]]);
    });

    it('refuses an order that leaves a photo out or adds another\'s', function () {
        // Two photos of Ann's exercise, and one of another exercise
        $ids = collect(range(1, 2))->map(fn () => uploadPhoto($this->mine)->json('data.id'))->all();
        $other = uploadPhoto(Exercise::factory()->for($this->ann, 'owner')->create())->json('data.id');

        $this->putJson("/api/exercises/{$this->mine->id}/photos", ['ids' => [$ids[0]]])
            ->assertUnprocessable()->assertJsonValidationErrors('ids');
        $this->putJson("/api/exercises/{$this->mine->id}/photos", ['ids' => [$ids[0], $other]])
            ->assertUnprocessable()->assertJsonValidationErrors('ids');
    });

    it('removes a photo with its files', function () {
        // A photo, and where its files are on the disk
        $id = uploadPhoto($this->mine)->json('data.id');

        $this->deleteJson("/api/exercises/{$this->mine->id}/photos/{$id}")->assertNoContent();

        expect($this->mine->fresh()->getMedia('photos'))->toHaveCount(0);
        Storage::disk('public')->assertMissing("{$id}/photo.jpg");
    });

    it('answers 404 for a photo of another exercise', function () {
        // A photo of another of Ann's exercises
        $other = Exercise::factory()->for($this->ann, 'owner')->create();
        $id = uploadPhoto($other)->json('data.id');

        $this->deleteJson("/api/exercises/{$this->mine->id}/photos/{$id}")->assertNotFound();

        expect($other->fresh()->getMedia('photos'))->toHaveCount(1);
    });
});

describe('who may', function () {
    it('refuses someone else\'s exercise and a public one', function (string $whose) {
        // Bob's exercise, or a public one
        $exercise = $whose === 'public'
            ? Exercise::factory()->create()
            : Exercise::factory()->for(User::factory(), 'owner')->create();

        // The policy says no to adding and to ordering (an empty list, valid
        // for an exercise with no photos, so the request reaches the policy)
        uploadPhoto($exercise)->assertForbidden();
        $this->putJson("/api/exercises/{$exercise->id}/photos", ['ids' => []])->assertForbidden();
    })->with(['public', 'someone else\'s']);

    it('answers 401 to a visitor', function () {
        auth()->logout();

        uploadPhoto($this->mine)->assertUnauthorized();
    });
});

describe('Duplicate as mine', function () {
    beforeEach(function () {
        $this->seed(MuscleSeeder::class);
    });

    it('copies a public exercise as mine, in my language, with its photos', function () {
        // A public exercise in English and Italian, with a muscle and a photo
        $public = Exercise::factory()->create([
            'name' => ['en' => 'Bench Press', 'it' => 'Panca piana'],
            'instructions' => ['en' => ['Lie down.'], 'it' => ['Sdraiati.']],
        ]);
        $public->muscles()->attach(Muscle::where('slug', 'chest')->value('id'), ['role' => 'primary']);
        $public->addMedia(UploadedFile::fake()->image('0.jpg', 800, 600))->toMediaCollection('photos');

        // The answer: the copy, read in Italian
        $response = $this->postJson("/api/exercises/{$public->id}/duplicate", [], ['Accept-Language' => 'it'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Panca piana')
            ->assertJsonPath('data.is_mine', true)
            ->assertJsonPath('data.muscles.0.slug', 'chest');

        // The copy, from the database
        $copy = Exercise::findOrFail($response->json('data.id'));
        expect($copy->owner_id)->toBe($this->ann->id)
            // One language only, as any personal exercise
            ->and($copy->getTranslations('name'))->toBe(['it' => 'Panca piana'])
            ->and($copy->getTranslation('instructions', 'it'))->toBe(['Sdraiati.'])
            // A photo of its own: another row, another file
            ->and($copy->getMedia('photos'))->toHaveCount(1)
            ->and($copy->getFirstMedia('photos')->id)->not->toBe($public->getFirstMedia('photos')->id);
    });

    it('falls back to English when my language is missing', function () {
        // A public exercise in English only
        $public = Exercise::factory()->create(['name' => ['en' => 'Plank']]);

        $this->postJson("/api/exercises/{$public->id}/duplicate", [], ['Accept-Language' => 'de'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Plank');
    });

    it('refuses my own exercise', function () {
        $this->postJson("/api/exercises/{$this->mine->id}/duplicate")->assertForbidden();
    });
});
