# Security

## 📋 Overview

Security is paramount in the DICT Project, especially given its use in government/enterprise environments. This document outlines the security measures, practices, and guidelines implemented in the system.

## 🔐 Authentication

### Laravel Sanctum

The application uses **Laravel Sanctum** for API authentication, providing both token-based and cookie-based authentication.

**Benefits:**
- Simple and lightweight
- Perfect for SPAs
- CSRF protection included
- Supports mobile apps (tokens)

### Authentication Flow

```
1. User submits credentials (email/password)
2. Backend validates credentials
3. If valid, Sanctum creates session
4. Session cookie sent to client (httpOnly)
5. Client includes cookie in subsequent requests
6. Middleware validates session
7. Access granted/denied
```

### Implementation

**Login Controller:**

```php
// app/Http/Controllers/AuthController.php
public function login(LoginRequest $request)
{
    if (!Auth::attempt($request->only('email', 'password'))) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid credentials'
        ], 401);
    }

    $user = Auth::user();
    
    // Log login activity
    LoginActivity::create([
        'user_id' => $user->id,
        'ip_address' => $request->ip(),
        'user_agent' => $request->userAgent(),
    ]);

    return response()->json([
        'success' => true,
        'data' => [
            'user' => new UserResource($user),
        ],
        'message' => 'Login successful'
    ]);
}
```

**Protecting Routes:**

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UserController::class, 'me']);
    Route::apiResource('attendance', AttendanceController::class);
    // ... other protected routes
});
```

**Frontend Authentication:**

```javascript
// src/api/auth/authApi.js
import api from '../axios';

export const login = async (credentials) => {
  // Get CSRF cookie first
  await api.get('/sanctum/csrf-cookie');
  
  // Then login
  const response = await api.post('/login', credentials);
  return response.data;
};

export const logout = async () => {
  await api.post('/logout');
};
```

### Password Requirements

- Minimum 8 characters
- Must contain uppercase and lowercase letters
- Must contain at least one number
- Must contain at least one special character
- Cannot be common passwords

**Implementation:**

```php
// app/Http/Requests/RegisterRequest.php
public function rules()
{
    return [
        'password' => [
            'required',
            'string',
            'min:8',
            'confirmed',
            Password::min(8)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->symbols()
                ->uncompromised(),
        ],
    ];
}
```

### Password Hashing

Laravel uses **bcrypt** by default:

```php
use Illuminate\Support\Facades\Hash;

// Hashing
$hashedPassword = Hash::make($request->password);

// Verification
if (Hash::check($plainPassword, $hashedPassword)) {
    // Password matches
}
```

### Multi-Factor Authentication (Future)

Planned for future releases:
- SMS-based OTP
- Email-based OTP
- Authenticator app support (TOTP)

## 🛡️ Authorization

### Role-Based Access Control (RBAC)

**Roles:**
- **Admin**: Full system access
- **HR**: HR operations, employee management
- **Employee**: Self-service access

**Implementation:**

```php
// database/seeders/RoleSeeder.php
Role::create(['name' => 'admin', 'description' => 'Administrator']);
Role::create(['name' => 'hr', 'description' => 'HR Staff']);
Role::create(['name' => 'employee', 'description' => 'Employee']);
```

### Middleware-based Authorization

```php
// app/Http/Middleware/CheckRole.php
public function handle($request, Closure $next, ...$roles)
{
    if (!$request->user() || !in_array($request->user()->role, $roles)) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized'
        ], 403);
    }

    return $next($request);
}

// Usage in routes
Route::middleware(['auth:sanctum', 'role:admin,hr'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
```

### Policy-based Authorization

```php
// app/Policies/LeavePolicy.php
class LeavePolicy
{
    public function update(User $user, Leave $leave)
    {
        // Users can only update their own leaves
        // HR and Admin can update any
        return $user->id === $leave->user_id || 
               in_array($user->role, ['admin', 'hr']);
    }

    public function approve(User $user, Leave $leave)
    {
        // Only HR and Admin can approve
        return in_array($user->role, ['admin', 'hr']);
    }
}

// In controller
public function update(Request $request, Leave $leave)
{
    $this->authorize('update', $leave);
    // ... update logic
}
```

### Frontend Authorization

```javascript
// src/hooks/useAuth.js
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const isAdmin = () => hasRole('admin');
  const isHR = () => hasRole('hr');

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isHR,
  };
}

