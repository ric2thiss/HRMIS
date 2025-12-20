# DICT HRMIS Documentation

## 📖 Overview

Welcome to the DICT (Department of Information and Communications Technology) Human Resources Management Information System (HRMIS) documentation. This system is designed to streamline HR operations including employee management, leave management, attendance tracking, and more.

## 🏗️ System Architecture

### Frontend
- **Framework**: React 19 with Vite
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **API Communication**: Axios
- **Real-time**: Socket.IO Client

### Backend
- **Framework**: Laravel 12
- **Authentication**: Laravel Sanctum
- **Database**: SQLite (development), MySQL/PostgreSQL (production)
- **API**: RESTful API architecture
- **Real-time**: Socket.IO Server

## 👥 User Roles

The system has three main roles:

1. **Admin** - Full system access with administrative privileges
2. **HR** - Human Resources management access
3. **Employee** - Basic employee self-service access

## 📚 Documentation Structure

### Step 1: Getting Started
Start here if you're new to the project:
- **[Documentation Guide](./DOCUMENTATION_GUIDE.md)** - How to use and maintain this documentation
- **[Setup Guide](./setup/README.md)** - Installation and configuration instructions

### Step 2: System Setup
Follow these guides in order:
1. **[Prerequisites](./setup/PREREQUISITES.md)** - Required software and tools
2. **[Installation](./setup/INSTALLATION.md)** - Step-by-step installation
3. **[Configuration](./setup/CONFIGURATION.md)** - Environment and system setup
4. **[Deployment](./setup/DEPLOYMENT.md)** - Production deployment guide

### Step 3: Understanding the System
Learn about the system architecture and features:
- **[Modules Documentation](./modules/README.md)** - Feature-by-feature documentation
- **[API Documentation](./api/README.md)** - Complete API reference

### Step 4: Development
For developers working on the system:
- **[Architecture](./general/ARCHITECTURE.md)** - System architecture overview
- **[API Conventions](./general/API_CONVENTIONS.md)** - API design standards
- **[Security](./general/SECURITY.md)** - Security best practices

## 🎯 Core Features

### 1. Authentication & User Management
- User login/logout
- Account management
- Role-based access control
- Password management
- Account locking

### 2. Personal Data Sheet (PDS)
- Employee information management
- Multi-section forms
- Submission and approval workflow
- PDF generation

### 3. Leave Management
- Leave application submission
- Multi-level approval workflows
- Leave credits tracking
- Leave type management

### 4. Attendance Management
- Daily Time Record (DTR) tracking
- Attendance import
- Attendance viewing and reports

### 5. Announcements
- Create and manage announcements
- Announcement reactions
- Archive management

### 6. Notifications
- Real-time notifications
- Notification management

### 7. Master Lists
- Offices management
- Positions management
- Projects management
- Roles management
- Leave types
- Employment types
- Approval names
- Special capabilities

### 8. System Administration
- System maintenance mode
- System version management
- Admin dashboard
- HR dashboard

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

# Frontend setup
cd ../client
npm install

# Run development servers
cd ../server
composer run dev
```

Visit `http://localhost:5173` for the frontend.

## 📞 Support

For questions or issues:
1. Check the relevant documentation section
2. Review the troubleshooting guides
3. Contact the development team

---

*Last Updated: January 2025*
