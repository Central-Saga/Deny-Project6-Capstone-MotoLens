<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        foreach ([
            'APP_ENV',
            'APP_DEBUG',
            'DB_DATABASE',
            'CACHE_STORE',
            'SESSION_DRIVER',
            'QUEUE_CONNECTION',
            'MAIL_MAILER',
            'BCRYPT_ROUNDS',
        ] as $key) {
            if (isset($_ENV[$key])) {
                putenv("{$key}={$_ENV[$key]}");
                $_SERVER[$key] = $_ENV[$key];
            }
        }

        return parent::createApplication();
    }
}
