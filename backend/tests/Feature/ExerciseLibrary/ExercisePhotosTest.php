<?php

/**
 * The photos of a personal exercise: adding one, its conversions, the limits,
 * removing one, the order, and who may do it; their files, private and served
 * to their owner only; Duplicate as mine, which copies the photos too; moving
 * the photos uploaded while they were public; and the folders left by an
 * emptied database.
 *
 * The queue is synchronous in the tests (phpunit.xml), so the conversions
 * exist as soon as the request ends.
 */

use App\Actions\Exercises\ExercisePhotos;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\User;
use Database\Seeders\MuscleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    Storage::fake(ExercisePhotos::PRIVATE_DISK);
    $this->ann = User::factory()->create();
    $this->mine = Exercise::factory()->for($this->ann, 'owner')->create();
    $this->actingAs($this->ann);
});

/**
 * A multipart upload, as the React app sends it; postJson() cannot carry a
 * file.
 *
 * @param  UploadedFile|null  $file  a 1200 × 900 JPEG when null
 */
function uploadPhoto(Exercise $exercise, ?UploadedFile $file = null): TestResponse
{
    return test()->post("/api/exercises/{$exercise->id}/photos", ['photo' => $file ?? UploadedFile::fake()->image('IMG_4032.JPG', 1200, 900)], ['Accept' => 'application/json']);
}

/**
 * A 1200 × 900 JPEG as a phone writes one: an Exif block with the phone's
 * make and an orientation of 6, "turn a quarter clockwise to show". GD writes
 * no Exif, so the block is put in by hand, right after the JPEG's first
 * marker: a little-endian TIFF with two entries, Make and Orientation.
 */
function phoneJpeg(): UploadedFile
{
    $image = imagecreatetruecolor(1200, 900);
    ob_start();
    imagejpeg($image);
    $jpeg = (string) ob_get_clean();

    $make = "SecretPhone\0";
    $entries = pack('vvVV', 0x010F, 2, strlen($make), 38)     // Make, ASCII, at offset 38
        .pack('vvVvv', 0x0112, 3, 1, 6, 0);                    // Orientation, SHORT, 6
    $tiff = "II\x2A\x00".pack('V', 8).pack('v', 2).$entries.pack('V', 0).$make;
    $app1 = "\xFF\xE1".pack('n', 2 + 6 + strlen($tiff))."Exif\0\0".$tiff;

    return UploadedFile::fake()->createWithContent('IMG_4032.JPG', substr($jpeg, 0, 2).$app1.substr($jpeg, 2));
}

/**
 * A PNG that declares its size and holds nothing more: getimagesize() reads
 * only the header, and no test has to draw 100 million pixels.
 */
function pngClaiming(int $width, int $height): UploadedFile
{
    $chunk = fn (string $type, string $data) => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
    $png = "\x89PNG\r\n\x1A\n".$chunk('IHDR', pack('NNCCCCC', $width, $height, 8, 2, 0, 0, 0)).$chunk('IEND', '');

    return UploadedFile::fake()->createWithContent('huge.png', $png);
}

