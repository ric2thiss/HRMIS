# API Conventions

## 📋 Overview

This document defines the API conventions used in the DICT Project. Following these conventions ensures consistency, predictability, and ease of use across all API endpoints.

## 🌐 Base URL

```
Development: http://localhost:8000/api/v1
Production:  https://yourdomain.com/api/v1
```

**Note:** API versioning is implemented. Use `/api/v1` for all requests. Legacy routes at `/api` are maintained for backward compatibility but will be deprecated.

## 🔢 API Versioning

The API uses versioning to ensure backward compatibility and smooth transitions:

- **Current Version:** v1
- **Versioned Routes:** `/api/v1/*`
- **Legacy Routes:** `/api/*` (backward compatibility, will be deprecated)

All new endpoints should use the versioned path. Rate limiting is applied to all authenticated routes.

## 📡 RESTful Principles

### HTTP Methods

| Method | Usage | Idempotent | Safe |
|--------|-------|------------|------|
| GET | Retrieve resources | Yes | Yes |
| POST | Create new resources | No | No |
| PUT | Update entire resource | Yes | No |
| PATCH | Partial update | Yes | No |
| DELETE | Remove resources | Yes | No |

### Resource Naming

Use **plural nouns** for resource names:

✅ Good:
```
GET    /api/users
GET    /api/users/1
POST   /api/users
PUT    /api/users/1
DELETE /api/users/1
```

❌ Bad:
```
GET /api/getUsers
GET /api/user/1
POST /api/createUser
```

### Nested Resources

For relationships:

```
GET /api/users/1/attendances           # User's attendances
GET /api/users/1/leave-applications    # User's leave applications
POST /api/users/1/attendances          # Create attendance for user
```

Limit nesting to 2 levels maximum.

## 📝 Request Format

### Headers

Required headers for all requests:

```http
Content-Type: application/json
Accept: application/json
X-Requested-With: XMLHttpRequest
```

For authenticated requests:

```http
Authorization: Bearer {token}
```

Or use httpOnly cookies (Sanctum stateful):

```http
Cookie: laravel_session=...
```

### Query Parameters

**Filtering:**
```
GET /api/users?role=admin
GET /api/attendances?date=2025-01-15
GET /api/leave-applications?status=pending
```

**Sorting:**
```
GET /api/users?sort=name           # Ascending
GET /api/users?sort=-created_at    # Descending (-)
```

**Pagination:**
```
GET /api/users?page=2&per_page=15
```

**Searching:**
```
GET /api/users?search=john
GET /api/employees?search=engineering
```

**Multiple filters:**
```
GET /api/attendances?user_id=5&date_from=2025-01-01&date_to=2025-01-31
```

### Request Body (JSON)

**POST /api/users**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role_id": 3,
  "office_id": 1,
  "position_id": 5
}
```

**PUT /api/users/1**
```json
{
  "name": "John Doe Updated",
  "email": "john.new@example.com",
  "office_id": 2
}
```

**PATCH /api/users/1**
```json
{
  "office_id": 2
}
```

## ✅ Response Format

### Success Responses

**Single Resource (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "message": "User retrieved successfully"
}
```

**Collection (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe"
    },
    {
      "id": 2,
      "name": "Jane Smith"
    }
  ],
  "message": "Users retrieved successfully"
}
```

**Paginated Collection (200 OK):**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "John Doe"},
    {"id": 2, "name": "Jane Smith"}
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "to": 15,
    "per_page": 15,
    "total": 100,
    "last_page": 7
  },
  "links": {
    "first": "http://api.com/users?page=1",
    "last": "http://api.com/users?page=7",
    "prev": null,
    "next": "http://api.com/users?page=2"
  },
  "message": "Users retrieved successfully"
}
```

**Create Resource (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "John Doe",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "message": "User created successfully"
}
```

**Update Resource (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "John Doe Updated"
  },
  "message": "User updated successfully"
}
```

**Delete Resource (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**No Content (204 No Content):**
- No response body
- Used for successful DELETE operations (alternative to 200)

### Error Responses

**Validation Error (422 Unprocessable Entity):**
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The email field is required.",
      "The email must be a valid email address."
    ],
    "password": [
      "The password must be at least 8 characters."
    ]
  }
}
```

**Unauthorized (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Unauthenticated."
}
```

**Forbidden (403 Forbidden):**
```json
{
  "success": false,
  "message": "This action is unauthorized."
}
```

**Not Found (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found."
}
```

**Server Error (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "An error occurred while processing your request."
}
```

## 🔐 Authentication

### Login

**POST /api/login**

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "employee"
    },
    "token": "1|abc123..." // Only for token-based auth
  },
  "message": "Login successful"
}
```

### Logout

**POST /api/logout**

Response (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Current User

**GET /api/user**

Response (200):
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
    }
  }
}
```

## 🔢 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Invalid request syntax |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Server maintenance |

## 📄 Pagination

Default pagination: 15 items per page

