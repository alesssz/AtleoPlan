<?php

/**
 * Validation messages (docs/concepts/C2-backend.md C2.7.7): only the rules the app uses so
 * far, the others fall back to English. A new rule in a Form Request adds its
 * message to the three languages. :attribute is filled from the attributes list below.
 */
return [
    'array' => 'Das Feld :attribute muss eine Liste sein.',
    'between' => [
        'numeric' => 'Das Feld :attribute muss zwischen :min und :max liegen.',
    ],
    'boolean' => 'Das Feld :attribute muss wahr oder falsch sein.',
    'confirmed' => 'Die Bestätigung von :attribute stimmt nicht überein.',
    'decimal' => 'Das Feld :attribute muss :decimal Nachkommastellen haben.',
    'distinct' => 'Das Feld :attribute enthält einen doppelten Wert.',
    'email' => 'Das Feld :attribute muss eine gültige E-Mail-Adresse sein.',
    'enum' => 'Der Wert von :attribute ist ungültig.',
    'exists' => 'Der gewählte Wert für :attribute existiert nicht.',
    'gte' => [
        'numeric' => 'Das Feld :attribute muss mindestens :value sein.',
    ],
    'integer' => 'Das Feld :attribute muss eine ganze Zahl sein.',
    'max' => [
        'array' => 'Das Feld :attribute darf höchstens :max Einträge haben.',
        'string' => 'Das Feld :attribute darf höchstens :max Zeichen haben.',
    ],
    'min' => [
        'numeric' => 'Das Feld :attribute muss mindestens :min sein.',
        'string' => 'Das Feld :attribute muss mindestens :min Zeichen haben.',
    ],
    'numeric' => 'Das Feld :attribute muss eine Zahl sein.',
    'present' => 'Das Feld :attribute muss vorhanden sein.',
    'regex' => 'Das Format von :attribute ist ungültig.',
    'required' => 'Das Feld :attribute ist erforderlich.',
    'required_with' => 'Das Feld :attribute ist erforderlich, wenn :values angegeben ist.',
    'string' => 'Das Feld :attribute muss ein Text sein.',
    'superset_neighbours' => 'Die Übungen eines Supersatzes müssen direkt aufeinander folgen.',
    'superset_size' => 'Ein Supersatz muss mindestens zwei Übungen haben.',
    'unique' => 'Dieser Wert von :attribute wird bereits verwendet.',
    'url' => 'Das Feld :attribute muss eine gültige Webadresse sein.',
    'uuid' => 'Das Feld :attribute muss eine gültige UUID sein.',

    // How each field is called inside a message
    'attributes' => [
        'name' => 'Name',
        'email' => 'E-Mail',
        'password' => 'Passwort',
        'locale' => 'Sprache',
        'theme' => 'Design',
        'description' => 'Beschreibung',
        'aliases' => 'alternative Namen',
        'aliases.*' => 'alternativer Name',
        'instructions' => 'Anleitung',
        'instructions.*' => 'Schritt',
        'logging_type' => 'Erfassungsart',
        'equipment_id' => 'Ausrüstung',
        'youtube_url' => 'YouTube-Link',
        'muscles' => 'Muskeln',
        'muscles.*.id' => 'Muskel',
        'muscles.*.role' => 'Rolle des Muskels',

        // The workout plans (PlanRequest)
        'archived' => 'archiviert',
        'goal' => 'Ziel',
        'notes' => 'Notizen',
        'version' => 'Version',
        'days' => 'Tage',
        'days.*.id' => 'ID des Tages',
        'days.*.name' => 'Name des Tages',
        'days.*.items' => 'Übungen des Tages',
        'days.*.items.*.id' => 'ID der Übung im Plan',
        'days.*.items.*.exercise_id' => 'Übung',
        'days.*.items.*.superset_group' => 'Supersatz',
        'days.*.items.*.rest_seconds' => 'Pause',
        'days.*.items.*.notes' => 'Notizen',
        'days.*.items.*.sets' => 'Sätze',
        'days.*.items.*.sets.*.set_type' => 'Satztyp',
        'days.*.items.*.sets.*.target_reps_min' => 'Mindestwiederholungen',
        'days.*.items.*.sets.*.target_reps_max' => 'Höchstwiederholungen',
        'days.*.items.*.sets.*.target_weight_kg' => 'Gewicht',
        'days.*.items.*.sets.*.target_rpe' => 'RPE',
        'days.*.items.*.sets.*.target_duration_seconds' => 'Dauer',
        'days.*.items.*.sets.*.target_distance_meters' => 'Distanz',
    ],
];
