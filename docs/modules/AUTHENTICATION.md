# Authentication Module

## 📋 Overview

The Authentication module handles user login, logout, password management, and session security for the DICT Project. It uses Laravel Sanctum for API authentication with cookie-based sessions for the SPA.

## ✨ Features

- **User Login**: Email and password authentication
- **User Logout**: Secure session termination
- **User Registration**: New account creation (if enabled)
- **Password Reset**: Forgotten password recovery
- **Change Password**: User-initiated password change
- **Force Password Change**: Admin-mandated password updates
- **Account Locking**: Automatic lockout after failed attempts
- **Session Management**: Secure session handling
- **Login Activity Tracking**: Monitor login history
- **Remember Me**: Extended session option

## 👥 User Roles & Permissions

### All Users
- Can login with valid credentials
- Can logout
- Can view their profile
- Can change their password
- Must reset password if forced

### Admin
- Can force password changes for users
- Can unlock locked accounts
- Can view login activity logs
- Can manage user accounts

## 🗄️ Database Schema

### Users Table

```sql
users
├── id                      # Primary key
├── name                    # Full name
├── email                   # Email (unique)
├── password                # Hashed password
├── role_id                 # Foreign key to roles
├── office_id               # Foreign key to offices
├── position_id             # Foreign key to positions
├── is_active               # Account status
├── is_locked               # Lock status
├── locked_until            # Lock expiration
├── failed_login_attempts   # Failed attempt counter
├── force_password_change   # Force change flag
├── password_changed_at     # Last password change
├── last_login_at           # Last successful login
├── email_verified_at       # Email verification
├── remember_token          # Remember me token
├── created_at              # Creation timestamp
└── updated_at              # Update timestamp
```

### Login Activities Table

```sql
login_activities
├── id                  # Primary key
├── user_id             # Foreign key (nullable)
├── email               # Attempted email
├── ip_address          # IP address
├── user_agent          # Browser/device info
├── successful          # Success flag
├── failed_reason       # Failure reason
├── created_at          # Attempt timestamp
└── updated_at          # Update timestamp
```

## 🔌 API Endpoints

### Login

**POST** `/api/login`

Authenticate user and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "remember": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "employee"
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `423 Locked`: Account locked
- `403 Forbidden`: Account inactive
- `422 Unprocessable Entity`: Validation errors

### Logout

**POST** `/api/logout`

Terminate current session.

**Headers:** `Authorization: Bearer {token}` or session cookie

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User

**GET** `/api/user`

Retrieve authenticated user information.

**Headers:** `Authorization: Bearer {token}` or session cookie

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "employee",
    "office": {
      "id": 1,
      "name": "IT Department"
    },
    "position": {
      "id": 5,
      "title": "Software Developer"
    }
  }
}
```

### Change Password

**POST** `/api/change-password`

Change user's password.

**Request:**
```json
{
  "current_password": "OldPassword123!",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `422 Unprocessable Entity`: Validation errors
- `401 Unauthorized`: Current password incorrect

### Forgot Password

**POST** `/api/forgot-password`

Request password reset link.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

### Reset Password

**POST** `/api/reset-password`

Reset password using token.

**Request:**
```json
{
  "email": "user@example.com",
  "token": "reset_token_here",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## 💻 Frontend Components

### Pages

**Login Page** (`src/pages/login/Login.jsx`)
- Email and password input fields
- Remember me checkbox
- Login button
- Forgot password link
- Registration link (if enabled)
- Error message display
- Loading state

**Force Change Password** (`src/pages/forceChangePassword/ForceChangePassword.jsx`)
- Current password field
- New password field
- Confirm password field
- Submit button
- Password strength indicator

**Locked Account** (`src/pages/lockedAccount/LockedAccount.jsx`)
- Lock notification
- Countdown timer
- Contact administrator link

### Components

**LoginForm** (`src/components/auth/LoginForm.jsx`)
```javascript
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const { login, isLoading } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

**ProtectedRoute** (`src/components/auth/ProtectedRoute.jsx`)
```javascript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}
```

## 🗃️ State Management

### Auth Store (`src/stores/authStore.js`)

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: true 
      }),

      logout: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),

      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),

      hasRole: (role) => {
        const user = get().user;
        return user?.role === role;
      },

      hasAnyRole: (roles) => {
        const user = get().user;
        return roles.includes(user?.role);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### Custom Hook (`src/hooks/useAuth.js`)

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { login as loginApi, logout as logoutApi } from '@/api/auth/authApi';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser, logout: logoutStore, user } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setUser(data.user);
      navigate('/dashboard');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
      navigate('/login');
    },
  });

  return {
    user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
  };
}
```

## 📜 Business Rules

### Password Policy

1. Minimum 8 characters
2. Must contain:
   - Uppercase letter (A-Z)
   - Lowercase letter (a-z)
   - Number (0-9)
   - Special character (!@#$%^&*)
3. Cannot be:
   - Previously used password
   - Common password (checked against database)
   - Username or email
4. Must change every 90 days (configurable)

### Account Locking

1. **Trigger**: 5 consecutive failed login attempts
2. **Duration**: 30 minutes (configurable)
3. **Reset**: Successful login or manual unlock by admin
4. **Notification**: Email sent to user about locked account

### Session Management

1. **Session Duration**: 120 minutes (configurable)
2. **Idle Timeout**: 30 minutes (configurable)
3. **Remember Me**: Extends session to 30 days
4. **Concurrent Sessions**: Limited to 1 per user (configurable)

## 🔄 Authentication Workflow

### Login Flow

```
1. User visits login page
2. User enters email and password
3. Frontend validates input
4. Frontend calls /api/login
5. Backend validates credentials
6. Backend checks account status (active, not locked)
7. If valid:
   a. Create session
   b. Reset failed login attempts
   c. Log login activity
   d. Return user data
