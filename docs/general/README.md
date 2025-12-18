# General Documentation

## 📖 Overview

This section contains general technical documentation about the DICT Project architecture, conventions, and best practices.

## 📚 Documentation Sections

### [Architecture Overview](./ARCHITECTURE.md)
System architecture, technology stack, and design patterns used in the application.

- System architecture diagram
- Technology stack details
- Frontend architecture
- Backend architecture
- Database design principles
- API architecture

### [API Conventions](./API_CONVENTIONS.md)
Standards and conventions for API development and consumption.

- RESTful API guidelines
- Request/Response formats
- Authentication and authorization
- Error handling
- API versioning
- Rate limiting

### [State Management](./STATE_MANAGEMENT.md)
Frontend state management patterns and best practices.

- Zustand stores
- React Query integration
- Global state vs local state
- State persistence
- State synchronization

### [Security](./SECURITY.md)
Security practices, authentication, authorization, and data protection.

- Authentication flows
- Authorization strategies
- Data encryption
- CSRF protection
- XSS prevention
- Security best practices

### [Testing Guidelines](./TESTING.md)
Testing strategies, frameworks, and best practices.

- Unit testing
- Integration testing
- E2E testing
- Testing tools
- Test coverage goals
- CI/CD integration

## 🎯 Key Concepts

### Application Flow

```
User Request → Frontend (React) → API Call → Backend (Laravel) → Database
                                      ↓
                                  Response
                                      ↓
User Interface ← State Update ← API Response
```

### Authentication Flow

```
Login Request → Laravel Sanctum → Token Generation
                      ↓
              Token Stored in Cookie
                      ↓
         Subsequent Requests Include Token
                      ↓
              Middleware Validates Token
                      ↓
              Access Granted/Denied
```

## 🏗️ Tech Stack Summary

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Charts**: Recharts
- **PDF Generation**: jsPDF

### Backend
- **Framework**: Laravel 12
- **Language**: PHP 8.2+
- **Authentication**: Laravel Sanctum
- **Database ORM**: Eloquent
- **API**: RESTful
- **Validation**: Form Requests
- **Authorization**: Policies & Gates

### Database
- **Development**: SQLite
- **Production**: MySQL/PostgreSQL
- **Migrations**: Laravel Migrations
- **Seeding**: Laravel Seeders

### DevOps & Tools
- **Version Control**: Git
- **Package Managers**: Composer (PHP), npm (JavaScript)
- **Web Server**: Nginx
- **Process Manager**: Supervisor
- **Task Scheduler**: Cron

## 📋 Coding Standards

### PHP (Laravel Backend)

Follow PSR-12 coding standards:

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $users = User::paginate(15);
        
        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }
}
```

### JavaScript/React (Frontend)

Use ES6+ modern JavaScript:

```javascript
// Use arrow functions
const fetchUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

// Use destructuring
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

// Component naming: PascalCase
const UserList = () => {
  return <div>...</div>;
};
```

### File Naming Conventions

**Backend:**
- Controllers: `UserController.php`
- Models: `User.php`
- Migrations: `2024_01_01_000000_create_users_table.php`
- Requests: `StoreUserRequest.php`

**Frontend:**
- Components: `UserList.jsx`
- Pages: `Dashboard.jsx`
- Stores: `userStore.js`
- API Services: `userApi.js`
- Utilities: `dateHelpers.js`

## 🔄 Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/add-user-management

# Make changes and commit
git add .
git commit -m "feat: add user management functionality"

# Push to remote
git push origin feature/add-user-management

# Create pull request
# After review and approval, merge to main
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code restructuring
test: adding tests
chore: maintenance tasks
```

Examples:
```
feat: add leave application approval workflow
fix: resolve attendance calculation bug
docs: update API documentation for user endpoints
refactor: simplify authentication logic
test: add unit tests for leave credit calculation
```

## 🗂️ Project Structure

### Backend (Laravel)

```
server/
├── app/
│   ├── Http/
│   │   ├── Controllers/      # API controllers
│   │   ├── Middleware/       # Custom middleware
│   │   └── Requests/         # Form validation
│   ├── Models/              # Eloquent models
│   ├── Repositories/        # Repository pattern
│   └── Services/            # Business logic
├── config/                  # Configuration files
├── database/
│   ├── migrations/          # Database migrations
│   └── seeders/             # Database seeders
├── routes/
│   └── api.php             # API routes
└── storage/                # File storage
```

### Frontend (React)

```
client/
├── src/
│   ├── api/                # API service layer
│   ├── components/         # Reusable components
│   │   ├── common/        # Generic components
│   │   ├── features/      # Feature-specific
│   │   └── ui/            # UI components
│   ├── pages/             # Page components
│   ├── stores/            # Zustand stores
│   ├── hooks/             # Custom hooks
│   ├── routes/            # Route definitions
│   ├── utils/             # Utility functions
│   └── config/            # Configuration
└── public/                # Static assets
```

## 🎓 Learning Resources

### Laravel
- [Laravel Documentation](https://laravel.com/docs)
- [Laracasts](https://laracasts.com/)
- [Laravel Daily](https://laraveldaily.com/)

### React
- [React Documentation](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)

### General
- [MDN Web Docs](https://developer.mozilla.org/)
- [PHP The Right Way](https://phptherightway.com/)
- [JavaScript.info](https://javascript.info/)

## 📞 Questions or Clarifications?

- Review specific documentation sections linked above
- Check [Module Documentation](../modules/README.md) for feature-specific details
- Consult with the development team

---

*For detailed information on specific topics, navigate to the relevant documentation section.*

