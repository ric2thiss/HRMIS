# DICT-Project Codebase Scan Report

**Generated:** 2025-01-27  
**Project Type:** Full-Stack HRMIS (Human Resource Management Information System)  
**Organization:** DICT (Department of Information and Communications Technology)

---

## 📋 Executive Summary

This is a comprehensive Human Resource Management Information System built with:
- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Laravel 12 + Sanctum Authentication
- **Database:** SQLite (with MySQL support configured)
- **State Management:** Zustand
- **Architecture:** RESTful API with role-based access control

---

## 🏗️ Project Structure

### Frontend (`/client`)
```
client/
├── src/
│   ├── api/              # API service layer
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── features/     # Feature-specific components
│   │   ├── Header/       # Header component
│   │   ├── Sidebar/      # Sidebar navigation
│   │   └── Layout/       # App layout wrapper
│   ├── pages/            # Page components
│   ├── routes/           # React Router configuration
│   ├── stores/           # Zustand state stores
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── styles/           # CSS files
├── public/               # Static assets
└── dist/                # Build output
```

### Backend (`/server`)
```
server/
├── app/
│   ├── Http/
│   │   ├── Controllers/  # API controllers
│   │   └── Middleware/   # Custom middleware
│   ├── Models/          # Eloquent models
│   ├── Services/        # Business logic services
│   └── Repositories/    # Data access layer
├── database/
│   ├── migrations/      # Database migrations
│   └── seeders/        # Database seeders
├── routes/
│   └── api.php         # API route definitions
└── config/             # Configuration files
```

---

## 🔑 Key Features

### 1. **Authentication & Authorization**
- **Authentication:** Laravel Sanctum (session-based)
- **Roles:** 
  - `employee` - Regular employees
  - `hr` - Human Resources staff
  - `admin` - System administrators
- **Features:**
  - Login/Logout with session management
  - Account locking mechanism
  - CSRF protection
  - Maintenance mode with role-based access
  - Login activity tracking

### 2. **User Management**
- Employee registration with auto-generated employee IDs
- Profile management (name, email, password, profile image)
- Account locking/unlocking (HR only)
- System settings access control (Admin only)
- Employee listing and management (HR only)

### 3. **Personal Data Sheet (PDS)**
- **Workflow:**
  - Draft → Submit → Pending → Approved/Declined/For Revision
- **Features:**
  - Create, update, delete PDS (employees)
  - Submit for approval
  - HR review and approval workflow
  - Return to owner functionality
  - Track employees without PDS
  - Send notifications to employees

### 4. **Master Lists Management (HR Only)**
- **Positions** - Job positions/designations
- **Roles** - User roles
- **Projects** - Project assignments
- **Offices** - Office locations
- **Special Capabilities** - For Job Order employees
- **Employment Types** - Plantilla, JO, etc.

### 5. **Leave Management**
- My Leave (employee view)
- Manage Leave (HR view)
- Leave application forms
- Leave approval workflow

### 6. **Daily Time Record (DTR)**
- Employee DTR viewing
- Attendance import functionality (HR)

### 7. **Dashboard Analytics**

#### HR Dashboard
- Total employees count
- Plantilla vs JO employee distribution
- Position distribution by office
- Daily login activity charts
- Module usage statistics

#### Admin Dashboard
- System health monitoring
- Database health checks
- Storage health monitoring
- Memory usage tracking
- Activity logs (login, module access, HTTP requests)
- Cache management
- Database backup functionality
- Log cleanup utilities

### 8. **System Administration**
- Maintenance mode toggle (Admin only)
- System version management
- Cache clearing
- Database backup
- Log cleanup (activity, login, HTTP requests)
- Storage cleanup

### 9. **Module Access Tracking**
- Tracks user access to different modules
- Logs module usage for analytics
- HR dashboard integration

### 10. **Notifications**
- In-app notification system
- Notification store (Zustand)
- Notification container component

