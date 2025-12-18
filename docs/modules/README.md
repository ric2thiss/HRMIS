# Modules Documentation

## 📋 Overview

This section contains detailed documentation for each feature module in the DICT Project. Each module document provides comprehensive information about functionality, implementation, and usage.

## 📚 Available Modules

### Core Modules

1. **[Authentication](./AUTHENTICATION.md)**
   - User login/logout
   - Password management
   - Session handling
   - Account security

2. **[Attendance Management](./ATTENDANCE.md)**
   - Daily time-in/time-out
   - Attendance tracking
   - DTR generation
   - Attendance reports

3. **[Leave Management](./LEAVE_MANAGEMENT.md)**
   - Leave applications
   - Approval workflows
   - Leave credits tracking
   - Leave types management

4. **[Personal Data Sheet (PDS)](./PDS.md)**
   - Employee information management
   - Multi-section forms
   - PDF generation
   - Document management

5. **[User Management](./USER_MANAGEMENT.md)**
   - User accounts CRUD
   - Role assignment
   - Employee directory
   - Account status management

6. **[Dashboard](./DASHBOARD.md)**
   - Admin dashboard
   - HR dashboard
   - Employee dashboard
   - Analytics and reports

7. **[Master Lists](./MASTER_LISTS.md)**
   - Offices
   - Positions
   - Leave types
   - Employment types
   - Project listings

8. **[Approval Workflows](./APPROVAL.md)**
   - Multi-level approvals
   - Approval authorities
   - Notification system
   - Approval history

## 🎯 Module Architecture

Each module typically consists of:

### Backend Components
- **Controller**: Handles HTTP requests and responses
- **Service**: Contains business logic
- **Repository** (optional): Data access layer
- **Model**: Database entity representation
- **Request**: Form validation
- **Resource**: API response formatting
- **Policy**: Authorization logic
- **Migration**: Database schema
- **Seeder**: Sample data

### Frontend Components
- **Pages**: Main module views
- **Components**: Reusable UI components
- **API Service**: Backend communication
- **Store**: State management (if needed)
- **Hooks**: Reusable logic
- **Utils**: Helper functions

## 📂 Module Structure Example

### Backend (Leave Management)

```
server/app/
├── Http/
│   ├── Controllers/
│   │   └── LeaveController.php
│   ├── Requests/
│   │   ├── StoreLeaveRequest.php
│   │   └── UpdateLeaveRequest.php
│   └── Resources/
│       └── LeaveResource.php
├── Models/
│   ├── Leave.php
│   └── LeaveType.php
├── Services/
│   └── LeaveService.php
├── Policies/
│   └── LeavePolicy.php
└── Repositories/
    └── LeaveRepository.php

database/
├── migrations/
│   ├── 2024_01_01_create_leaves_table.php
│   └── 2024_01_02_create_leave_types_table.php
└── seeders/
    └── LeaveTypeSeeder.php

routes/
└── api.php (leave endpoints)
```

### Frontend (Leave Management)

```
client/src/
├── pages/
│   └── leave/
│       ├── LeaveApplications.jsx
│       ├── MyLeaves.jsx
│       └── LeaveApproval.jsx
├── components/
│   └── features/
│       ├── LeaveForm.jsx
│       ├── LeaveCard.jsx
│       └── LeaveApprovalModal.jsx
├── api/
│   └── leave/
│       └── leaveApi.js
├── stores/
│   └── leaveStore.js
└── hooks/
    └── useLeaveData.js
```

## 🔄 Module Integration

### API Integration Pattern

```javascript
// Frontend calls API
const { data } = useQuery({
  queryKey: ['leaves'],
  queryFn: getLeaves,
});

// API service
export const getLeaves = async () => {
  const response = await api.get('/leave/applications');
  return response.data;
};
```

### State Management Pattern

```javascript
// Zustand store (if needed for complex state)
export const useLeaveStore = create((set) => ({
  selectedLeave: null,
  setSelectedLeave: (leave) => set({ selectedLeave: leave }),
}));

// React Query for server state
const { data: leaves } = useQuery({
  queryKey: ['leaves'],
  queryFn: getLeaves,
});
```

## 🛠️ Common Module Features

### CRUD Operations

Most modules implement standard CRUD:

**Backend:**
```php
class ResourceController extends Controller
{
    public function index()     // GET /resource
    public function store()     // POST /resource
    public function show($id)   // GET /resource/{id}
    public function update($id) // PUT /resource/{id}
    public function destroy($id)// DELETE /resource/{id}
}
```

**Frontend:**
```javascript
// List
const { data } = useQuery(['resources'], getResources);

// Create
const createMutation = useMutation({
  mutationFn: createResource,
  onSuccess: () => queryClient.invalidateQueries(['resources']),
});

// Update
const updateMutation = useMutation({
  mutationFn: updateResource,
  onSuccess: () => queryClient.invalidateQueries(['resources']),
});

// Delete
const deleteMutation = useMutation({
  mutationFn: deleteResource,
  onSuccess: () => queryClient.invalidateQueries(['resources']),
});
```

### Authorization Pattern

```php
// Backend Policy
class ResourcePolicy
{
    public function view(User $user, Resource $resource)
    {
        return $user->id === $resource->user_id || 
               $user->role === 'admin';
    }
}

// In Controller
$this->authorize('view', $resource);
```

```javascript
// Frontend
const { user } = useAuth();

const canEdit = resource.user_id === user.id || user.role === 'admin';

{canEdit && <EditButton />}
```

### Validation Pattern

```php
// Backend Request
class StoreResourceRequest extends FormRequest
{
    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ];
    }
}
```

```javascript
// Frontend
const errors = {};
if (!formData.name) {
  errors.name = 'Name is required';
}
if (formData.name.length > 255) {
  errors.name = 'Name must not exceed 255 characters';
}
```

## 📊 Module Relationships

```
User
├── has many Attendances
├── has many LeaveApplications
├── has one PersonalDataSheet
├── belongs to Office
├── belongs to Position
└── belongs to Role

Leave Application
├── belongs to User
├── belongs to LeaveType
└── belongs to User (approver)

Attendance
└── belongs to User

Personal Data Sheet
└── belongs to User

Office
└── has many Users

Position
└── has many Users
```

## 🚀 Adding a New Module

### Checklist

**Backend:**
- [ ] Create migration
- [ ] Create model
- [ ] Create controller
- [ ] Create form requests
- [ ] Create resource
- [ ] Create policy (if needed)
- [ ] Define routes
- [ ] Add seeders (if needed)
- [ ] Write tests

**Frontend:**
- [ ] Create pages
- [ ] Create components
- [ ] Create API service
- [ ] Add routes
- [ ] Create store (if needed)
- [ ] Add to navigation
- [ ] Style components
- [ ] Write tests

**Documentation:**
- [ ] Update this README
- [ ] Create module documentation
- [ ] Update API documentation
- [ ] Add examples

## 📖 Documentation Template

Each module document should include:

1. **Overview**: What the module does
2. **Features**: List of features
3. **User Roles**: Role-specific functionality
4. **Database Schema**: Tables and relationships
5. **API Endpoints**: Complete endpoint documentation
6. **Frontend Components**: Component overview
7. **State Management**: State structure
8. **Business Rules**: Important logic
9. **Workflows**: Step-by-step processes
10. **Troubleshooting**: Common issues

## 📞 Module-Specific Questions?

Refer to individual module documentation for detailed information about specific features and implementation details.

---

*Each module is designed to be independent yet integrated for a cohesive system experience.*

