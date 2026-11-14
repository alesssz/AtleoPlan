<?php

namespace App\Enums;

/**
 * The unit weights are shown and typed in, in `users.weight_unit`. Weights are
 * always stored in kilograms.
 */
enum WeightUnit: string
{
    case Kg = 'kg';
    case Lb = 'lb';
}
