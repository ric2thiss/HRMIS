# Master Lists Module

## 📋 Overview

The Master Lists module manages all reference data used throughout the system. HR can manage these lists which are used in various modules.

## ✨ Features

- Manage offices
- Manage positions
- Manage projects
- Manage roles
- Manage leave types
- Manage employment types
- Manage approval names
- Manage special capabilities

## 👥 User Roles

### HR
- Can create, edit, and delete all master list items
- Can view all master lists

### All Users
- Can view master lists (for dropdowns and selections)

## 📝 Step-by-Step Workflows

### Step 1: Access Master Lists

1. Navigate to "Master Lists" from the dashboard (HR only)
2. Select the master list to manage from the tabs:
   - Offices
   - Positions
   - Projects
   - Roles
   - Leave Types
   - Employment Types
   - Approval Names
   - Special Capabilities

### Step 2: Create Master List Item

1. Select the master list tab
2. Click "Add New" or "Create"
3. Fill in required fields
4. Click "Save"
5. Item is added to the list

### Step 3: Edit Master List Item

1. Find the item in the list
2. Click "Edit"
3. Modify the fields
4. Click "Save"
5. Changes are applied

### Step 4: Delete Master List Item

1. Find the item in the list
2. Click "Delete"
3. Confirm deletion
4. Item is removed (if not in use)

## 📊 Master Lists

### Offices
- Office name
- Office code
- Description

### Positions
- Position title
- Description

### Projects
- Project name
- Project code
- Status
- Project manager

### Roles
- Role name
- Access permissions scope

### Leave Types
- Leave type name
- Description
- Default credits

### Employment Types
- Employment type name
- Description

### Approval Names
- Approval name
- Assigned user
- Active status

### Special Capabilities
- Capability name
- Description

## 🔌 API Endpoints

### Get Master Lists
```http
GET /api/v1/master-lists
```

Returns all master lists in one response.

### Get Roles
```http
GET /api/v1/roles
```

### Create Role (HR Only)
```http
POST /api/v1/roles
```

### Get Positions (HR Only)
```http
GET /api/v1/positions
```

### Create Position (HR Only)
```http
POST /api/v1/positions
```

Similar endpoints exist for:
- Projects (`/api/v1/projects`)
- Offices (`/api/v1/offices`)
- Leave Types (`/api/v1/leave-types`)
- Approval Names (`/api/v1/approval-names`)
- Special Capabilities (`/api/v1/special-capabilities`)
- Employment Types (`/api/v1/employment/types`)

## 💡 Important Notes

- Master lists are used throughout the system
- Deleting items that are in use may cause errors
- Approval names link to users for leave approval workflow
- Special capabilities are used for Job Order employees

## 🐛 Troubleshooting

### Issue: Cannot delete master list item
**Solution**: Item may be in use. Check if it's referenced in users, leaves, or other records.

### Issue: Cannot create item
**Solution**: Ensure you have HR role and all required fields are filled.

### Issue: Item not showing in dropdowns
**Solution**: Refresh the page or check if item is active (for approval names).

---

*For API details, see [API Documentation](../api/README.md)*