describe('adding', function () {
    it('adds a photo, answering with the original, then sends its two conversions', function () {
        // The answer: the new photo, as it is before the queue converts it
        $response = uploadPhoto($this->mine)->assertCreated();

        $photo = $this->mine->fresh()->getFirstMedia('photos');

        $base = "/api/exercises/{$this->mine->id}/photos/{$photo->id}";
        expect($response->json('data.id'))->toBe($photo->id)
            // A path on the app's own address
            ->and($response->json('data.url'))->toBe("{$base}/original")
            // The phone's name is replaced by ours
            ->and($photo->file_name)->toBe('photo.jpg');

        // Read again, the exercise sends the WebP conversions the job made
        $this->getJson("/api/exercises/{$this->mine->id}")
            ->assertJsonPath('data.photos.0.url', "{$base}/large")
            ->assertJsonPath('data.photos.0.thumb_url', "{$base}/thumb");
        // On the private disk, nothing on the public one
        Storage::disk(ExercisePhotos::PRIVATE_DISK)->assertExists("{$photo->id}/conversions/photo-thumb.webp");
        expect(Storage::disk('public')->allFiles())->toBe([]);
    });

    // Scenario: a photo taken on a phone, which records where it was taken.
    // The original is kept, so it must not keep that
    it('stores the photo without its metadata, turned as the metadata said', function () {
        // Kept in a variable: the fake file is deleted with its object
        $photo = phoneJpeg();
        expect(exif_read_data($photo->getRealPath()))->toHaveKey('Make')->toHaveKey('Orientation');

        uploadPhoto($this->mine, $photo)->assertCreated();

        $original = $this->mine->fresh()->getFirstMedia('photos')->getPath();
        expect(file_get_contents($original))->not->toContain('SecretPhone')
            ->and(@exif_read_data($original) ?: [])->not->toHaveKey('Make')
            // Upright: the quarter turn is in the pixels now
            ->and(array_slice(getimagesize($original), 0, 2))->toBe([900, 1200]);
    });

    it('refuses a photo of more pixels than it can open, before opening it', function () {
        uploadPhoto($this->mine, pngClaiming(10_000, 10_000))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['photo' => 'at most 50 megapixels']);

        expect($this->mine->fresh()->getMedia('photos'))->toHaveCount(0);
    });

    it('makes the thumbnail at most 400 px, keeping the proportions', function () {
        uploadPhoto($this->mine)->assertCreated();

        $photo = $this->mine->fresh()->getFirstMedia('photos');
        [$width, $height] = getimagesize($photo->getPath('thumb'));

        expect([$width, $height])->toBe([400, 300]);
    });

    it('sends the photos with the exercise, first one first', function () {
        uploadPhoto($this->mine);
        uploadPhoto($this->mine);

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
        // GD cannot read HEIC, and an iPhone's browser sends a JPEG anyway
        'a HEIC photo' => fn () => UploadedFile::fake()->create('IMG_1.heic', 500, 'image/heic'),
        'a PDF' => fn () => UploadedFile::fake()->create('plan.pdf', 100, 'application/pdf'),
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
        $ids = collect(range(1, 3))->map(fn () => uploadPhoto($this->mine)->json('data.id'))->all();

        $this->putJson("/api/exercises/{$this->mine->id}/photos", ['ids' => [$ids[2], $ids[0], $ids[1]]])
            ->assertOk()
            ->assertJsonPath('data.0.id', $ids[2]);

        expect($this->mine->fresh()->getMedia('photos')->pluck('id')->all())->toBe([$ids[2], $ids[0], $ids[1]]);
    });

    it('refuses an order that leaves a photo out or adds another\'s', function () {
        $ids = collect(range(1, 2))->map(fn () => uploadPhoto($this->mine)->json('data.id'))->all();
        $other = uploadPhoto(Exercise::factory()->for($this->ann, 'owner')->create())->json('data.id');

        $this->putJson("/api/exercises/{$this->mine->id}/photos", ['ids' => [$ids[0]]])
            ->assertUnprocessable()->assertJsonValidationErrors('ids');
        $this->putJson("/api/exercises/{$this->mine->id}/photos", ['ids' => [$ids[0], $other]])
            ->assertUnprocessable()->assertJsonValidationErrors('ids');
    });

    it('removes a photo with its files', function () {
        $id = uploadPhoto($this->mine)->json('data.id');

        $this->deleteJson("/api/exercises/{$this->mine->id}/photos/{$id}")->assertNoContent();

        expect($this->mine->fresh()->getMedia('photos'))->toHaveCount(0);
        Storage::disk(ExercisePhotos::PRIVATE_DISK)->assertMissing("{$id}/photo.jpg");
    });

    it('answers 404 for a photo of another exercise', function () {
        $other = Exercise::factory()->for($this->ann, 'owner')->create();
        $id = uploadPhoto($other)->json('data.id');

        $this->deleteJson("/api/exercises/{$this->mine->id}/photos/{$id}")->assertNotFound();

        expect($other->fresh()->getMedia('photos'))->toHaveCount(1);
    });
});

