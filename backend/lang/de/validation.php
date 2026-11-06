<?php

/**
 * Validation messages (docs/concepts/C2-backend.md C2.7.7): only the rules the app uses so
 * far, the others fall back to English. A new rule in a Form Request adds its
 * message to the three languages. :attribute is filled from the attributes list below.
 */
return [
    'array' => 'Das Feld :attribute muss eine Liste sein.',
    'confirmed' => 'Die Bestätigung von :attribute stimmt nicht überein.',
    'distinct' => 'Das Feld :attribute enthält einen doppelten Wert.',
    'email' => 'Das Feld :attribute muss eine gültige E-Mail-Adresse sein.',
    'enum' => 'Der Wert von :attribute ist ungültig.',
    'exists' => 'Der gewählte Wert für :attribute existiert nicht.',
    'integer' => 'Das Feld :attribute muss eine ganze Zahl sein.',
    'max' => [
        'array' => 'Das Feld :attribute darf höchstens :max Einträge haben.',
        'string' => 'Das Feld :attribute darf höchstens :max Zeichen haben.',
    ],
    'min' => [
        'string' => 'Das Feld :attribute muss mindestens :min Zeichen haben.',
    ],
    'regex' => 'Das Format von :attribute ist ungültig.',
    'required' => 'Das Feld :attribute ist erforderlich.',
    'string' => 'Das Feld :attribute muss ein Text sein.',
    'unique' => 'Dieser Wert von :attribute wird bereits verwendet.',
    'url' => 'Das Feld :attribute muss eine gültige Webadresse sein.',

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
    ],
];