---

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts with employee information
- `roles` - User roles
- `role_user` - Many-to-many user-role relationship
- `positions` - Job positions
- `projects` - Project assignments
- `offices` - Office locations
- `special_capabilities` - Special capabilities
- `user_special_capabilities` - User-capability pivot
- `employment_type` - Employment types (Plantilla, JO, etc.)
- `users_employment_types` - User-employment type pivot
- `personal_data_sheets` - PDS records with approval workflow
- `login_activities` - Login tracking
- `module_access_logs` - Module usage tracking
- `http_request_logs` - HTTP request logging
- `system_maintenance` - Maintenance mode settings

### Key Relationships
- User → Role (belongsTo + belongsToMany for backward compatibility)
- User → Position (belongsTo)
- User → Project (belongsTo)
- User → Office (belongsTo)
- User → EmploymentTypes (belongsToMany)
- User → SpecialCapabilities (belongsToMany)
- User → PersonalDataSheet (hasOne)
- User → LoginActivities (hasMany)
- User → ModuleAccessLogs (hasMany)

---

## 🔐 Security Features

1. **Authentication:**
   - Laravel Sanctum session-based auth
   - CSRF token protection
   - Password hashing (bcrypt)

2. **Authorization:**
   - Role-based access control (RBAC)
   - Middleware protection:
     - `auth:sanctum` - Authentication required
     - `role:hr` - HR role required
     - `role:admin` - Admin role required
     - `CheckAccountLocked` - Prevents locked account access
     - `maintenance` - Maintenance mode handling

3. **Account Security:**
   - Account locking mechanism
   - Forced logout on account lock
   - Session regeneration on login
   - Secure cookie handling

4. **API Security:**
   - HTTP request logging
   - Error handling and logging
   - Input validation
   - SQL injection protection (Eloquent ORM)

---

## 📦 Technology Stack

### Frontend Dependencies
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^7.9.6",
  "axios": "^1.13.2",
  "zustand": "^5.0.9",
  "lucide-react": "^0.555.0",
  "recharts": "^3.5.1",
  "jspdf": "^3.0.3",
  "html2canvas": "^1.4.1",
  "tailwindcss": "^3.4.18",
  "vite": "^7.1.7"
}
```

### Backend Dependencies
```json
{
  "php": "^8.2",
  "laravel/framework": "^12.0",
  "laravel/sanctum": "^4.2"
}
```

---

## 🛣️ API Routes Overview

### Public Routes
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /maintenance/status` - Check maintenance status
- `GET /system-version` - Get system version

### Protected Routes (Authenticated)
- `POST /api/logout` - Logout
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `GET /api/user` - Get current user

### HR Only Routes
- `GET /api/users` - Get all users
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `PUT /api/users/{id}/toggle-lock` - Lock/unlock account
- Master lists CRUD operations
- PDS management routes
- Leave management routes
- Employee management routes

### Admin Only Routes
- `PUT /api/maintenance-mode` - Toggle maintenance
- `PUT /api/system-version` - Update version
- `PUT /api/users/{id}/toggle-system-settings-access` - System access control
- Admin dashboard analytics routes
- Cache and cleanup routes

---

## 🎨 Frontend Architecture

### State Management
- **Zustand Stores:**
  - `authStore` - Authentication state, user data, login/logout
  - `notificationStore` - Notification management

### Routing
- React Router v7
- Protected routes with role-based access
- Guest routes (login, landing)
- Public routes (maintenance status)

### Component Structure
- **Layout Components:** AppLayout, Header, Sidebar
- **Feature Components:** Organized by feature in `/features`
- **UI Components:** Reusable UI elements
- **Page Components:** Full page views

### API Integration
- Centralized axios instance with interceptors
- CSRF token handling
- Error handling and retry logic
- Request/response interceptors

---

## 🔄 Key Workflows

### 1. PDS Workflow
```
Draft → Submit → Pending → [Approved | Declined | For Revision]
                              ↓
                         (Can update and resubmit)
```

### 2. User Registration
```
Form Input → Validation → Generate Employee ID → Create User → 
Attach Role → Attach Employment Type → Attach Special Capabilities
```

### 3. Login Flow
```
Login → Validate Credentials → Check Account Lock → 
Regenerate Session → Log Activity → Return User Data
```

