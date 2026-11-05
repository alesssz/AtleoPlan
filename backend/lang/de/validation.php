<?php

/**
 * Validation messages (docs/05-backend.md 5.7.7): only the rules the app uses so
 * far, the others fall back to English. A new rule in a Form Request adds its
 * message to the three languages. :attribute is filled from the attributes list below.
 */
return [
    'confirmed' => 'Die Bestätigung von :attribute stimmt nicht überein.',
    'email' => 'Das Feld :attribute muss eine gültige E-Mail-Adresse sein.',
    'enum' => 'Der Wert von :attribute ist ungültig.',
    'max' => [
        'string' => 'Das Feld :attribute darf höchstens :max Zeichen haben.',
    ],
    'min' => [
        'string' => 'Das Feld :attribute muss mindestens :min Zeichen haben.',
    ],
    'required' => 'Das Feld :attribute ist erforderlich.',
    'string' => 'Das Feld :attribute muss ein Text sein.',
    'unique' => 'Dieser Wert von :attribute wird bereits verwendet.',

    // How each field is called inside a message
    'attributes' => [
        'name' => 'Name',
        'email' => 'E-Mail',
        'password' => 'Passwort',
        'locale' => 'Sprache',
        'theme' => 'Design',
    ],
];
