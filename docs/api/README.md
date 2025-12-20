# API Documentation

## 📋 Overview

This document provides a complete reference for all API endpoints in the DICT HRMIS. The API follows RESTful conventions and uses Laravel Sanctum for authentication.

## 🔗 Base URL

- **Development**: `http://localhost:8000/api`
- **Production**: `https://your-domain.com/api`

## 🔐 Authentication

The API uses Laravel Sanctum for authentication. Include the bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

Tokens are obtained through the login endpoint.

## 📚 API Endpoints

### Authentication Endpoints

#### Step 1: Register
```http
POST /api/v1/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password",
  "password_confirmation": "password"
}
```

**Response:** User object with token

#### Step 2: Login
```http
POST /api/v1/login
```

**Request Body:**
```json
{
  "email": "admin@dict.gov.ph",
  "password": "password"
}
```

**Response:** User object with token

#### Step 3: Logout
```http
POST /api/v1/logout
```

**Headers:** `Authorization: Bearer {token}`

**Response:** Success message

#### Step 4: Get Profile
```http
GET /api/v1/profile
```

**Headers:** `Authorization: Bearer {token}`

**Response:** User profile object

#### Step 5: Update Profile
```http
PUT /api/v1/profile
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

#### Step 6: Change Password
```http
POST /api/v1/change-password
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "password": "newpassword",
  "password_confirmation": "newpassword"
}
```

### User Management Endpoints (HR Only)

#### Get All Users
```http
GET /api/v1/users
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

**Query Parameters:**
- `page` - Page number
- `per_page` - Items per page
- `search` - Search term

#### Update User
```http
PUT /api/v1/users/{id}
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

#### Delete User
```http
DELETE /api/v1/users/{id}
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

#### Toggle User Lock
```http
PUT /api/v1/users/{id}/toggle-lock
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

### Personal Data Sheet (PDS) Endpoints

#### Get My PDS
```http
GET /api/v1/pds/my-pds
```

**Headers:** `Authorization: Bearer {token}`

#### Get All PDS
```http
GET /api/v1/pds
```

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `status` - Filter by status (draft, submitted, approved, returned)
- `page` - Page number

#### Create PDS
```http
POST /api/v1/pds
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:** PDS data object

#### Get PDS by ID
```http
GET /api/v1/pds/{id}
```

**Headers:** `Authorization: Bearer {token}`

#### Update PDS
```http
PUT /api/v1/pds/{id}
```

**Headers:** `Authorization: Bearer {token}`

#### Submit PDS
```http
POST /api/v1/pds/{id}/submit
```

**Headers:** `Authorization: Bearer {token}`

#### Review PDS (HR Only)
```http
POST /api/v1/pds/{id}/review
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

**Request Body:**
```json
{
  "action": "approve", // or "decline"
  "remarks": "Optional remarks"
}
```

### Leave Management Endpoints

#### Get My Leave Credits
```http
GET /api/v1/leaves/my-leave-credits
```

**Headers:** `Authorization: Bearer {token}`

#### Get My Leaves
```http
GET /api/v1/leaves/my-leaves
```

**Headers:** `Authorization: Bearer {token}`

#### Get All Leaves
```http
GET /api/v1/leaves
```

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `status` - Filter by status
- `page` - Page number

#### Create Leave Application
```http
POST /api/v1/leaves
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "leave_type_id": 1,
  "start_date": "2025-01-15",
  "end_date": "2025-01-17",
  "reason": "Family vacation",
  "commutation": false
}
```

#### Get Leave by ID
```http
GET /api/v1/leaves/{id}
```

**Headers:** `Authorization: Bearer {token}`

#### Update Leave
```http
PUT /api/v1/leaves/{id}
```

**Headers:** `Authorization: Bearer {token}`

#### Approve/Reject Leave
```http
POST /api/v1/leaves/{id}/approve
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "action": "approve", // or "reject"
  "remarks": "Optional remarks"
}
```

#### Get My Pending Approvals
```http
GET /api/v1/leaves/my-pending-approvals
```

**Headers:** `Authorization: Bearer {token}`

### Attendance Endpoints

#### Get Attendance
```http
GET /api/v1/attendance
```

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `user_id` - Filter by user (HR/Admin only)
- `start_date` - Start date filter
- `end_date` - End date filter
- `page` - Page number

#### Import Attendance (HR Only)
```http
POST /api/v1/attendance/import
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

