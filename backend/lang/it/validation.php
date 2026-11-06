<?php

/**
 * Validation messages (docs/concepts/C2-backend.md C2.7.7): only the rules the app uses so
 * far, the others fall back to English. A new rule in a Form Request adds its
 * message to the three languages. :attribute is filled from the attributes list below.
 */
return [
    'array' => 'Il campo :attribute deve essere un elenco.',
    'confirmed' => 'La conferma di :attribute non coincide.',
    'distinct' => 'Il campo :attribute contiene un valore ripetuto.',
    'email' => 'Il campo :attribute deve essere un indirizzo email valido.',
    'enum' => 'Il valore di :attribute non è valido.',
    'exists' => 'Il valore scelto per :attribute non esiste.',
    'integer' => 'Il campo :attribute deve essere un numero intero.',
    'max' => [
        'array' => 'Il campo :attribute non può avere più di :max elementi.',
        'string' => 'Il campo :attribute non può superare :max caratteri.',
    ],
    'min' => [
        'string' => 'Il campo :attribute deve avere almeno :min caratteri.',
    ],
    'regex' => 'Il formato di :attribute non è valido.',
    'required' => 'Il campo :attribute è obbligatorio.',
    'string' => 'Il campo :attribute deve essere un testo.',
    'unique' => 'Questo valore di :attribute è già in uso.',
    'url' => 'Il campo :attribute deve essere un indirizzo web valido.',

    // How each field is called inside a message
    'attributes' => [
        'name' => 'nome',
        'email' => 'email',
        'password' => 'password',
        'locale' => 'lingua',
        'theme' => 'tema',
        'description' => 'descrizione',
        'aliases' => 'nomi alternativi',
        'aliases.*' => 'nome alternativo',
        'instructions' => 'istruzioni',
        'instructions.*' => 'passaggio',
        'logging_type' => 'tipo di registrazione',
        'equipment_id' => 'attrezzatura',
        'youtube_url' => 'link YouTube',
        'muscles' => 'muscoli',
        'muscles.*.id' => 'muscolo',
        'muscles.*.role' => 'ruolo del muscolo',
    ],
];
