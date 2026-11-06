<?php

namespace App\Enums;

/**
 * The unit a user sees weights in, the values of the `users.weight_unit`
 * column. It only changes how weights are shown and read: they are always
 * stored in kilograms (docs/design/D3-data-model.md D3.2.3). What an enum is:
 * app/Enums/Locale.php.
 */
enum WeightUnit: string
{
    case Kg = 'kg';
    case Lb = 'lb';
}