**Request:**
```
GET /api/users?page=2&per_page=20
```

**Response includes:**
- `data`: Array of items
- `meta`: Pagination metadata
- `links`: Navigation links

**Laravel implementation:**
```php
$users = User::paginate(15);
return UserResource::collection($users);
```

## 🔍 Filtering and Searching

### Filter by Exact Match

```
GET /api/users?role=admin&is_active=1
```

### Filter by Range

```
GET /api/attendances?date_from=2025-01-01&date_to=2025-01-31
```

### Search

```
GET /api/users?search=john
```

**Backend implementation:**
```php
$users = User::when($request->search, function($query, $search) {
    $query->where('name', 'like', "%{$search}%")
          ->orWhere('email', 'like', "%{$search}%");
})->paginate();
```

## ⏱️ Rate Limiting

**Default limits:**
- Authenticated users: 60 requests/minute
- Login endpoint: 5 requests/minute
- Guest endpoints: 30 requests/minute

**Headers in response:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
Retry-After: 30 (seconds to wait)
```

**Rate limit exceeded (429):**
```json
{
  "success": false,
  "message": "Too many requests. Please try again in 30 seconds."
}
```

## 📅 Date/Time Format

Use ISO 8601 format:

```json
{
  "date": "2025-01-15",
  "datetime": "2025-01-15T14:30:00Z",
  "timestamp": "2025-01-15T14:30:00.000000Z"
}
```

Timezone: UTC (convert to local timezone on frontend)

## 🗂️ Resource Relationships

### Including Related Resources

```
GET /api/users/1?include=office,position,role
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "office": {
      "id": 1,
      "name": "IT Department"
    },
    "position": {
      "id": 5,
      "title": "Software Developer"
    },
    "role": {
      "id": 3,
      "name": "Employee"
    }
  }
}
```

**Backend implementation:**
```php
$user = User::with($request->get('include', []))->findOrFail($id);
```

## 🔄 Batch Operations

### Bulk Create

**POST /api/users/bulk**
```json
{
  "users": [
    {"name": "User 1", "email": "user1@example.com"},
    {"name": "User 2", "email": "user2@example.com"}
  ]
}
```

### Bulk Update

**PATCH /api/users/bulk**
```json
{
  "ids": [1, 2, 3],
  "data": {
    "is_active": false
  }
}
```

### Bulk Delete

**DELETE /api/users/bulk**
```json
{
  "ids": [1, 2, 3]
}
```

## 📊 Sorting

Single field:
```
GET /api/users?sort=name              # Ascending
GET /api/users?sort=-created_at       # Descending
```

Multiple fields:
```
GET /api/users?sort=office_id,-name
```

## 🏷️ Versioning

Current version: v1 (default, no prefix required)

Future versions:
```
GET /api/v2/users
```

Or use header:
```
Accept: application/vnd.api+json; version=2
```

## 📝 Field Selection

Request only specific fields:

```
GET /api/users?fields=id,name,email
```

Response:
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "John Doe", "email": "john@example.com"},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
  ]
}
```

## 🛡️ Security Best Practices

1. **Always validate input** using Form Requests
2. **Use authentication** for protected endpoints
3. **Implement authorization** with policies
4. **Sanitize output** to prevent XSS
5. **Use HTTPS** in production
6. **Enable CORS** properly
7. **Implement rate limiting**
8. **Log security events**

## 📚 API Endpoint Examples

### Authentication
```
POST   /api/login
POST   /api/logout
POST   /api/register
GET    /api/user
POST   /api/forgot-password
POST   /api/reset-password
POST   /api/change-password
```

### Users
```
GET    /api/users
GET    /api/users/{id}
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}
PATCH  /api/users/{id}/status
```

### Attendance
```
GET    /api/attendance
POST   /api/attendance/time-in
POST   /api/attendance/time-out
GET    /api/attendance/my-records
GET    /api/attendance/user/{id}
```

### Leave Management
```
GET    /api/leave/applications
POST   /api/leave/applications
GET    /api/leave/applications/{id}
PUT    /api/leave/applications/{id}
DELETE /api/leave/applications/{id}
POST   /api/leave/applications/{id}/approve
POST   /api/leave/applications/{id}/reject
GET    /api/leave/types
GET    /api/leave/credits
```

### Personal Data Sheet
```
GET    /api/pds
POST   /api/pds
PUT    /api/pds
GET    /api/pds/export/pdf
```

## 🧪 Testing API Endpoints

### Using cURL

```bash
# GET request
curl -X GET http://localhost:8000/api/users \
  -H "Accept: application/json"

# POST request with authentication
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Using Postman

1. Set base URL as environment variable
2. Configure authentication (Bearer Token or Cookie)
3. Set headers: `Accept: application/json`
4. Create collections for each module

## 📞 Support

For API-related questions:
- Review this document
- Check specific module documentation
- Test endpoints using Postman
- Contact the development team

---

*These conventions ensure consistent, predictable API behavior across the application.*

