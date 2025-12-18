# DICT Project Documentation

## 📖 Overview

Welcome to the DICT (Department of Information and Communications Technology) Project documentation. This is a comprehensive Human Resources Management System designed to streamline HR operations including attendance tracking, leave management, employee data management, and more.

## 🏗️ System Architecture

This application is built using a modern full-stack architecture:

### Frontend
- **Framework**: React 19 with Vite
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **API Communication**: Axios
- **Charts**: Recharts
- **PDF Generation**: jsPDF

### Backend
- **Framework**: Laravel 12
- **Authentication**: Laravel Sanctum
- **Database**: SQLite (development), MySQL/PostgreSQL (production ready)
- **API**: RESTful API architecture

## 📚 Documentation Structure

### [Setup Guide](./setup/README.md)
Step-by-step instructions for setting up the development environment and deploying the application.

- [Prerequisites](./setup/PREREQUISITES.md)
- [Installation](./setup/INSTALLATION.md)
- [Configuration](./setup/CONFIGURATION.md)
- [Deployment](./setup/DEPLOYMENT.md)

### [General Documentation](./general/README.md)
Architecture, coding standards, and best practices.

- [Architecture Overview](./general/ARCHITECTURE.md)
- [API Conventions](./general/API_CONVENTIONS.md)
- [State Management](./general/STATE_MANAGEMENT.md)
- [Security](./general/SECURITY.md)
- [Testing Guidelines](./general/TESTING.md)

### [Modules Documentation](./modules/README.md)
Detailed documentation for each feature module.

- [Authentication](./modules/AUTHENTICATION.md)
- [Attendance Management](./modules/ATTENDANCE.md)
- [Leave Management](./modules/LEAVE_MANAGEMENT.md)
- [Personal Data Sheet (PDS)](./modules/PDS.md)
- [User Management](./modules/USER_MANAGEMENT.md)
- [Dashboard](./modules/DASHBOARD.md)
- [Master Lists](./modules/MASTER_LISTS.md)
- [Approval Workflows](./modules/APPROVAL.md)

### [Diagrams](./diagram/README.md)
Visual representations of system architecture and workflows.

- [Entity Relationship Diagram](./diagram/erd/README.md)
- [Process Flow Diagrams](./diagram/process-flow/README.md)

## 🎯 Key Features

### 1. **Authentication & Authorization**
- Secure login/logout with session management
- Role-based access control (Admin, HR, Employee)
- Password reset and force password change
- Account locking mechanisms

### 2. **Attendance Management**
- Daily time-in/time-out recording
- Digital Time Record (DTR) generation
- Attendance reports and analytics

### 3. **Leave Management**
- Leave application submission
- Multi-level approval workflows
- Leave credits tracking
- Leave type configuration
- PDF generation for leave forms

### 4. **Personal Data Sheet (PDS)**
- Comprehensive employee information management
- Multi-section form (Personal, Family, Education, Work Experience, etc.)
- PDF export functionality
- Document management

### 5. **User Management**
- Employee account creation and management
- Role and permission assignment
- Account status management
- Bulk operations

### 6. **Dashboards**
- Admin dashboard with system analytics
- HR dashboard for HR operations
- Employee dashboard for self-service

### 7. **Master Lists**
- Offices management
- Positions management
- Employment types
- Leave types
- Approval names/authorities
- Project listings

### 8. **System Settings**
- System maintenance mode
- Configuration management
- Activity logging
- System notifications

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd DICT-Project

# Backend setup
cd server
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend setup (in a new terminal)
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` for the frontend and `http://localhost:8000` for the API.

## 🔧 Development

### Running Development Servers

```bash
# Backend (Laravel)
cd server
composer run dev

# Frontend (React + Vite)
cd client
npm run dev
```

### Building for Production

```bash
# Frontend build
cd client
npm run build

# The built files will be in client/dist/
```

## 📝 API Documentation

The API follows RESTful conventions. Base URL: `http://localhost:8000/api`

### Authentication Endpoints
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/register` - User registration
- `POST /api/forgot-password` - Password reset request

### Resource Endpoints
- `/api/attendance` - Attendance management
- `/api/leave` - Leave management
- `/api/pds` - Personal Data Sheet
- `/api/users` - User management
- `/api/master-lists` - Master data management

For detailed API documentation, see [API Conventions](./general/API_CONVENTIONS.md).

## 🧪 Testing

```bash
# Backend tests
cd server
php artisan test

# Frontend tests (if configured)
cd client
npm run test
```

## 📦 Project Structure

```
DICT-Project/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── api/           # API service layer
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand state stores
│   │   ├── hooks/         # Custom React hooks
│   │   ├── routes/        # Route definitions
│   │   └── utils/         # Utility functions
│   └── dist/              # Production build
├── server/                # Backend Laravel application
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/   # API controllers
│   │   │   ├── Middleware/    # Custom middleware
│   │   │   └── Requests/      # Form requests
│   │   ├── Models/            # Eloquent models
│   │   ├── Repositories/      # Repository pattern
│   │   └── Services/          # Business logic services
│   ├── database/
│   │   ├── migrations/        # Database migrations
│   │   └── seeders/           # Database seeders
│   └── routes/                # API routes
└── docs/                  # Documentation
```

## 🤝 Contributing

Please read the [Documentation Guide](./DOCUMENTATION_GUIDE.md) for information on maintaining and updating documentation.

## 📞 Support

For issues, questions, or contributions:
1. Check the relevant module documentation
2. Review the troubleshooting guides
3. Contact the development team

## 📄 License

[Specify License Here]

## 🔄 Version History

- **v1.0.0** - Initial release with core HR management features

---

*Last Updated: December 2025*

