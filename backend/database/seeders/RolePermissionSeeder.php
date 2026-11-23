<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Role `admin` dan `user` (PRD Bab 11.1). Idempotent.
 * Otorisasi berbasis role + policy kepemilikan (policy dibuat pada Fase 2/3).
 */
class RolePermissionSeeder extends Seeder
{
    public const ROLES = ['admin', 'user'];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::ROLES as $role) {
            Role::findOrCreate($role, 'web');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
