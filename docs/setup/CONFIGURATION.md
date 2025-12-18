# Configuration Guide

## 📋 Overview

This guide covers configuration options for the DICT Project, including environment variables, application settings, and customization options.

## 🔧 Backend Configuration (Laravel)

### Environment Variables (.env)

The `.env` file in the `server` directory contains all environment-specific configuration.

#### Application Settings

```env
# Application
APP_NAME="DICT HRIS"
APP_ENV=local                    # local, staging, production
APP_KEY=base64:xxx               # Auto-generated
APP_DEBUG=true                   # Set to false in production
APP_TIMEZONE=UTC                 # Or Asia/Manila
APP_URL=http://localhost:8000
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
```

#### Database Configuration

**SQLite (Development):**
```env
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database/database.sqlite
```

**MySQL:**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dict_db
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

**PostgreSQL:**
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=dict_db
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_SCHEMA=public
DB_SSLMODE=prefer
```

#### Session and Cache

```env
# Session
SESSION_DRIVER=file             # file, cookie, database, redis
SESSION_LIFETIME=120             # Minutes

# Cache
CACHE_STORE=file                # file, redis, memcached, database
CACHE_PREFIX=dict_cache

# Queue
QUEUE_CONNECTION=sync           # sync, database, redis
```

#### Mail Configuration

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io       # Or your SMTP server
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@dict.gov.ph"
MAIL_FROM_NAME="${APP_NAME}"
```

#### Sanctum (API Authentication)

```env
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
SESSION_DOMAIN=localhost
```

#### Logging

```env
LOG_CHANNEL=stack               # stack, single, daily
LOG_LEVEL=debug                 # debug, info, warning, error
LOG_DEPRECATIONS_CHANNEL=null
LOG_STACK_CHANNELS=daily
```

#### CORS Configuration

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Configuration Files

Laravel configuration files are in `server/config/`:

#### 1. `config/app.php`

Application-wide settings:

```php
'timezone' => 'Asia/Manila',  // Adjust for your location
'locale' => 'en',
'fallback_locale' => 'en',
```

#### 2. `config/cors.php`

CORS settings for API:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    
    'allowed_methods' => ['*'],
    
    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        // Add production URLs here
    ],
    
    'allowed_origins_patterns' => [],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => [],
    
    'max_age' => 0,
    
    'supports_credentials' => true,
];
```

#### 3. `config/sanctum.php`

API authentication settings:

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 
    sprintf(
        '%s%s',
        'localhost,localhost:5173,127.0.0.1,127.0.0.1:5173,::1',
        Sanctum::currentApplicationUrlWithPort()
    )
)),

'expiration' => null, // Minutes or null for no expiration

'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

'middleware' => [
    'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
    'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
    'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
],
```

#### 4. `config/database.php`

Database connection settings are mostly controlled via `.env`, but you can customize query logging:

```php
'connections' => [
    'mysql' => [
        // ...
        'options' => extension_loaded('pdo_mysql') ? array_filter([
            PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
        ]) : [],
    ],
],
```

### Custom Configuration

Create custom config files in `server/config/` as needed:

**Example: `config/dict.php`**

```php
<?php

return [
    'system' => [
        'name' => env('APP_NAME', 'DICT HRIS'),
        'version' => '1.0.0',
    ],
    
    'leave' => [
        'max_days_per_application' => 30,
        'advance_filing_days' => 90,
        'require_hr_approval' => true,
    ],
    
    'attendance' => [
        'grace_period_minutes' => 15,
        'late_threshold_minutes' => 30,
        'undertime_threshold_minutes' => 30,
    ],
    
    'pds' => [
        'photo_max_size_mb' => 2,
        'allowed_photo_types' => ['jpg', 'jpeg', 'png'],
    ],
];
```

Access in code:
```php
$maxDays = config('dict.leave.max_days_per_application');
```

## 🎨 Frontend Configuration (React + Vite)

### Environment Variables (.env)

Create `.env` in the `client` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=DICT HRIS

# Optional: Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false
```

> ⚠️ **Important**: All Vite environment variables must be prefixed with `VITE_`

### Environment-Specific Configs

Create different `.env` files:

- `.env.local` - Local development (gitignored)
- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Vite Configuration (`vite.config.js`)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@api': path.resolve(__dirname, './src/api'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false, // Set to true for production debugging
    chunkSizeWarningLimit: 1000,
  },
})
```

### Axios Configuration (`src/api/axios.js`)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### React Query Configuration (`src/config/queryClient.js`)

```javascript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

### Tailwind Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Add custom colors
      },
    },
  },
  plugins: [],
}
```

## 🔒 Security Configuration

### Production Security Checklist

#### Backend (.env)
```env
APP_ENV=production
APP_DEBUG=false                  # Never true in production
APP_KEY=                         # Strong, unique key

# Secure session
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

# HTTPS only
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DOMAIN=.yourdomain.com
```

#### HTTPS Configuration

In `app/Http/Middleware/TrustProxies.php`:

```php
protected $proxies = '*';
protected $headers = 
    Request::HEADER_X_FORWARDED_FOR |
    Request::HEADER_X_FORWARDED_HOST |
    Request::HEADER_X_FORWARDED_PORT |
    Request::HEADER_X_FORWARDED_PROTO |
    Request::HEADER_X_FORWARDED_AWS_ELB;
```

#### Rate Limiting

In `routes/api.php`:

```php
Route::middleware(['throttle:60,1'])->group(function () {
    // API routes
});

// Stricter for login
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');
```

### CORS for Production

Update `config/cors.php`:

```php
'allowed_origins' => [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
],

'supports_credentials' => true,
```

## 📝 Configuration Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files to version control
- ✅ Use `.env.example` as a template
- ✅ Document all environment variables
- ✅ Use strong, unique keys and secrets
- ❌ Don't hardcode sensitive values in code

### 2. Security
- ✅ Use HTTPS in production
- ✅ Set secure cookies in production
- ✅ Implement rate limiting
- ✅ Keep dependencies updated
- ❌ Don't expose sensitive data in responses

### 3. Performance
- ✅ Enable caching in production
- ✅ Use queues for long-running tasks
- ✅ Optimize database queries
- ✅ Use CDN for static assets
- ❌ Don't leave debug mode on in production

## 🔄 Environment-Specific Settings

### Development
```env
APP_ENV=local
APP_DEBUG=true
LOG_LEVEL=debug
MAIL_MAILER=log
```

### Staging
```env
APP_ENV=staging
APP_DEBUG=true
LOG_LEVEL=info
```

### Production
```env
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=error
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
```

## 📞 Next Steps

- **Deploy Application**: See [Deployment Guide](./DEPLOYMENT.md)
- **Review Architecture**: See [Architecture Documentation](../general/ARCHITECTURE.md)
- **Learn Modules**: See [Modules Documentation](../modules/README.md)

---

*Configuration complete! Your application is now ready for development or deployment.*

