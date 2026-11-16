<?php

namespace App\Enums;

enum TaxStatus : string
{
    case Active = 'active';
    case Expired = 'expired';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

