<?php

/**
 * English names of the fields inside validation messages
 * (docs/concepts/C2-backend.md C2.7.7).
 *
 * The English messages themselves are Laravel's, which this file does not
 * repeat: Laravel merges a language file of the app with the framework's own,
 * key by key, so only `attributes` is added. Without it, a message would name
 * the field by its key: "The muscles.0.role field is required."
 */
return [
    // How each field is called inside a message
    'attributes' => [
        'aliases.*' => 'alias',
        'instructions.*' => 'step',
        'logging_type' => 'logging type',
        'equipment_id' => 'equipment',
        'youtube_url' => 'YouTube link',
        'muscles.*.id' => 'muscle',
        'muscles.*.role' => 'muscle role',
    ],
];
