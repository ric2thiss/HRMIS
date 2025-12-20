# System Administration Module

## 📋 Overview

The System Administration module provides administrative functions for managing the system. Admin users can control maintenance mode, system version, and view system health.

## ✨ Features

- System maintenance mode
- System version management
- System health monitoring
- Activity logs viewing
- Database backup
- Cache management

## 👥 User Roles

### Admin
- Can toggle maintenance mode
- Can update system version
- Can view system health
- Can view activity logs
- Can backup database
- Can clear cache

### HR
- Can view HR dashboard
- Can view employee statistics

## 📝 Step-by-Step Workflows

### Step 1: Enable Maintenance Mode

1. Navigate to "System Settings" (Admin only)
2. Go to "Maintenance Mode" section
3. Toggle "Enable Maintenance Mode"
4. Enter maintenance message (optional)
5. Select allowed login roles
6. Click "Save"
7. System enters maintenance mode

### Step 2: Update System Version

1. Navigate to "System Settings"
2. Go to "System Version" section
3. Enter new version number
4. Click "Update"
5. Version is updated system-wide

### Step 3: View System Health

1. Navigate to "Admin Dashboard"
2. View system health metrics:
   - System health status
   - Database health
   - Storage health
   - Memory health
3. Review any warnings or errors

### Step 4: View Activity Logs

1. Navigate to "Admin Dashboard"
2. Go to "Activity Logs" section
3. View logs:
   - Login activities
   - HTTP request logs
   - Module access logs
4. Filter and search logs
5. Export logs if needed

### Step 5: Backup Database

1. Navigate to "Admin Dashboard"
2. Go to "Database" section
3. Click "Backup Database"
4. Database backup is created
5. Download backup file

### Step 6: Clear Cache

1. Navigate to "Admin Dashboard"
2. Go to "Cache" section
3. Click "Clear Cache"
4. System cache is cleared

## 🔌 API Endpoints

### Toggle Maintenance Mode (Admin Only)
```http
PUT /api/v1/maintenance-mode
```

**Request Body:**
```json
{
  "enabled": true,
  "message": "System under maintenance",
  "allowed_login_roles": ["admin"]
}
```

### Update System Version (Admin Only)
```http
PUT /api/v1/system-version
```

**Request Body:**
```json
{
  "version": "1.0.1"
}
```

### Get System Health (Admin Only)
```http
GET /api/v1/admin/system-health
```

### Get Activity Logs (Admin Only)
```http
GET /api/v1/admin/activity-logs
```

### Backup Database (Admin Only)
```http
GET /api/v1/admin/backup-database
```

### Clear Cache (Admin Only)
```http
POST /api/v1/admin/clear-cache
```

## 💡 Important Notes

- Maintenance mode restricts access to non-allowed roles
- System version is displayed in the dashboard
- Activity logs help track system usage
- Regular database backups are recommended
- Cache clearing may temporarily slow the system

## 🐛 Troubleshooting

### Issue: Cannot access system during maintenance
**Solution**: Login with an allowed role (usually admin) or wait for maintenance to end.

### Issue: System health shows warnings
**Solution**: Check database connection, storage space, and memory usage.

### Issue: Cannot backup database
**Solution**: Ensure you have admin role and sufficient storage space.

---

*For API details, see [API Documentation](../api/README.md)*

