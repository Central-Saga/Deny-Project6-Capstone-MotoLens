<?php

namespace App\Providers;

use App\Models\Inquiry;
use App\Models\Motorcycle;
use App\Models\MotorcycleInspection;
use App\Policies\InquiryPolicy;
use App\Policies\MotorcycleInspectionPolicy;
use App\Policies\MotorcyclePolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
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
        Gate::policy(MotorcycleInspection::class, MotorcycleInspectionPolicy::class);

        // Rate Limiters (Bab 11.1 & Bab 12)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('inspect', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });
    }
}
