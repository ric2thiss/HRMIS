# Testing Guidelines

## 📋 Overview

Testing ensures the DICT Project remains reliable, maintainable, and bug-free. This document covers testing strategies, tools, and best practices for both backend and frontend.

## 🎯 Testing Philosophy

### Testing Pyramid

```
        /\
       /E2E\         ← Few (Critical user journeys)
      /------\
     /        \
    /Integration\    ← Some (API endpoints, features)
   /------------\
  /              \
 /   Unit Tests   \  ← Many (Functions, classes)
/------------------\
```

### Test Types

1. **Unit Tests**: Test individual functions/classes in isolation
2. **Integration Tests**: Test how components work together
3. **E2E Tests**: Test complete user workflows
4. **Manual Tests**: Exploratory testing, UI/UX validation

## 🔧 Backend Testing (Laravel/PHPUnit)

### Setup

PHPUnit is included with Laravel:

```bash
cd server
./vendor/bin/phpunit
```

Or use Artisan:

```bash
php artisan test
```

### Configuration

```xml
<!-- phpunit.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

### Unit Tests

**Testing a Service:**

```php
// tests/Unit/Services/LeaveServiceTest.php
namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\LeaveService;
use App\Models\User;
use App\Models\LeaveType;

class LeaveServiceTest extends TestCase
{
    public function test_calculate_leave_days()
    {
        $service = new LeaveService();
        
        $days = $service->calculateLeaveDays(
            '2025-01-15',
            '2025-01-17'
        );
        
        $this->assertEquals(3, $days);
    }

    public function test_user_has_sufficient_credits()
    {
        $user = User::factory()->create();
        $leaveType = LeaveType::factory()->create();
        
        $service = new LeaveService();
        
        $this->assertTrue(
            $service->hasSufficientCredits($user, $leaveType, 5)
        );
    }
}
```

**Testing a Model:**

```php
// tests/Unit/Models/UserTest.php
namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\User;
use App\Models\Attendance;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_attendances_relationship()
    {
        $user = User::factory()->create();
        $attendance = Attendance::factory()->create([
            'user_id' => $user->id,
        ]);

        $this->assertTrue($user->attendances->contains($attendance));
    }

    public function test_user_full_name_accessor()
    {
        $user = User::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $this->assertEquals('John Doe', $user->full_name);
    }
}
```

### Feature/Integration Tests

**Testing API Endpoints:**

```php
// tests/Feature/Api/UserApiTest.php
namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_their_profile()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/user');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'id' => $user->id,
                         'email' => $user->email,
                     ],
                 ]);
    }

    public function test_unauthenticated_user_cannot_access_profile()
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    public function test_admin_can_create_user()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'role_id' => 3,
        ];

        $response = $this->postJson('/api/users', $userData);

        $response->assertStatus(201)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'email' => 'john@example.com',
                     ],
                 ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
        ]);
    }

    public function test_user_creation_requires_valid_email()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/users', [
            'name' => 'John Doe',
            'email' => 'invalid-email',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }
}
```

**Testing Authentication:**

```php
// tests/Feature/Auth/LoginTest.php
namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_correct_credentials()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                 ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_user_cannot_login_with_incorrect_password()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
        $this->assertGuest();
    }
}
```

### Database Testing

**Using Factories:**

```php
// database/factories/UserFactory.php
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    public function definition()
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'role' => 'employee',
        ];
    }

    public function admin()
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
        ]);
    }
}

// Usage in tests
$user = User::factory()->create();
$admin = User::factory()->admin()->create();
$users = User::factory()->count(10)->create();
```

**Database Assertions:**

```php
// Check record exists
$this->assertDatabaseHas('users', [
    'email' => 'test@example.com',
]);

// Check record doesn't exist
$this->assertDatabaseMissing('users', [
    'email' => 'deleted@example.com',
]);

// Check count
$this->assertDatabaseCount('users', 10);
```

### Testing Policies

```php
// tests/Feature/Policies/LeavePolicyTest.php
public function test_user_can_update_own_leave()
{
    $user = User::factory()->create();
    $leave = Leave::factory()->create(['user_id' => $user->id]);

    $this->assertTrue($user->can('update', $leave));
}

