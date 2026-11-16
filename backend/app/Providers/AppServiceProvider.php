<?php

namespace App\Providers;

use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Policies\InquiryPolicy;
use App\Policies\MotorcyclePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Motorcycle::class, MotorcyclePolicy::class);
        Gate::policy(Inquiry::class, InquiryPolicy::class);
    }
}