**Request:** Multipart form data with CSV file

#### Get Import History (HR Only)
```http
GET /api/v1/attendance/import-history
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

### Announcement Endpoints

#### Get Active Announcements
```http
GET /api/v1/announcements/active
```

**Headers:** `Authorization: Bearer {token}`

#### Get All Announcements (HR Only)
```http
GET /api/v1/announcements
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

#### Create Announcement (HR Only)
```http
POST /api/v1/announcements
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

**Request Body:**
```json
{
  "title": "Announcement Title",
  "content": "Announcement content",
  "recipient_type": "all", // or "specific"
  "recipient_ids": [] // if specific
}
```

#### Get Announcement by ID
```http
GET /api/v1/announcements/{id}
```

**Headers:** `Authorization: Bearer {token}`

#### React to Announcement
```http
POST /api/v1/announcements/{id}/react
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "reaction": "like" // or "remove"
}
```

### Notification Endpoints

#### Get Notifications
```http
GET /api/v1/notifications
```

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `read` - Filter by read status (true/false)
- `page` - Page number

#### Get Unread Count
```http
GET /api/v1/notifications/unread-count
```

**Headers:** `Authorization: Bearer {token}`

#### Mark Notification as Read
```http
PUT /api/v1/notifications/{id}/read
```

**Headers:** `Authorization: Bearer {token}`

#### Mark All as Read
```http
PUT /api/v1/notifications/mark-all-read
```

**Headers:** `Authorization: Bearer {token}`

### Master Lists Endpoints

#### Get Master Lists
```http
GET /api/v1/master-lists
```

**Headers:** `Authorization: Bearer {token}`

**Response:** Object containing all master lists (positions, roles, projects, etc.)

#### Get Roles
```http
GET /api/v1/roles
```

**Headers:** `Authorization: Bearer {token}`

#### Create Role (HR Only)
```http
POST /api/v1/roles
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

#### Get Positions
```http
GET /api/v1/positions
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

#### Create Position (HR Only)
```http
POST /api/v1/positions
```

**Headers:** `Authorization: Bearer {token}` (HR role required)

Similar endpoints exist for:
- Projects (`/api/v1/projects`)
- Offices (`/api/v1/offices`)
- Leave Types (`/api/v1/leave-types`)
- Approval Names (`/api/v1/approval-names`)
- Special Capabilities (`/api/v1/special-capabilities`)
- Employment Types (`/api/v1/employment/types`)

### System Administration Endpoints (Admin Only)

#### Toggle Maintenance Mode
```http
PUT /api/v1/maintenance-mode
```

**Headers:** `Authorization: Bearer {token}` (Admin role required)

**Request Body:**
```json
{
  "enabled": true,
  "message": "System under maintenance",
  "allowed_login_roles": ["admin"]
}
```

#### Get System Health
```http
GET /api/v1/admin/system-health
```

**Headers:** `Authorization: Bearer {token}` (Admin role required)

#### Get Activity Logs
```http
GET /api/v1/admin/activity-logs
```

**Headers:** `Authorization: Bearer {token}` (Admin role required)

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["Error message"]
  }
}
```

## 🔒 Authorization

Most endpoints require authentication. Some endpoints require specific roles:
- **HR Only**: User management, master lists management, attendance import
- **Admin Only**: System settings, maintenance mode, system health

## 📞 Support

For API questions or issues:
1. Check the relevant module documentation
2. Review the endpoint details above
3. Contact the development team

---

*Last Updated: January 2025*