describe('who may', function () {
    it('refuses someone else\'s exercise and a public one', function (string $whose) {
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

describe('the files', function () {
    it('serves each size to the owner, as an image kept by no shared cache', function (string $size, string $type) {
        $id = uploadPhoto($this->mine)->json('data.id');

        $this->get("/api/exercises/{$this->mine->id}/photos/{$id}/{$size}")
            ->assertOk()
            ->assertHeader('Content-Type', $type)
            ->assertHeader('Cache-Control', 'max-age=604800, private')
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    })->with([['thumb', 'image/webp'], ['large', 'image/webp'], ['original', 'image/jpeg']]);

    // Scenario: someone loops over the photos' ids. Answered as if there
    // were none, whether the exercise has photos or not
    it('answers 404 to another user', function () {
        $id = uploadPhoto($this->mine)->json('data.id');
        $this->actingAs(User::factory()->create());

        $this->get("/api/exercises/{$this->mine->id}/photos/{$id}/thumb")->assertNotFound();
        $this->get("/api/exercises/{$this->mine->id}/photos/{$id}/original")->assertNotFound();
    });

    it('answers 401 to a visitor', function () {
        $id = uploadPhoto($this->mine)->json('data.id');
        // Signed out: the guard that answered the upload is dropped
        auth()->forgetGuards();

        $this->getJson("/api/exercises/{$this->mine->id}/photos/{$id}/thumb")->assertUnauthorized();
    });

    it('answers 404 for a photo of another exercise, even one of mine', function () {
        $other = Exercise::factory()->for($this->ann, 'owner')->create();
        $id = uploadPhoto($other)->json('data.id');

        $this->get("/api/exercises/{$this->mine->id}/photos/{$id}/thumb")->assertNotFound();
    });

    it('answers 404 for a size not made yet, which the app does not ask for', function () {
        $id = uploadPhoto($this->mine)->json('data.id');
        $photo = $this->mine->fresh()->getFirstMedia('photos');
        $photo->markAsConversionNotGenerated('large')->save();

        $this->get("/api/exercises/{$this->mine->id}/photos/{$id}/large")->assertNotFound();
        $this->getJson("/api/exercises/{$this->mine->id}")->assertJsonPath('data.photos.0.url', "/api/exercises/{$this->mine->id}/photos/{$id}/original");
    });

    it('still serves the photos of a deleted exercise, which plans and history show', function () {
        $id = uploadPhoto($this->mine)->json('data.id');
        $this->mine->delete();

        $this->get("/api/exercises/{$this->mine->id}/photos/{$id}/thumb")->assertOk();
    });

    it('leaves the library\'s photos public, under /storage', function () {
        $public = Exercise::factory()->create();
        $photo = $public->addMedia(UploadedFile::fake()->image('0.jpg', 800, 600))->toMediaCollection('photos');

        $this->getJson("/api/exercises/{$public->id}")
            ->assertJsonPath('data.photos.0.thumb_url', "/storage/{$photo->id}/conversions/0-thumb.webp");
        expect($photo->disk)->toBe('public');
    });
});

describe('Duplicate as mine', function () {
    beforeEach(function () {
        $this->seed(MuscleSeeder::class);
    });

    it('copies a public exercise as mine, in my language, with its photos', function () {
        $public = Exercise::factory()->create([
            'name' => ['en' => 'Bench Press', 'it' => 'Panca piana'],
            'instructions' => ['en' => ['Lie down.'], 'it' => ['Sdraiati.']],
        ]);
        $public->muscles()->attach(Muscle::where('slug', 'chest')->value('id'), ['role' => 'primary']);
        $public->addMedia(UploadedFile::fake()->image('0.jpg', 800, 600))->toMediaCollection('photos');

        $response = $this->postJson("/api/exercises/{$public->id}/duplicate", [], ['Accept-Language' => 'it'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Panca piana')
            ->assertJsonPath('data.is_mine', true)
            ->assertJsonPath('data.muscles.0.slug', 'chest');

        $copy = Exercise::findOrFail($response->json('data.id'));
        expect($copy->owner_id)->toBe($this->ann->id)
            // One language only, as any personal exercise
            ->and($copy->getTranslations('name'))->toBe(['it' => 'Panca piana'])
            ->and($copy->getTranslation('instructions', 'it'))->toBe(['Sdraiati.'])
            // A photo of its own: another row, another file, private
            ->and($copy->getMedia('photos'))->toHaveCount(1)
            ->and($copy->getFirstMedia('photos')->id)->not->toBe($public->getFirstMedia('photos')->id)
            ->and($copy->getFirstMedia('photos')->disk)->toBe(ExercisePhotos::PRIVATE_DISK);
    });

    it('falls back to English when my language is missing', function () {
        $public = Exercise::factory()->create(['name' => ['en' => 'Plank']]);

        $this->postJson("/api/exercises/{$public->id}/duplicate", [], ['Accept-Language' => 'de'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Plank');
    });

    it('refuses my own exercise', function () {
        $this->postJson("/api/exercises/{$this->mine->id}/duplicate")->assertForbidden();
    });
});

describe('photos uploaded while they were public', function () {
    /**
     * A photo of a personal exercise as it was stored before: on `public`,
     * conversions included.
     */
    function publicPhotoOf(Exercise $exercise): Media
    {
        return $exercise->addMedia(UploadedFile::fake()->image('photo.jpg', 800, 600))->toMediaCollection('photos', 'public');
    }

    it('moves them to the private disk, keeping their ids and conversions', function () {
        $photo = publicPhotoOf($this->mine);
        // A deleted exercise's too
        $deleted = Exercise::factory()->for($this->ann, 'owner')->create();
        $deletedPhoto = publicPhotoOf($deleted);
        $deleted->delete();
        // The library's stay
        $library = publicPhotoOf(Exercise::factory()->create());

        $this->artisan('exercises:private-photos')->expectsOutputToContain('Photos made private: 2')->assertSuccessful();

        expect($photo->fresh()->disk)->toBe(ExercisePhotos::PRIVATE_DISK)
            ->and($photo->fresh()->conversions_disk)->toBe(ExercisePhotos::PRIVATE_DISK)
            ->and($deletedPhoto->fresh()->disk)->toBe(ExercisePhotos::PRIVATE_DISK)
            ->and($library->fresh()->disk)->toBe('public')
            ->and(Storage::disk('public')->directories())->toBe([(string) $library->id]);
        Storage::disk(ExercisePhotos::PRIVATE_DISK)->assertExists(["{$photo->id}/photo.jpg", "{$photo->id}/conversions/photo-thumb.webp"]);
        $this->get("/api/exercises/{$this->mine->id}/photos/{$photo->id}/thumb")->assertOk();

        // A second run finds nothing
        $this->artisan('exercises:private-photos')->expectsOutputToContain('Photos made private: 0')->assertSuccessful();
    });
});

describe('emptying the database', function () {
    it('leaves folders that make fresh removes, and only those', function () {
        uploadPhoto($this->mine)->assertCreated();
        uploadPhoto($this->mine)->assertCreated();
        [$gone, $kept] = $this->mine->fresh()->getMedia('photos')->all();

        $disk = Storage::disk(ExercisePhotos::PRIVATE_DISK);

        // As migrate:fresh does: the row goes, with no model event to delete the files
        DB::table('media')->where('id', $gone->id)->delete();
        expect($disk->directories())->toEqualCanonicalizing([(string) $gone->id, (string) $kept->id]);

        // As make fresh runs it for the private disk, which it must name
        $this->artisan('media-library:clean', ['modelType' => '', 'collectionName' => '', 'disk' => ExercisePhotos::PRIVATE_DISK, '--skip-conversions' => true])
            ->assertSuccessful();

        expect($disk->directories())->toBe([(string) $kept->id])
            ->and($disk->exists("{$kept->id}/conversions"))->toBeTrue();
    });
});