// Usage
function AdminPanel() {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <Navigate to="/dashboard" />;
  }

  return <div>Admin Panel</div>;
}
```

## 🔒 Data Protection

### Input Validation

**Backend:**

```php
// app/Http/Requests/StoreUserRequest.php
public function rules()
{
    return [
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|min:8|confirmed',
        'office_id' => 'required|exists:offices,id',
    ];
}

public function messages()
{
    return [
        'email.unique' => 'This email is already registered.',
        'office_id.exists' => 'Invalid office selected.',
    ];
}
```

**Frontend:**

```javascript
// Basic validation
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Form validation
const errors = {};
if (!formData.name) {
  errors.name = 'Name is required';
}
if (!validateEmail(formData.email)) {
  errors.email = 'Invalid email address';
}
```

### Output Encoding

**Prevent XSS:**

React automatically escapes JSX:

```javascript
// Safe - React escapes automatically
<div>{userData.name}</div>

// Dangerous - Only use if you trust the HTML
<div dangerouslySetInnerHTML={{ __html: trustedHtml }} />
```

Laravel Blade escapes by default:

```blade
{{-- Safe --}}
{{ $user->name }}

{{-- Unsafe - use only for trusted HTML --}}
{!! $trustedHtml !!}
```

### SQL Injection Prevention

**Always use parameter binding:**

```php
// ✅ Safe - Eloquent ORM (uses parameter binding)
User::where('email', $email)->first();

// ✅ Safe - Query Builder with bindings
DB::table('users')->where('email', $email)->first();

// ❌ Dangerous - Raw query without bindings
DB::select("SELECT * FROM users WHERE email = '$email'");

// ✅ Safe - Raw query with bindings
DB::select("SELECT * FROM users WHERE email = ?", [$email]);
```

### CSRF Protection

**Backend (Laravel):**

CSRF protection is automatic for stateful requests.

```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:5173')),
```

**Frontend:**

```javascript
// Get CSRF cookie before first request
await api.get('/sanctum/csrf-cookie');

// Subsequent requests include CSRF token automatically
await api.post('/login', credentials);
```

### Mass Assignment Protection

```php
// app/Models/User.php
class User extends Model
{
    // Whitelist approach (recommended)
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    // Or blacklist approach
    protected $guarded = [
        'id',
        'is_admin',
        'role',
    ];
}

// Usage
User::create($request->only('name', 'email', 'password'));
```

## 🚨 Security Headers

### Nginx Configuration

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Laravel Middleware

```php
// app/Http/Middleware/SecurityHeaders.php
public function handle($request, Closure $next)
{
    $response = $next($request);

    $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-XSS-Protection', '1; mode=block');

    return $response;
}
```

## 🔑 Secrets Management

### Environment Variables

**Never commit secrets to version control:**

```env
# .env (gitignored)
APP_KEY=base64:...
DB_PASSWORD=secret_password
JWT_SECRET=your_secret_key
MAIL_PASSWORD=mail_password
```

**Use .env.example as template:**

```env
# .env.example (committed)
APP_KEY=
DB_PASSWORD=
JWT_SECRET=
MAIL_PASSWORD=
```

### Rotating Secrets

```bash
# Rotate application key
php artisan key:generate

# Rotate JWT secret (if using JWT)
php artisan jwt:secret --force
```

## 📝 Logging & Auditing

### Security Event Logging

```php
// app/Models/LoginActivity.php
class LoginActivity extends Model
{
    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
        'successful',
        'failed_reason',
    ];
}