public function test_user_cannot_update_others_leave()
{
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $leave = Leave::factory()->create(['user_id' => $otherUser->id]);

    $this->assertFalse($user->can('update', $leave));
}
```

## 🎨 Frontend Testing (React)

### Setup

Install testing libraries:

```bash
cd client
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest
```

**Vitest Configuration:**

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
```

**Setup File:**

```javascript
// src/test/setup.js
import '@testing-library/jest-dom';
```

**Package.json scripts:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Unit Tests

**Testing Utility Functions:**

```javascript
// src/utils/__tests__/dateHelpers.test.js
import { describe, it, expect } from 'vitest';
import { formatDate, calculateDaysBetween } from '../dateHelpers';

describe('dateHelpers', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date)).toBe('01/15/2025');
    });

    it('handles invalid date', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
    });
  });

  describe('calculateDaysBetween', () => {
    it('calculates days between dates', () => {
      const days = calculateDaysBetween('2025-01-15', '2025-01-17');
      expect(days).toBe(3);
    });
  });
});
```

**Testing Custom Hooks:**

```javascript
// src/hooks/__tests__/useAuth.test.js
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAuth } from '../useAuth';
import { useAuthStore } from '@/stores/authStore';

describe('useAuth', () => {
  it('returns user authentication status', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets user on login', () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      useAuthStore.getState().setUser({ id: 1, name: 'John' });
    });

    expect(result.current.user).toEqual({ id: 1, name: 'John' });
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Component Tests

**Testing Simple Component:**

```javascript
// src/components/__tests__/Button.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Testing Form Component:**

```javascript
// src/components/__tests__/LoginForm.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';

describe('LoginForm', () => {
  it('submits form with email and password', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();

    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });
});
```

### Testing with React Query

```javascript
// src/components/__tests__/UserList.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserList from '../UserList';
import * as userApi from '@/api/user/userApi';

// Mock API
vi.mock('@/api/user/userApi');

describe('UserList', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('displays users when loaded', async () => {
    const mockUsers = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
    ];

    userApi.getUsers.mockResolvedValue(mockUsers);

    render(<UserList />, { wrapper });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('displays error message on failure', async () => {
    userApi.getUsers.mockRejectedValue(new Error('Failed to fetch'));

    render(<UserList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Testing (Optional - Playwright/Cypress)

**Example with Playwright:**

```javascript
// e2e/login.spec.js
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('http://localhost:5173/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

## 📊 Test Coverage

### Generate Coverage Report

**Backend:**

```bash
cd server
./vendor/bin/phpunit --coverage-html coverage
```

**Frontend:**

```bash
cd client
npm run test:coverage
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Feature Tests**: Critical paths covered
- **E2E Tests**: Main user flows covered

## ✅ Testing Best Practices

### General

1. **Write tests first** (TDD) or alongside code
2. **Test behavior, not implementation**
3. **Keep tests simple and focused**
4. **Use descriptive test names**
5. **Arrange-Act-Assert pattern**
6. **Don't test framework code**
7. **Mock external dependencies**

### Backend

1. **Use factories for test data**
2. **Use `RefreshDatabase` trait**
3. **Test edge cases and error conditions**
4. **Test authorization and validation**
5. **Test database relationships**

### Frontend

1. **Test user interactions**
2. **Query by role/label (accessibility)**
3. **Avoid testing implementation details**
4. **Mock API calls**
5. **Test loading and error states**

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.2
      - name: Install Dependencies
        run: cd server && composer install
      - name: Run Tests
        run: cd server && php artisan test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: 18
      - name: Install Dependencies
        run: cd client && npm ci
      - name: Run Tests
        run: cd client && npm test
```

## 📚 Testing Resources

- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [Laravel Testing](https://laravel.com/docs/testing)
- [React Testing Library](https://testing-library.com/react)
- [Vitest](https://vitest.dev/)
- [Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

*Good tests lead to better code and fewer bugs. Make testing a habit!*

