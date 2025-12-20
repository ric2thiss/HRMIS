# Personal Data Sheet (PDS) Module

## 📋 Overview

The Personal Data Sheet (PDS) module allows employees to manage their personal information and submit it for HR approval. HR can review, approve, or return PDS for revision.

## ✨ Features

- Create and edit PDS (draft mode)
- Submit PDS for approval
- HR review and approval workflow
- Return PDS for revision
- View PDS status
- PDF generation

## 👥 User Roles

### Employee
- Can create their own PDS
- Can edit their PDS (when in draft, declined, approved, or pending status)
- Can submit PDS for approval
- Can view their own PDS

### HR
- Can view all PDS
- Can approve PDS
- Can decline PDS
- Can return PDS for revision
- Can notify employees to fill PDS

## 📝 Step-by-Step Workflows

### Step 1: Employee Creates PDS

1. Navigate to "My PDS" from the dashboard
2. Click "Create PDS" or "Edit PDS"
3. Fill in all required sections:
   - Personal Information
   - Family Background
   - Educational Background
   - Work Experience
   - Other information
4. Click "Save as Draft"
5. PDS is saved with status "draft"

### Step 2: Employee Submits PDS

1. Open your PDS (must be in draft status)
2. Review all information
3. Click "Submit for Approval"
4. PDS status changes to "pending"
5. HR receives notification

### Step 3: HR Reviews PDS

1. Navigate to "My Approval" or "Manage PDS"
2. View pending PDS applications
3. Click on a PDS to review details
4. Choose one of the following actions:
   - **Approve**: PDS is approved
   - **Decline**: PDS is declined with remarks
   - **Return for Revision**: PDS is returned to employee with comments

### Step 4: Employee Updates Returned PDS

1. Employee receives notification that PDS was returned
2. Navigate to "My PDS"
3. View HR comments
4. Make necessary changes
5. Click "Save as Draft" (status returns to draft)
6. Resubmit when ready

## 🔄 PDS Status Flow

```
Draft → Pending → Approved
         ↓
      Declined
         ↓
      Draft (can resubmit)
```

## 📊 PDS Statuses

- **Draft**: Employee is still editing
- **Pending**: Submitted and waiting for HR review
- **Approved**: HR has approved the PDS
- **Declined**: HR has declined the PDS
- **For Revision**: HR has returned it for changes

## 🔌 API Endpoints

### Get My PDS
```http
GET /api/v1/pds/my-pds
```

### Create PDS
```http
POST /api/v1/pds
```

### Update PDS
```http
PUT /api/v1/pds/{id}
```

### Submit PDS
```http
POST /api/v1/pds/{id}/submit
```

### Review PDS (HR Only)
```http
POST /api/v1/pds/{id}/review
```

**Request Body:**
```json
{
  "action": "approve", // or "decline" or "return"
  "remarks": "Optional remarks"
}
```

## 💡 Important Notes

- Employees can only have one PDS
- PDS can be updated when status is draft, declined, approved, or pending
- When updating a pending/declined/approved PDS, status automatically returns to draft
- HR can notify employees who haven't created a PDS yet

## 🐛 Troubleshooting

### Issue: Cannot submit PDS
**Solution**: Ensure PDS is in "draft" status and all required fields are filled.

### Issue: Cannot edit PDS
**Solution**: PDS can only be edited when status is draft, declined, approved, or pending.

### Issue: PDS not showing in HR approval list
**Solution**: Ensure PDS status is "pending" and it has been submitted.

---

*For API details, see [API Documentation](../api/README.md)*

