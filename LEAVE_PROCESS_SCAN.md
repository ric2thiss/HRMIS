# Leave Process Scan Report

## Overview
This document provides a comprehensive scan of the leave application process across both client and server sides of the DICT-Project application.

---

## 📋 Table of Contents
1. [Client-Side Components](#client-side-components)
2. [Server-Side Implementation](#server-side-implementation)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Approval Workflow](#approval-workflow)
6. [Data Flow](#data-flow)
7. [Key Features](#key-features)

---

## 🖥️ Client-Side Components

### 1. **LeaveApplicationForm.jsx**
**Location:** `client/src/components/features/leave/LeaveApplicationForm.jsx`

**Purpose:** Form component for creating new leave applications

**Key Features:**
- Calendar-based date selection (exclusive dates)
- Working days calculation (excludes weekends)
- Leave type selection (dropdown from API)
- Approval officer selection:
  - Leave Credit Authorized Officer (required)
  - Recommendation Approver (required)
  - Leave Approver (required)
- Commutation selection (Requested/Not Requested)
- Remarks field with visibility controls
- Form validation before submission

**State Management:**
- `formData`: Contains all form fields
- `selectedDates`: Array of selected calendar dates
- `approvalNames`: Loaded from master lists API
- `leaveTypes`: Loaded from leave types API

**Validation:**
- Leave type must be selected
- At least one date must be selected
- At least one working day required
- Leave Credit Authorized Officer required
- Recommendation Approver required
- Commutation selection required

**API Calls:**
- `getAllMasterLists()` - Loads approval names
- `getLeaveTypes()` - Loads available leave types
- `createLeaveApplication()` - Submits the application

---

### 2. **MyLeaveList.jsx**
**Location:** `client/src/components/features/leave/MyLeaveList.jsx`

**Purpose:** Displays the current user's leave applications

**Key Features:**
- Filter by status (All, Pending, Approved)
- Leave credits summary display (mock data)
- Table view with:
  - Leave type and code
  - Date range
  - Working days
  - Leave approver name
  - Remarks
  - Status badge
  - Actions (Track, Cancel)
- Cancel functionality (only for pending leaves)
- Track button navigates to leave tracking page

**API Calls:**
- `getMyLeaveApplications(params)` - Fetches user's leaves with optional status filter
- `updateLeaveApplication(id, {status: 'cancelled'})` - Cancels a leave

---

### 3. **ManageLeaveList.jsx**
**Location:** `client/src/components/features/leave/ManageLeaveList.jsx`

**Purpose:** Admin/HR view for managing all leave applications

**Key Features:**
- View all leave applications (filtered by role)
- Filter by status (All, Pending, Approved)
- Approval workflow detection:
  - Checks if current user is authorized to approve at current stage
  - Implements 3-stage approval sequence check
- Approve/Reject actions (only when it's user's turn)
- Reject modal with required remarks
- Employee information display
- View application details

**Approval Logic:**
- HR/Admin can always approve
- Regular users can only approve if:
  - They are assigned as an approver for the current stage
  - Previous stages have been completed
- 3-stage sequence:
  1. Leave Credit Authorized Officer
  2. Recommendation Approver
  3. Leave Approver (final)

**API Calls:**
- `getLeaveApplications(params)` - Fetches all leaves (filtered by role)
- `getAllMasterLists()` - Loads user's approval name assignments
- `approveLeaveApplication(id, data)` - Approves/rejects leave

---

### 4. **LeaveTracking.jsx**
**Location:** `client/src/pages/leave/LeaveTracking.jsx`

**Purpose:** Detailed view of a leave application's approval workflow

**Key Features:**
- Leave application details display
- Visual approval workflow with stages:
  1. Leave Credit Authorized Officer
  2. Recommendation Approver
  3. Leave Approver
- Stage status indicators (Pending, Approved, Rejected)
- Approval timestamps and approver names
- Remarks display for each stage
- Final approval/rejection information

**Visual Elements:**
- Status icons (checkmark, X, clock)
- Connection lines between stages
- Color-coded status badges
- Approval timeline

**API Calls:**
- `getLeaveApplication(id)` - Fetches single leave application

---

### 5. **API Client (leaveApplications.js)**
**Location:** `client/src/api/leave/leaveApplications.js`

**Available Functions:**
- `getLeaveApplications(params)` - Get all leaves (role-filtered)
- `getMyLeaveApplications(params)` - Get current user's leaves
- `getLeaveApplication(id)` - Get single leave by ID
- `createLeaveApplication(data)` - Create new leave application
- `updateLeaveApplication(id, data)` - Update leave (cancel only)
- `deleteLeaveApplication(id)` - Delete pending leave
- `approveLeaveApplication(id, data)` - Approve/reject leave
- `getLeaveTypes()` - Get all leave types
- `getMyPendingApprovals()` - Get pending approvals for current approver

---

## 🖥️ Server-Side Implementation

### 1. **LeaveController.php**
**Location:** `server/app/Http/Controllers/LeaveController.php`

**Methods:**

#### `index(Request $request)`
- **Route:** `GET /api/leaves`
- **Purpose:** Get all leave applications (filtered by user role)
- **Authorization:**
  - Regular users: Only their own leaves
  - HR/Admin: All leaves
- **Filters:** status, user_id (HR/Admin only)
- **Relationships Loaded:**
  - User, LeaveType, Approval Officers, Approvers

#### `myLeaves(Request $request)`
- **Route:** `GET /api/leaves/my-leaves`
- **Purpose:** Get current user's leave applications
- **Filters:** status
- **Returns:** User's leaves with relationships

#### `store(Request $request)`
- **Route:** `POST /api/leaves`
- **Purpose:** Create new leave application
- **Validation:**
  - leave_type_id (required, exists)
  - start_date (required, date)
  - end_date (required, date, after_or_equal:start_date)
  - exclusive_dates (required, array, min:1)
  - working_days (required, integer, min:1)
  - leave_credit_authorized_officer_id (required, exists:approval_names)
  - recommendation_approver_id (required, exists:approval_names)
  - leave_approver_id (nullable, exists:approval_names)
  - commutation (required, in:Requested,Not Requested)
  - remarks (nullable, string)
  - show_remarks_to (nullable, array)
- **Default Status:** 'pending'
- **Returns:** Created leave with relationships

#### `show(Request $request, $id)`
- **Route:** `GET /api/leaves/{id}`
- **Purpose:** Get single leave application
- **Authorization:**
  - HR/Admin: Always authorized
  - Owner: Can view own leave
  - Approvers: Can view if assigned to any approval stage
- **Returns:** Leave with all relationships

#### `update(Request $request, $id)`
- **Route:** `PUT /api/leaves/{id}`
- **Purpose:** Update leave (cancel only)
- **Authorization:** Only owner can update
- **Restrictions:** Only pending leaves can be cancelled
- **Returns:** Updated leave

#### `approve(Request $request, $id)`
- **Route:** `POST /api/leaves/{id}/approve`
- **Purpose:** Approve or reject leave application
- **Validation:**
  - status (required, in:approved,rejected)
  - approval_remarks (nullable, string)
- **Authorization Logic:**
  - HR/Admin: Can approve at any stage
  - Regular users: Must be assigned approver for current stage
- **3-Stage Workflow:**
  1. **Stage 1 - Leave Credit Officer:**
     - Sets `leave_credit_officer_approved = true`
     - Records approver, timestamp, remarks
     - Status remains 'pending'
  2. **Stage 2 - Recommendation Approver:**
     - Only if Stage 1 is approved
     - Sets `recommendation_approver_approved = true`
     - Records approver, timestamp, remarks
     - Status remains 'pending'
  3. **Stage 3 - Leave Approver (Final):**
     - Only if Stages 1 & 2 are approved
     - Sets `leave_approver_approved = true`
     - Records approver, timestamp, remarks
     - Sets `status = 'approved'`
     - Sets final `approved_by`, `approved_at`, `approval_remarks`
- **Rejection:** Can be rejected at any stage, immediately sets status to 'rejected'
- **Returns:** Updated leave with relationships

#### `destroy(Request $request, $id)`
- **Route:** `DELETE /api/leaves/{id}`
- **Purpose:** Delete leave application
- **Authorization:** Only owner can delete
- **Restrictions:** Only pending leaves can be deleted
- **Returns:** Success message

#### `getLeaveTypes()`
- **Route:** `GET /api/leave-types`
- **Purpose:** Get all active leave types
- **Returns:** Array of active leave types

#### `myPendingApprovals(Request $request)`
- **Route:** `GET /api/leaves/my-pending-approvals`
- **Purpose:** Get pending approvals for current approver
- **Logic:**
  - Gets user's approval name IDs
  - Finds pending leaves where:
    - User is assigned and it's their turn to approve
    - Previous stages are completed
  - Returns leaves at each stage where user can approve
- **Returns:** Object with `leaves` and `pds` arrays

---

### 2. **Leave Model**
**Location:** `server/app/Models/Leave.php`

**Fillable Fields:**
- Basic: user_id, leave_type_id, start_date, end_date, exclusive_dates, working_days, remarks, commutation
- Approval Officers: leave_credit_authorized_officer_id, recommendation_approver_id, leave_approver_id
- Remarks Visibility: show_remarks_to_leave_credit_officer, show_remarks_to_recommendation_approver, show_remarks_to_leave_approver
- Status: status, approved_by, approved_at, approval_remarks
- Stage 1: leave_credit_officer_approved, leave_credit_officer_approved_by, leave_credit_officer_approved_at, leave_credit_officer_remarks
- Stage 2: recommendation_approver_approved, recommendation_approver_approved_by, recommendation_approver_approved_at, recommendation_approver_remarks
- Stage 3: leave_approver_approved, leave_approver_approved_by, leave_approver_approved_at, leave_approver_remarks

**Relationships:**
- `user()` - BelongsTo User
- `leaveType()` - BelongsTo LeaveType
- `leaveCreditAuthorizedOfficer()` - BelongsTo ApprovalName
- `recommendationApprover()` - BelongsTo ApprovalName
- `leaveApprover()` - BelongsTo ApprovalName
- `approver()` - BelongsTo User (final approver)
- `leaveCreditOfficerApprover()` - BelongsTo User (stage 1 approver)
- `recommendationApproverApprover()` - BelongsTo User (stage 2 approver)
- `leaveApproverApprover()` - BelongsTo User (stage 3 approver)

**Scopes:**
- `byStatus($status)` - Filter by status
- `forUser($userId)` - Filter by user
- `pending()` - Get pending leaves
- `approved()` - Get approved leaves

**Casts:**
- Dates: start_date, end_date, approved_at, stage timestamps
- Arrays: exclusive_dates
- Booleans: approval flags, remarks visibility flags
- Integer: working_days

---

### 3. **LeaveType Model**
**Location:** `server/app/Models/LeaveType.php`

**Fillable Fields:**
- code, name, max_days, description, requires_document, requires_approval, is_active

**Relationships:**
- `leaveApplications()` - HasMany Leave

**Scopes:**
- `active()` - Get only active leave types

---

## 🗄️ Database Schema

### **leaves Table**

**Primary Fields:**
- `id` (bigint, primary key)
- `user_id` (foreign key → users, cascade delete)
- `leave_type_id` (foreign key → leave_types, restrict delete)
- `start_date` (date)
- `end_date` (date)
- `exclusive_dates` (json) - Array of selected dates
- `working_days` (integer)
- `remarks` (text, nullable)
- `commutation` (enum: 'Requested', 'Not Requested', nullable)

**Approval Officer References:**
- `leave_credit_authorized_officer_id` (foreign key → approval_names, set null on delete)
- `recommendation_approver_id` (foreign key → approval_names, set null on delete)
- `leave_approver_id` (foreign key → approval_names, set null on delete)

**Remarks Visibility:**
- `show_remarks_to_leave_credit_officer` (boolean, default false)
- `show_remarks_to_recommendation_approver` (boolean, default false)
- `show_remarks_to_leave_approver` (boolean, default false)

**Status & Final Approval:**
- `status` (enum: 'pending', 'approved', 'rejected', 'cancelled', default 'pending')
- `approved_by` (foreign key → users, set null on delete)
- `approved_at` (timestamp, nullable)
- `approval_remarks` (text, nullable)

**Stage 1 - Leave Credit Officer:**
- `leave_credit_officer_approved` (boolean, default false)
- `leave_credit_officer_approved_by` (foreign key → users, set null on delete)
- `leave_credit_officer_approved_at` (timestamp, nullable)
- `leave_credit_officer_remarks` (text, nullable)

**Stage 2 - Recommendation Approver:**
- `recommendation_approver_approved` (boolean, default false)
- `recommendation_approver_approved_by` (foreign key → users, set null on delete)
- `recommendation_approver_approved_at` (timestamp, nullable)
- `recommendation_approver_remarks` (text, nullable)

**Stage 3 - Leave Approver:**
- `leave_approver_approved` (boolean, default false)
- `leave_approver_approved_by` (foreign key → users, set null on delete)
- `leave_approver_approved_at` (timestamp, nullable)
- `leave_approver_remarks` (text, nullable)

**Timestamps:**
- `created_at`, `updated_at`

**Indexes:**
- user_id
- status
- start_date
- end_date

---

### **leave_types Table**

**Fields:**
- `id` (bigint, primary key)
- `code` (string) - e.g., 'VL', 'SL', 'TL'
- `name` (string) - e.g., 'Vacation Leave', 'Sick Leave'
- `max_days` (integer)
- `description` (text, nullable)
- `requires_document` (boolean)
- `requires_approval` (boolean)
- `is_active` (boolean)
- `created_at`, `updated_at`

---

## 🔌 API Endpoints

### **Public Endpoints**
None (all require authentication)

### **Authenticated Endpoints**

#### Leave Types
- `GET /api/leave-types` - Get all active leave types

#### Leave Applications
- `GET /api/leaves` - Get all leaves (role-filtered)
- `GET /api/leaves/my-leaves` - Get current user's leaves
- `GET /api/leaves/my-pending-approvals` - Get pending approvals for current approver
- `GET /api/leaves/{id}` - Get single leave application
- `POST /api/leaves` - Create new leave application
- `PUT /api/leaves/{id}` - Update leave (cancel only)
- `DELETE /api/leaves/{id}` - Delete leave (pending only)
- `POST /api/leaves/{id}/approve` - Approve/reject leave

**Middleware:**
- All routes: `auth:sanctum`, `CheckAccountLocked`
- Additional: `maintenance`, `LogHttpRequests`

---

## 🔄 Approval Workflow

### **3-Stage Sequential Approval Process**

All leave types follow the same 3-stage approval workflow:

```
┌─────────────────────────────────────────────────────────┐
│  Leave Application Created (status: 'pending')         │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Stage 1: Leave Credit Authorized Officer              │
│  - Must approve first                                   │
│  - Sets: leave_credit_officer_approved = true           │
│  - Status: remains 'pending'                            │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Stage 2: Recommendation Approver                       │
│  - Can only approve after Stage 1                       │
│  - Sets: recommendation_approver_approved = true       │
│  - Status: remains 'pending'                            │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Stage 3: Leave Approver (Final)                        │
│  - Can only approve after Stages 1 & 2                 │
│  - Sets: leave_approver_approved = true                 │
│  - Status: changes to 'approved'                        │
│  - Sets: approved_by, approved_at, approval_remarks      │
└─────────────────────────────────────────────────────────┘
```

### **Rejection Flow**
- Can be rejected at **any stage** by the current approver
- Immediately sets `status = 'rejected'`
- Records rejection details (approved_by, approved_at, approval_remarks)
- Does not require completion of all stages

### **Authorization Rules**

1. **HR/Admin:**
   - Can approve at any stage
   - Can view all leave applications
   - Can bypass stage restrictions

2. **Regular Users:**
   - Can only approve if:
     - They are assigned as an approver for the current stage
     - Previous stages have been completed
   - Can view:
     - Their own leave applications
     - Applications assigned to them for approval

3. **Leave Owners:**
   - Can view their own applications
   - Can cancel pending applications
   - Can delete pending applications
   - Cannot approve their own applications

---

## 📊 Data Flow

### **Creating a Leave Application**

```
1. User opens LeaveApplicationForm
   ↓
2. Form loads:
   - Approval names from master lists API
   - Leave types from leave types API
   ↓
3. User fills form:
   - Selects leave type
   - Selects dates (calendar)
   - System calculates working days
   - Selects approval officers
   - Enters remarks (optional)
   - Selects commutation
   ↓
4. Form validation (client-side)
   ↓
5. POST /api/leaves
   ↓
6. Server validation
   ↓
7. Create Leave record (status: 'pending')
   ↓
8. Return created leave
   ↓
9. Client shows success message
   ↓
10. Form resets, list refreshes
```

### **Approval Flow**

```
1. Approver views pending leaves (ManageLeaveList or ApprovalList)
   ↓
2. System checks if it's approver's turn:
   - Gets user's approval name IDs
   - Checks current approval stage
   - Verifies previous stages are complete
   ↓
3. Approver clicks Approve/Reject
   ↓
4. POST /api/leaves/{id}/approve
   ↓
5. Server validates:
   - User is authorized for current stage
   - Leave is still pending
   ↓
6. If Approve:
   - Update stage-specific fields
   - If Stage 3: Set status = 'approved'
   - If Stages 1-2: Keep status = 'pending'
   ↓
7. If Reject:
   - Set status = 'rejected'
   - Record rejection details
   ↓
8. Return updated leave
   ↓
9. Client refreshes list
```

---

## ✨ Key Features

### **1. Multi-Stage Approval**
- Sequential 3-stage approval process
- Stage-specific tracking and remarks
- Visual workflow display

### **2. Role-Based Access Control**
- HR/Admin: Full access
- Approvers: Stage-specific access
- Employees: Own leaves only

### **3. Date Selection**
- Calendar-based date picker
- Multiple date selection (exclusive dates)
- Automatic working days calculation (excludes weekends)

### **4. Approval Officer Management**
- Approval names stored in master list
- Users assigned to approval names
- Type-based filtering (leave_credit_officer, recommendation_approver, leave_approver, general)

### **5. Remarks Visibility Control**
- Optional remarks field
- Checkboxes to show remarks to specific approvers
- Per-approver visibility settings

### **6. Commutation**
- Requested/Not Requested selection
- Stored with leave application

### **7. Status Management**
- Pending: Awaiting approval
- Approved: All stages completed
- Rejected: Rejected at any stage
- Cancelled: Cancelled by owner

### **8. Leave Tracking**
- Detailed view of approval workflow
- Visual stage indicators
- Timestamps and approver information
- Remarks display

### **9. Leave Types**
- Configurable leave types
- Active/inactive status
- Code and name system
- Max days, description, document requirements

### **10. Filtering & Search**
- Filter by status (All, Pending, Approved)
- Role-based list filtering
- User-specific views

---

## 🔍 Security Considerations

1. **Authentication:** All endpoints require Sanctum authentication
2. **Authorization:** Role and ownership checks at controller level
3. **Validation:** Server-side validation for all inputs
4. **Data Isolation:** Users can only see their own leaves (unless HR/Admin)
5. **Approval Restrictions:** Stage-based approval restrictions enforced
6. **Status Protection:** Only pending leaves can be cancelled/deleted
7. **Foreign Key Constraints:** Database-level referential integrity

---

## 📝 Notes

1. **Leave Credits:** Currently using mock data (`mockLeaveCredits`). Consider implementing actual leave credit tracking.

2. **Notifications:** No email/push notifications implemented yet. Consider adding notifications for:
   - Leave application submitted
   - Approval required
   - Leave approved/rejected
   - Leave cancelled

3. **Document Upload:** Leave types have `requires_document` field, but document upload functionality is not implemented.

4. **Leave Balance:** No automatic deduction of leave credits upon approval.

5. **Holiday Calculation:** Working days calculation only excludes weekends. Consider adding holiday calendar support.

6. **Approval Timeout:** No automatic escalation or timeout for pending approvals.

7. **Bulk Operations:** No bulk approval/rejection functionality.

8. **Reports:** No reporting/analytics for leave usage.

---

## 🎯 Summary

The leave process is a comprehensive system with:
- ✅ Complete CRUD operations
- ✅ Multi-stage approval workflow
- ✅ Role-based access control
- ✅ Visual tracking interface
- ✅ Form validation and error handling
- ✅ Database relationships and constraints
- ✅ API documentation through code

The system follows a well-structured 3-stage approval process that ensures proper authorization and tracking at each level.

