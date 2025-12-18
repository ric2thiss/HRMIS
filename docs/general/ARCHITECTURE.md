# Architecture Overview

## 📋 System Architecture

The DICT Project follows a modern **full-stack architecture** with clear separation between frontend and backend.

```
┌─────────────────────────────────────────────────────────────┐
│                         User/Browser                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Nginx Web Server                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Static Assets (React SPA) │ API Proxy to Laravel      │ │
│  └────────────┬──────────────────────────┬─────────────────┘ │
└───────────────┼──────────────────────────┼───────────────────┘
                │                          │
     ┌──────────▼──────────┐    ┌─────────▼────────────┐
     │   Frontend (React)   │    │  Backend (Laravel)   │
     │  ┌────────────────┐  │    │  ┌───────────────┐  │
     │  │   Components   │  │    │  │  Controllers  │  │
     │  ├────────────────┤  │    │  ├───────────────┤  │
     │  │     Pages      │  │    │  │   Services    │  │
     │  ├────────────────┤  │    │  ├───────────────┤  │
     │  │     Stores     │  │    │  │ Repositories  │  │
     │  │   (Zustand)    │  │    │  ├───────────────┤  │
     │  ├────────────────┤  │    │  │    Models     │  │
     │  │  React Query   │◄─┼────┼──┤  (Eloquent)   │  │
     │  │   (Data Fetch) │  │    │  └───────┬───────┘  │
     │  └────────────────┘  │    │          │          │
     └─────────────────────┘    └──────────┼──────────┘
                                            │
                                   ┌────────▼───────┐
                                   │    Database    │
                                   │ SQLite/MySQL   │
                                   └────────────────┘
```

## 🏗️ Architecture Principles

### 1. **Separation of Concerns**
- Frontend handles UI/UX and client-side logic
- Backend handles business logic and data management
- Clear API contract between frontend and backend

### 2. **RESTful API Design**
- Stateless communication
- Resource-based endpoints
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON data format

### 3. **Security First**
- Authentication via Laravel Sanctum
- Role-based access control (RBAC)
- CSRF protection
- Input validation and sanitization

### 4. **Scalability**
- Stateless backend (horizontal scaling)
- Caching strategies (Redis)
- Queue system for async tasks
- Database optimization

### 5. **Maintainability**
- Clean code practices
- Design patterns (Repository, Service)
- Comprehensive documentation
- Automated testing

## 🎨 Frontend Architecture (React)

### Component Hierarchy

```
App
├── Routes
│   ├── PublicRoutes
│   │   ├── Landing
│   │   ├── Login
│   │   └── SignUp
│   └── PrivateRoutes
│       ├── Layout (Header + Sidebar + Footer)
│       │   ├── Dashboard
│       │   ├── Attendance
│       │   ├── Leave Management
│       │   ├── PDS
│       │   └── [Other Modules]
│       └── Profile
```

### State Management Strategy

**1. Server State (React Query)**
- API data fetching and caching
- Automatic background refetching
- Optimistic updates
- Loading and error states

```javascript
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
```

**2. Global Client State (Zustand)**
- Authentication state
- User preferences
- UI state (modals, sidebars)
- Form state across components

```javascript
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

**3. Local Component State (useState)**
- Form inputs
- UI toggles
- Component-specific temporary data

```javascript
const [isOpen, setIsOpen] = useState(false);
```

### Data Flow

```
Component → Hook (useQuery) → API Service → Axios → Backend API
                                                        │
Component ← Store Update ← Query Cache ← Response ←────┘
```

### Routing Structure

```javascript
// Public routes
/                          # Landing page
/login                     # Login page
/signup                    # Registration