### 4. Maintenance Mode
```
Admin Toggles → Check Allowed Roles → 
Block Non-Admin Users → Redirect to Maintenance Page
```

---

## 📊 Code Statistics

### Frontend
- **Components:** ~50+ React components
- **Pages:** 20+ page components
- **API Services:** 15+ API service files
- **Routes:** 20+ defined routes

### Backend
- **Controllers:** 13 controllers
- **Models:** 12 Eloquent models
- **Migrations:** 35+ database migrations
- **Middleware:** 4 custom middleware classes

---

## 🔍 Notable Implementation Details

1. **Employee ID Generation:**
   - Format: `[employment_type_id][year][month][incremental]`
   - Auto-generated on registration

2. **Dual Role System:**
   - Primary role via `belongsTo` relationship
   - Many-to-many roles for backward compatibility
   - Helper method `hasRole()` checks both

3. **PDS Status Management:**
   - Statuses: draft, pending, approved, declined, for-revision
   - Status transitions are controlled
   - HR comments stored for declined/for-revision

4. **Module Tracking:**
   - Automatic tracking via `useModuleTracking` hook
   - Logs stored in `module_access_logs` table
   - Used for HR dashboard analytics

5. **Maintenance Mode:**
   - Admin can toggle maintenance
   - Admin users bypass maintenance
   - Other users redirected to maintenance page
   - Public status endpoint for frontend checks

6. **Account Locking:**
   - HR can lock/unlock accounts
   - Locked accounts cannot access protected routes
   - Automatic logout on lock detection
   - Redirect to locked account info page

---

## 🚀 Development Setup

### Frontend
```bash
cd client
npm install
npm run dev      # Development server (port 5173)
npm run build    # Production build
```

### Backend
```bash
cd server
composer install
php artisan key:generate
php artisan migrate
php artisan serve  # Development server (port 8000)
```

### Environment Variables
- Frontend: `VITE_API_BASE_URL` (default: http://localhost:8000)
- Backend: Standard Laravel `.env` configuration

---

## 📝 Documentation Files Found

The project includes several documentation files:
- `CODEBASE_SCAN_REPORT_2025.md`
- `FRONTEND_UPDATE_PLAN.md`
- `FRONTEND_UPDATES_COMPLETE.md`
- `IMPLEMENTATION_SUMMARY.md`
- `MIGRATION_AND_SEEDING_COMPLETE.md`
- `PDS_2025_COMPLETE_UPDATE.md`
- `PDS_2025_FINAL_SUMMARY.md`
- `PDS_2025_UPDATE_SUMMARY.md`
- `PDS_WORKFLOW_IMPLEMENTATION.md`

---

## ⚠️ Potential Areas for Improvement

1. **Error Handling:**
   - More comprehensive error messages
   - User-friendly error displays
   - Error logging improvements

2. **Testing:**
   - Unit tests for models
   - Feature tests for controllers
   - Frontend component tests
   - E2E tests for critical workflows

3. **Performance:**
   - API response caching
   - Database query optimization
   - Frontend code splitting
   - Image optimization

4. **Security:**
   - Rate limiting on API routes
   - Input sanitization improvements
   - XSS protection enhancements
   - SQL injection prevention review

5. **Documentation:**
   - API documentation (OpenAPI/Swagger)
   - Component documentation
   - Deployment guide
   - User manual

6. **Features:**
   - Email notifications for PDS status
   - Real-time notifications (WebSockets)
   - File upload for documents
   - Advanced search and filtering

---

## 🎯 Conclusion

This is a well-structured, full-featured HRMIS application with:
- ✅ Modern tech stack (React 19, Laravel 12)
- ✅ Comprehensive role-based access control
- ✅ Complete PDS workflow management
- ✅ Analytics and reporting dashboards
- ✅ System administration tools
- ✅ Security features (account locking, maintenance mode)
- ✅ Activity tracking and logging

The codebase follows good practices with separation of concerns, modular component structure, and RESTful API design. The application is production-ready with room for enhancements in testing, documentation, and additional features.

---

**Scan completed successfully!** ✅
