# Modules Documentation

## 📋 Overview

This section contains detailed documentation for each feature module in the DICT HRMIS. Each module document provides comprehensive information about functionality, implementation, and usage.

## 📚 Available Modules

### Core Modules

1. **[Authentication](./AUTHENTICATION.md)**
   - User login/logout
   - Registration
   - Password management
   - Account locking
   - Force password change

2. **[Personal Data Sheet (PDS)](./PERSONAL_DATA_SHEET.md)**
   - Employee information management
   - Multi-section forms
   - Submission and approval workflow
   - PDF generation

3. **[Leave Management](./LEAVE_MANAGEMENT.md)**
   - Leave application submission
   - Multi-level approval workflows
   - Leave credits tracking
   - Leave type management

4. **[Attendance Management](./ATTENDANCE.md)**
   - Daily Time Record (DTR) tracking
   - Attendance import
   - Attendance viewing and reports

5. **[Announcements](./ANNOUNCEMENTS.md)**
   - Create and manage announcements
   - Announcement reactions
   - Archive management

6. **[Notifications](./NOTIFICATIONS.md)**
   - Real-time notifications
   - Notification management

7. **[Master Lists](./MASTER_LISTS.md)**
   - Offices management
   - Positions management
   - Projects management
   - Roles management
   - Leave types
   - Employment types
   - Approval names
   - Special capabilities

8. **[System Administration](./SYSTEM_ADMINISTRATION.md)**
   - System maintenance mode
   - System version management
   - Admin dashboard
   - HR dashboard

## 🎯 User Roles

The system has three main roles with different access levels:

### Admin
- Full system access
- System settings management
- Maintenance mode control
- System version management
- View all attendance records

### HR
- Employee management
- Leave management
- PDS management
- Attendance import
- Master lists management
- Announcements management
- Approvals

### Employee
- View own profile
- Manage own PDS
- Apply for leave
- View own DTR
- View announcements
- View notifications

## 📖 How to Use This Documentation

1. **For Feature Development**: Read the relevant module documentation
2. **For Understanding Workflows**: Check process flow diagrams in `../diagram/process-flow/`
3. **For API Integration**: See [API Documentation](../api/README.md)
4. **For Database Schema**: Check ERD diagrams in `../diagram/erd/`

## 🔄 Module Relationships

```
User
├── has one PersonalDataSheet
├── has many LeaveApplications
├── has many Attendances
├── belongs to Role
├── belongs to Office
├── belongs to Position
├── belongs to Project
└── has many EmploymentTypes

Leave Application
├── belongs to User
├── belongs to LeaveType
└── has approval workflow

Personal Data Sheet
├── belongs to User
└── has approval workflow

Attendance
└── belongs to User
```

## 📞 Module-Specific Questions?

Refer to individual module documentation for detailed information about specific features and implementation details.

---

*Each module is designed to be independent yet integrated for a cohesive system experience.*