// Private routes (authenticated)
/dashboard                 # Main dashboard
/attendance                # Attendance module
/attendance/my-attendance  # Personal attendance
/leave                     # Leave management
/leave/applications        # Leave applications
/leave/my-leaves           # Personal leaves
/pds                       # Personal Data Sheet
/pds/edit                  # Edit PDS
/employees                 # Employee directory
/profile                   # User profile
/admin/*                   # Admin routes
```

## 🔧 Backend Architecture (Laravel)

### Layered Architecture

```
Request → Middleware → Controller → Service → Repository → Model → Database
                                       ↓
                                   Business Logic
                                       ↓
Response ← Resource/Collection ← Service Return Value
```

### Layer Responsibilities

**1. Routes (`routes/api.php`)**
- Define API endpoints
- Apply middleware
- Group related routes

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('users', UserController::class);
});
```

**2. Middleware**
- Authentication (`auth:sanctum`)
- Authorization (permissions)
- Request logging
- Rate limiting

**3. Controllers**
- Receive HTTP requests
- Validate input (using Form Requests)
- Call service layer
- Return HTTP responses

```php
class UserController extends Controller
{
    public function __construct(
        private UserService $userService
    ) {}

    public function index()
    {
        $users = $this->userService->getAllUsers();
        return UserResource::collection($users);
    }
}
```

**4. Form Requests**
- Input validation
- Authorization logic
- Data preparation

```php
class StoreUserRequest extends FormRequest
{
    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
        ];
    }
}
```

**5. Services**
- Business logic
- Transaction management
- Complex operations
- Multiple model coordination

```php
class UserService
{
    public function createUser(array $data)
    {
        DB::beginTransaction();
        try {
            $user = User::create($data);
            $user->assignRole('employee');
            
            DB::commit();
            return $user;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
```

**6. Repositories (Optional)**
- Data access layer
- Query abstraction
- Complex queries

```php
class UserRepository
{
    public function findByEmail(string $email)
    {
        return User::where('email', $email)->first();
    }
}
```

**7. Models (Eloquent)**
- Database table representation
- Relationships
- Accessors/Mutators
- Query scopes

```php
class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
    protected $hidden = ['password'];
    
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}
```

**8. Resources**
- API response formatting
- Data transformation
- Consistent JSON structure

```php
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
        ];
    }
}
```

### API Response Structure

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe"
  },
  "message": "User retrieved successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 100
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

## 🗄️ Database Design

### Design Principles

1. **Normalization**: Tables are normalized to 3NF to reduce redundancy
2. **Relationships**: Proper foreign key constraints
3. **Indexes**: Strategic indexes for frequently queried columns
4. **Soft Deletes**: Important records use soft deletes
5. **Timestamps**: All tables have `created_at` and `updated_at`
6. **UUIDs**: Consider UUIDs for sensitive tables

### Key Tables

**Users Table**
```sql
users
- id (PK)
- name
- email (unique)
- password
- role_id (FK)
- office_id (FK)
- position_id (FK)
- is_active
- last_login_at
- created_at
- updated_at
```

**Attendance Table**
```sql
attendance
- id (PK)
- user_id (FK)
- date
- time_in
- time_out
- status (present, late, absent)
- remarks
- created_at
- updated_at
```

**Leave Applications Table**
```sql
leave_applications
- id (PK)
- user_id (FK)
- leave_type_id (FK)
- start_date
- end_date
- days_count
- reason
- status (pending, approved, rejected)
- approved_by (FK)
- approved_at
- created_at
- updated_at
```

### Relationships

```
User
├── hasMany Attendance
├── hasMany LeaveApplications
├── hasOne PersonalDataSheet
├── belongsTo Office
├── belongsTo Position
└── belongsTo Role

Office
└── hasMany Users

LeaveApplication
├── belongsTo User
├── belongsTo LeaveType
└── belongsTo User (approver)
```

## 🔐 Authentication & Authorization

### Authentication Flow

```
1. User submits credentials
2. Laravel validates credentials
3. Sanctum generates token
4. Token sent to client (httpOnly cookie)
5. Client includes token in subsequent requests
6. Middleware validates token
7. Request proceeds or rejected
```

### Authorization Strategy

**Roles:**
- Admin: Full system access
- HR: HR module access, employee management
- Employee: Self-service access

**Permissions:**
- view-users
- create-users
- edit-users
- delete-users
- approve-leaves
- etc.

**Implementation:**
```php
// In Controller
$this->authorize('update', $user);

// In Policy
public function update(User $authUser, User $user)
{
    return $authUser->id === $user->id || 
           $authUser->role === 'admin';
}
```

## 📊 Performance Optimization

### Caching Strategy

**1. Application Cache (Redis)**
- User sessions
- Query results
- Computed data

**2. HTTP Cache**
- Static assets (1 year)
- API responses (where appropriate)

**3. Database Query Optimization**
- Eager loading relationships
- Indexed columns
- Query result caching

### Queue System

Async processing for:
- Email notifications
- Report generation
- Bulk operations
- External API calls

```php
// Dispatch job
SendLeaveApprovalNotification::dispatch($leave);

// Job class
class SendLeaveApprovalNotification implements ShouldQueue
{
    public function handle()
    {
        // Send email
    }
}
```

## 📈 Monitoring & Logging

### Application Logs

**Laravel Logs:**
- Location: `storage/logs/laravel.log`
- Levels: debug, info, warning, error, critical
- Rotation: Daily

**Custom Logging:**
```php
Log::info('User login', ['user_id' => $user->id]);
Log::error('Payment failed', ['error' => $e->getMessage()]);
```

### HTTP Request Logging

Track:
- Request URL and method
- Response status and time
- User information
- IP address

### System Monitoring

- Server resources (CPU, memory, disk)
- Database performance
- API response times
- Error rates

## 🚀 Scalability Considerations

### Horizontal Scaling

- Stateless backend design
- Session storage in Redis
- File storage in S3/shared storage
- Load balancer ready

### Database Scaling

- Read replicas for reporting
- Sharding for large datasets
- Connection pooling
- Query optimization

### Caching Layers

- Application cache (Redis)
- CDN for static assets
- Query result caching
- Full-page caching (where applicable)

## 📚 Design Patterns Used

### Backend
- **Repository Pattern**: Data access abstraction
- **Service Layer Pattern**: Business logic separation
- **Factory Pattern**: Object creation
- **Observer Pattern**: Event listeners
- **Strategy Pattern**: Different implementations

### Frontend
- **Component Pattern**: Reusable UI components
- **Container/Presentational**: Logic vs UI separation
- **Custom Hooks**: Reusable logic
- **HOC**: Component enhancement
- **Render Props**: Flexible rendering

## 🔄 Data Synchronization

### Real-time Updates
- Polling for critical data
- Event-driven updates (consider WebSockets for future)
- Optimistic UI updates

### Offline Support
- Service workers (PWA)
- Local storage for temporary data
- Sync on reconnection

## 📞 Further Reading

- [API Conventions](./API_CONVENTIONS.md)
- [State Management](./STATE_MANAGEMENT.md)
- [Security](./SECURITY.md)
- [Testing](./TESTING.md)

---

*This architecture is designed to be maintainable, scalable, and secure for government/enterprise use.*