8. Frontend stores user in state
9. Frontend redirects to dashboard
```

### Logout Flow

```
1. User clicks logout button
2. Frontend calls /api/logout
3. Backend destroys session
4. Backend logs logout activity
5. Frontend clears auth state
6. Frontend clears query cache
7. Frontend redirects to login page
```

### Password Reset Flow

```
1. User clicks "Forgot Password"
2. User enters email
3. Backend generates reset token
4. Backend sends email with reset link
5. User clicks link in email
6. User enters new password
7. Backend validates token and password
8. Backend updates password
9. Backend invalidates token
10. User redirected to login
```

## 🛡️ Security Measures

1. **Password Hashing**: bcrypt with cost factor 12
2. **CSRF Protection**: Sanctum CSRF tokens
3. **Rate Limiting**: 5 login attempts per minute per IP
4. **Session Security**: 
   - HttpOnly cookies
   - Secure flag in production
   - SameSite=Lax
5. **Brute Force Protection**: Account locking
6. **Activity Logging**: All auth events logged
7. **IP Tracking**: Monitor suspicious activity
8. **Email Verification**: Optional email verification

## 🐛 Common Issues & Solutions

### Issue: "CSRF token mismatch"

**Solution:**
1. Ensure CSRF cookie is fetched before login:
   ```javascript
   await api.get('/sanctum/csrf-cookie');
   ```
2. Check CORS configuration
3. Verify domain in `SANCTUM_STATEFUL_DOMAINS`

### Issue: "401 Unauthorized" after refresh

**Solution:**
1. Check if cookies are being sent
2. Verify `withCredentials: true` in Axios
3. Check session configuration
4. Ensure session driver is working

### Issue: Account locked unexpectedly

**Solution:**
1. Check failed login attempts in database
2. Verify lock duration configuration
3. Admin can manually unlock account

### Issue: Password reset email not received

**Solution:**
1. Check mail configuration
2. Verify email queue is processing
3. Check spam folder
4. Verify email exists in database

## 📊 Monitoring

### Metrics to Track

1. **Login Success Rate**: Successful / Total attempts
2. **Failed Login Attempts**: Track suspicious patterns
3. **Account Lockouts**: Monitor frequency
4. **Password Resets**: Track reset requests
5. **Session Duration**: Average session length

### Logs to Monitor

1. Failed login attempts
2. Account lockouts
3. Password changes
4. Password resets
5. Suspicious IP addresses

## 🚀 Future Enhancements

- [ ] Two-Factor Authentication (2FA)
- [ ] Social login (Google, Microsoft)
- [ ] Biometric authentication
- [ ] Single Sign-On (SSO)
- [ ] OAuth 2.0 support
- [ ] Device management
- [ ] Session management UI

---

*Authentication is the gateway to the system. Keep it secure!*

