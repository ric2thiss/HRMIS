# Table Action Buttons Standardization

## ✅ Completed

### Reference Design (from `/my-leave` route)
The standardized button design follows the pattern from `MyLeaveList.jsx`:
- Icon + Label combination
- Bordered style with color-coded variants
- Consistent hover effects (darker text + light background)
- Standard structure: `flex items-center gap-1 px-3 py-1`
- Lucide React icons (size 16)

### Created Component
**File:** `client/src/components/ui/TableActionButton.jsx`

**Features:**
- Reusable action button component
- Color variants: blue, green, red, purple, orange, gray, indigo, yellow
- Icon support (Lucide React)
- Disabled state support
- Consistent hover animations
- Tooltip support

**Usage Example:**
```jsx
<TableActionButton
  variant="blue"
  icon={Eye}
  label="View"
  onClick={handleView}
  title="View details"
/>
```

### Updated Tables

#### ✅ 1. **PositionsTable** (`client/src/components/features/masterLists/PositionsTable.jsx`)
- **Actions:** Edit (indigo), Delete (red)
- **Icons:** Pencil, Trash2
- Status: ✅ Complete

#### ✅ 2. **ProjectsTable** (`client/src/components/features/masterLists/ProjectsTable.jsx`)
- **Actions:** Edit (indigo), Delete (red)
- **Icons:** Pencil, Trash2
- Status: ✅ Complete

#### ✅ 3. **OfficesTable** (`client/src/components/features/masterLists/OfficesTable.jsx`)
- **Actions:** Edit (indigo), Delete (red)
- **Icons:** Pencil, Trash2
- Status: ✅ Complete

#### ✅ 4. **LeaveTypesTable** (`client/src/components/features/masterLists/LeaveTypesTable.jsx`)
- **Actions:** Edit (indigo), Delete (red)
- **Icons:** Pencil, Trash2
- Status: ✅ Complete

#### ✅ 5. **AccountManager** (`client/src/components/features/accounts/AccountManager.jsx`)
- **Actions:** Edit (indigo), Lock/Unlock (yellow/green), Delete (red)
- **Icons:** Pencil, Lock, Unlock, Trash2
- **Special:** Dynamic button variant based on lock status
- Status: ✅ Complete

#### ✅ 6. **PdsReviewList** (`client/src/components/features/pds/PdsReviewList.jsx`)
- **Actions:** View (blue), Approve (green), For Revision (orange), Decline (red)
- **Icons:** Eye, CheckCircle, FileEdit, XCircle
- Status: ✅ Complete

#### ✅ 7. **ManageLeaveList** (`client/src/components/features/leave/ManageLeaveList.jsx`)
- **Actions:** View (blue), Approve (green), Reject (red)
- **Icons:** Eye, CheckCircle, XCircle
- Status: ✅ Complete

#### ✅ 8. **MyLeaveList** (Reference - Already Standardized)
- **Actions:** View (blue), Print (gray), Download (green), Track (purple), Cancel (red)
- **Icons:** Eye, Printer, Download, Navigation
- Status: ✅ Reference Implementation

#### ✅ 9. **ManagePdsTable** (`client/src/components/features/pds/ManagePdsTable.jsx`)
- **Actions (No PDS tab):** Notify to Fill PDS (blue)
- **Actions (Pending status):** View (blue), Approve (green), For Revision (orange), Decline (red)
- **Actions (Approved status):** View (blue), Print (purple), Delete (red)
- **Actions (Declined/For-revision status):** View (blue), View Comments (purple)
- **Icons:** Bell, Eye, CheckCircle, FileEdit, XCircle, Printer, Trash2, MessageSquare
- Status: ✅ Complete

#### ✅ 10. **PdsStatusTable** (`client/src/components/features/pds/PdsStatusTable.jsx`)
- **Actions:** Update PDS (blue), Submit for Approval (green), Print (purple)
- **Icons:** FileEdit, Send, Printer
- **Special:** Dynamic button visibility based on PDS status and user role
- Status: ✅ Complete

---

## ⏳ Remaining Tables to Update

The following tables still have old-style action buttons and need to be updated:

### 1. **ApprovalNamesTable** (`client/src/components/features/masterLists/ApprovalNamesTable.jsx`)
- Current: Text-only buttons
- Actions needed: Delete button → standardize with TableActionButton

### 2. **SpecialCapabilitiesTable** (`client/src/components/features/masterLists/SpecialCapabilitiesTable.jsx`)
- Current: Text-only buttons
- Actions needed: Standardize with TableActionButton

### 3. **RolesTable** (`client/src/components/features/masterLists/RolesTable.jsx`)
- Current: Text-only buttons
- Actions needed: Standardize with TableActionButton

### 4. **EmployeeTableView** (`client/src/components/features/employees/EmployeeTableView.jsx`)
- Check if it has action buttons in the table

---

## 📋 Update Checklist for Remaining Tables

For each remaining table, follow these steps:

1. **Import dependencies:**
   ```jsx
   import { IconName } from 'lucide-react';
   import TableActionButton from '../../ui/TableActionButton';
   ```

2. **Replace button structure:**
   ```jsx
   // OLD
   <button onClick={handleEdit} className="text-indigo-600 hover:text-indigo-900">
     Edit
   </button>
   
   // NEW
   <TableActionButton
     variant="indigo"
     icon={Pencil}
     label="Edit"
     onClick={handleEdit}
     title="Edit item"
   />
   ```

3. **Wrap buttons in flex container:**
   ```jsx
   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
     <div className="flex gap-2 items-center flex-wrap">
       {/* TableActionButtons here */}
     </div>
   </td>
   ```

---

## 🎨 Color Variants Guide

- **blue:** View, Info, Details
- **green:** Approve, Success actions, Unlock
- **red:** Delete, Reject, Decline, Remove
- **purple:** Track, Navigate, Special actions
- **orange:** Warning actions, For Revision
- **gray:** Secondary actions, Print
- **indigo:** Edit, Update, Modify
- **yellow:** Lock, Caution actions

---

## 📦 Benefits

1. **Consistency:** All tables now have the same visual design for action buttons
2. **Maintainability:** Single source of truth for button styling
3. **Accessibility:** Better focus states and tooltips
4. **Responsiveness:** Flex-wrap handles multiple buttons gracefully
5. **Iconography:** Clear visual indicators for each action
6. **User Experience:** Predictable button behavior across all modules

---

## 🚀 Next Steps

1. Update the 6 remaining tables listed above
2. Consider adding more color variants if needed
3. Add unit tests for TableActionButton component
4. Document any custom button patterns that don't fit the standard component

---

*Last Updated: December 17, 2025*
*Reference: `/my-leave` route - MyLeaveList.jsx*

---

## 📈 Progress Summary

- **✅ Completed:** 10 tables
- **⏳ Remaining:** 4 tables
- **Progress:** 71% Complete (10/14 tables)

