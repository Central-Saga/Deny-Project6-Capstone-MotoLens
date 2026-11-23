<?php

namespace App\Enums;

enum SourceType: string
{
    case AndroidCamera = 'android_camera';
    case WebUpload = 'web_upload';
    case SeedDemo = 'seed_demo';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
