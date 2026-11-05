<?php

/**
 * Validation messages (docs/05-backend.md 5.7.7): only the rules the app uses so
 * far, the others fall back to English. A new rule in a Form Request adds its
 * message to the three languages. :attribute is filled from the attributes list below.
 */
return [
    'confirmed' => 'La conferma di :attribute non coincide.',
    'email' => 'Il campo :attribute deve essere un indirizzo email valido.',
    'enum' => 'Il valore di :attribute non è valido.',
    'max' => [
        'string' => 'Il campo :attribute non può superare :max caratteri.',
    ],
    'min' => [
        'string' => 'Il campo :attribute deve avere almeno :min caratteri.',
    ],
    'required' => 'Il campo :attribute è obbligatorio.',
    'string' => 'Il campo :attribute deve essere un testo.',
    'unique' => 'Questo valore di :attribute è già in uso.',

    // How each field is called inside a message
    'attributes' => [
        'name' => 'nome',
        'email' => 'email',
        'password' => 'password',
        'locale' => 'lingua',
        'theme' => 'tema',
    ],
];
