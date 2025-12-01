# Frontend Update Plan - After Backend Schema Changes

## Issues Identified

### 1. Role Access Pattern
- **Current**: Components use `user?.roles?.[0]?.name`
- **Backend Now**: Has both `user.role.name` (belongsTo) and `user.roles[0].name` (many-to-many)
- **Fix**: Create helper function to check both, or update all references

### 2. Missing Data Display
- **Sidebar**: Should show Position and Project information
- **AccountManager Table**: Should display Position, Role, Project columns
- **ProfileInfo**: Should show Position and Project

### 3. Missing Navigation
- **Sidebar**: Needs "Master Lists" link in HR Management section
- **Dashboard Tiles**: Needs "Master Lists Management" tile

### 4. Role Checking
- Multiple components check `user?.roles?.[0]?.name` - should handle both patterns

## Files to Update

1. `client/src/components/Sidebar/Sidebar.jsx`
   - Add Position and Project display
   - Add Master Lists link

2. `client/src/components/features/accounts/AccountManager.jsx`
   - Update table to show Position, Role, Project columns
   - Update role display logic

3. `client/src/components/features/profile/ProfileInfo.jsx`
   - Add Position and Project display

4. `client/src/components/Tile/tilesConfig.jsx`
   - Add Master Lists tile

5. `client/src/components/auth/RoleProtectedRoute.jsx`
   - Update to check both role patterns

6. Create helper utility for role checking

