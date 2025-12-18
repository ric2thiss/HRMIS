# Entity Relationship Diagrams

## 📋 Overview

This folder contains Entity Relationship Diagrams (ERD) for the DICT Project database. ERDs visualize database structure, table relationships, and data flow.

## 📁 Contents

Place your ERD files here:

- `complete-system-erd.png` - Full system database diagram
- `user-management-erd.png` - User, roles, offices, positions
- `attendance-erd.png` - Attendance-related tables
- `leave-management-erd.png` - Leave applications and types
- `pds-erd.png` - Personal Data Sheet tables

## 🗄️ Database Structure

### Core Tables

1. **users** - User accounts
2. **roles** - User roles (admin, hr, employee)
3. **offices** - Organization offices
4. **positions** - Job positions
5. **employments** - Employment types

### Module Tables

**Attendance:**
- `attendances` - Daily attendance records

**Leave Management:**
- `leave_applications` - Leave requests
- `leave_types` - Types of leaves
- `leave_credits` - User leave balances

**PDS:**
- `personal_data_sheets` - Employee PDS information
- (Additional PDS-related tables)

**System:**
- `login_activities` - Login tracking
- `http_request_logs` - API request logs
- `module_access_logs` - Module access tracking
- `system_maintenances` - Maintenance mode

## 🔗 Key Relationships

```
users
├── belongs to role
├── belongs to office
├── belongs to position
├── has many attendances
├── has many leave_applications
└── has one personal_data_sheet

leave_applications
├── belongs to user
├── belongs to leave_type
└── belongs to user (approver)

attendances
└── belongs to user
```

## 🛠️ Creating ERDs

### Using dbdiagram.io

See database structure defined in Laravel migrations at:
`server/database/migrations/`

Export diagrams showing:
- All tables and columns
- Primary keys (PK)
- Foreign keys (FK)
- Relationships (1:1, 1:N, N:M)
- Indexes

### Tools

- [dbdiagram.io](https://dbdiagram.io/) - Recommended
- MySQL Workbench - Reverse engineer from database
- Laravel ER Diagram Generator - `composer require beyondcode/laravel-er-diagram-generator`

## 📝 Naming Convention

`[scope]-[module]-erd.[format]`

Examples:
- `complete-system-erd.png`
- `module-leave-erd.png`
- `module-attendance-erd.png`

## 📚 Resources

- [Database Design Best Practices](https://www.lucidchart.com/pages/database-diagram/database-design)
- [Laravel Migrations](https://laravel.com/docs/migrations)
- [dbdiagram.io Docs](https://dbdiagram.io/docs)

---

*Place your ERD files in this folder with descriptive names.*

