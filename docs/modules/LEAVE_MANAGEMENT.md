# Leave Management Module

## 📋 Overview

The Leave Management module allows employees to apply for leave and enables a multi-level approval workflow. HR can manage leave applications and track leave credits.

## ✨ Features

- Leave application submission
- Multi-level approval workflow (3 stages)
- Leave credits tracking
- Leave cancellation
- Leave tracking and status
- Leave type management (HR)

## 👥 User Roles

### Employee
- Can apply for leave
- Can view own leave applications
- Can track leave application status
- Can cancel pending leave applications
- Can view own leave credits

### HR
- Can view all leave applications
- Can approve/reject leave applications
- Can manage leave applications
- Can view leave statistics

### Approvers (Assigned Officers)
- Can approve leave at their assigned stage
- Can view pending approvals

## 📝 Step-by-Step Workflows

### Step 1: Employee Applies for Leave

1. Navigate to "My Leave" from the dashboard
2. Click "Apply for Leave"
3. Fill in the leave application form:
   - Select leave type
   - Enter start date and end date
   - Enter reason
   - Select if commutation is needed
4. Click "Submit"
5. Leave application is created with status "pending"
6. Notification sent to first approver

### Step 2: Multi-Level Approval Process

Leave applications go through 3 approval stages:

**Stage 1: Leave Credit Authorized Officer**
1. Officer receives notification
2. Reviews leave application
3. Approves or rejects
4. If approved, moves to Stage 2

**Stage 2: Recommendation Officer**
1. Officer receives notification (only after Stage 1 approval)
2. Reviews leave application
3. Approves or rejects
4. If approved, moves to Stage 3

**Stage 3: Leave Approver**
1. Officer receives notification (only after Stage 2 approval)
2. Reviews leave application
3. Approves or rejects
4. If approved, leave is fully approved

### Step 3: Employee Tracks Leave

1. Navigate to "My Leave"
2. View all leave applications
3. Click on a leave to see details
4. View approval status and remarks
5. Track which stage is currently pending

### Step 4: Employee Cancels Leave

1. Open a pending leave application
2. Click "Cancel"
3. Leave status changes to "cancelled"
4. Approvers are notified

## 🔄 Leave Status Flow

```
Pending → Approved (Stage 1) → Approved (Stage 2) → Approved (Stage 3) → Fully Approved
   ↓
Rejected (at any stage)
   ↓
Cancelled (by employee)
```

## 📊 Leave Statuses

- **Pending**: Waiting for approval
- **Approved**: Approved at current stage
- **Rejected**: Rejected by an approver
- **Cancelled**: Cancelled by employee
- **Fully Approved**: All stages approved

## 🔌 API Endpoints

### Get My Leave Credits
```http
GET /api/v1/leaves/my-leave-credits
```

### Get My Leaves
```http
GET /api/v1/leaves/my-leaves
```

### Create Leave Application
```http
POST /api/v1/leaves
```

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

### Approve/Reject Leave
```http
POST /api/v1/leaves/{id}/approve
```

**Request Body:**
```json
{
  "action": "approve", // or "reject"
  "remarks": "Optional remarks"
}
```

### Get My Pending Approvals
```http
GET /api/v1/leaves/my-pending-approvals
```

## 💡 Important Notes

- Leave applications must go through all 3 stages in sequence
- Each approver can only approve once at their assigned stage
- HR and Admin can approve at any stage
- Leave credits are automatically deducted when approved
- Employees can only cancel pending leave applications

## 🐛 Troubleshooting

### Issue: Cannot approve leave
**Solution**: Check if it's your turn to approve (correct stage) and you haven't already approved at your stage.

### Issue: Leave stuck at a stage
**Solution**: Ensure the previous stage has been approved before the next stage can proceed.

### Issue: Cannot cancel leave
**Solution**: Only pending leave applications can be cancelled.

---

*For API details, see [API Documentation](../api/README.md)*