// Log failed login attempt
LoginActivity::create([
    'user_id' => null,
    'ip_address' => $request->ip(),
    'user_agent' => $request->userAgent(),
    'successful' => false,
    'failed_reason' => 'Invalid credentials',
]);
```

### HTTP Request Logging

```php
// app/Models/HttpRequestLog.php
class HttpRequestLog extends Model
{
    protected $fillable = [
        'user_id',
        'method',
        'url',
        'ip_address',
        'user_agent',
        'status_code',
        'response_time',
    ];
}

// Middleware to log requests
public function handle($request, Closure $next)
{
    $startTime = microtime(true);
    $response = $next($request);
    $endTime = microtime(true);

    HttpRequestLog::create([
        'user_id' => auth()->id(),
        'method' => $request->method(),
        'url' => $request->fullUrl(),
        'ip_address' => $request->ip(),
        'user_agent' => $request->userAgent(),
        'status_code' => $response->status(),
        'response_time' => ($endTime - $startTime) * 1000,
    ]);

    return $response;
}
```

### Module Access Logging

```php
// Track which modules users access
ModuleAccessLog::create([
    'user_id' => auth()->id(),
    'module_name' => 'attendance',
    'action' => 'view',
    'ip_address' => $request->ip(),
]);
```

## 🚫 Rate Limiting

### API Rate Limiting

```php
// config/sanctum.php or routes/api.php
Route::middleware('throttle:60,1')->group(function () {
    // 60 requests per minute
});

// Stricter limit for authentication
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1'); // 5 attempts per minute
```

### Custom Rate Limiting

```php
// app/Providers/RouteServiceProvider.php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});

RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->email . $request->ip());
});
```

## 🔐 Account Security

### Account Locking

```php
// After multiple failed attempts
if ($user->failed_login_attempts >= 5) {
    $user->update([
        'is_locked' => true,
        'locked_until' => now()->addMinutes(30),
    ]);
    
    return response()->json([
        'success' => false,
        'message' => 'Account locked due to multiple failed attempts'
    ], 423);
}
```

### Force Password Change

```php
// app/Models/User.php
public function mustChangePassword()
{
    return $this->force_password_change || 
           $this->password_changed_at < now()->subDays(90);
}

// Middleware
if (auth()->user()->mustChangePassword()) {
    return redirect('/force-change-password');
}
```

### Session Management

```php
// config/session.php
'lifetime' => 120, // minutes
'expire_on_close' => false,
'encrypt' => true,
'secure' => env('SESSION_SECURE_COOKIE', true),
'http_only' => true,
'same_site' => 'lax',
```

## 🛡️ Security Best Practices

### Checklist

- [ ] All passwords hashed with bcrypt
- [ ] CSRF protection enabled
- [ ] SQL injection prevented (parameter binding)
- [ ] XSS protection (output escaping)
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Secrets in environment variables
- [ ] Logging security events
- [ ] Regular security audits
- [ ] Dependencies kept up-to-date
- [ ] Error messages don't expose sensitive info
- [ ] File uploads validated and scanned
- [ ] Database backups automated

### Code Review Security Checks

1. **Authentication**: Proper authentication required?
2. **Authorization**: User has permission?
3. **Input Validation**: All inputs validated?
4. **Output Encoding**: Data properly escaped?
5. **SQL Injection**: Using parameter binding?
6. **CSRF**: CSRF tokens in place?
7. **Secrets**: No secrets in code?
8. **Logging**: Sensitive data logged?

### Dependency Security

```bash
# Check for vulnerabilities
cd server
composer audit

cd ../client
npm audit

# Fix vulnerabilities
npm audit fix
```

## 🚨 Incident Response

### Security Incident Procedure

1. **Detect**: Monitor logs for suspicious activity
2. **Assess**: Determine severity and impact
3. **Contain**: Isolate affected systems
4. **Eradicate**: Remove threat
5. **Recover**: Restore normal operations
6. **Review**: Post-incident analysis

### Emergency Contacts

- System Administrator: [contact]
- Security Team: [contact]
- Database Administrator: [contact]

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Laravel Security](https://laravel.com/docs/security)
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [PHP Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/PHP_Configuration_Cheat_Sheet.html)

---

*Security is everyone's responsibility. Report any security concerns immediately.*

