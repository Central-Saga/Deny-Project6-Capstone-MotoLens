<?php

namespace App\Enums;

enum PriceLabel : string
{
    case GoodDeal = 'good_deal';
    case FairPrice = 'fair_price';
    case Overpriced = 'overpriced';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

