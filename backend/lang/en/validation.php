<?php

/**
 * English names of the fields inside validation messages
 * (docs/concepts/C2-backend.md C2.7.7).
 *
 * The English messages themselves are Laravel's, which this file does not
 * repeat: Laravel merges a language file of the app with the framework's own,
 * key by key, so only `attributes` is added, and the messages of our own rules
 * (app/Rules/), which Laravel cannot know. Without `attributes`, a message
 * would name the field by its key: "The muscles.0.role field is required."
 */
return [
    // The messages of SupersetsAreNeighbours, a rule of our own
    'superset_neighbours' => 'The exercises of a superset must be next to each other.',
    'superset_size' => 'A superset needs at least two exercises.',

    // How each field is called inside a message
    'attributes' => [
        'aliases.*' => 'alias',
        'instructions.*' => 'step',
        'logging_type' => 'logging type',
        'equipment_id' => 'equipment',
        'youtube_url' => 'YouTube link',
        'muscles.*.id' => 'muscle',
        'muscles.*.role' => 'muscle role',

        // The workout plans (PlanRequest)
        'days.*.id' => 'day id',
        'days.*.name' => 'day name',
        'days.*.items' => 'exercises of the day',
        'days.*.items.*.id' => 'plan exercise id',
        'days.*.items.*.exercise_id' => 'exercise',
        'days.*.items.*.superset_group' => 'superset',
        'days.*.items.*.rest_seconds' => 'rest',
        'days.*.items.*.notes' => 'notes',
        'days.*.items.*.sets' => 'sets',
        'days.*.items.*.sets.*.set_type' => 'set type',
        'days.*.items.*.sets.*.target_reps_min' => 'minimum reps',
        'days.*.items.*.sets.*.target_reps_max' => 'maximum reps',
        'days.*.items.*.sets.*.target_weight_kg' => 'weight',
        'days.*.items.*.sets.*.target_rpe' => 'RPE',
        'days.*.items.*.sets.*.target_duration_seconds' => 'duration',
        'days.*.items.*.sets.*.target_distance_meters' => 'distance',
    ],
];
