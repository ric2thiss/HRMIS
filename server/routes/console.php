<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule announcement activation to run every minute
Schedule::command('announcements:activate-scheduled')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();
