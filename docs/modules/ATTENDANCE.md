# Attendance Management Module

## 📋 Overview

The Attendance Management module tracks employee attendance through Daily Time Records (DTR). HR can import attendance data, and all users can view their attendance records.

## ✨ Features

- View Daily Time Record (DTR)
- Import attendance data (HR)
- View attendance statistics (HR)
- Attendance history tracking
- Standard time settings (HR)

## 👥 User Roles

### Employee
- Can view own DTR
- Can view own attendance history

### HR
- Can import attendance data
- Can view all attendance records
- Can view attendance statistics
- Can manage standard time settings
- Can view import history

### Admin
- Can view all attendance records

## 📝 Step-by-Step Workflows

### Step 1: Employee Views DTR

1. Navigate to "My DTR" from the dashboard
2. Select date range
3. View attendance records:
   - Date
   - Time in
   - Time out
   - Total hours
4. Export DTR if needed

### Step 2: HR Imports Attendance

1. Navigate to "Import Attendance" from the dashboard
2. Prepare CSV file with attendance data
3. Click "Choose File" and select CSV
4. Review import preview
5. Click "Import"
6. System processes the import
7. View import history

### Step 3: HR Views Attendance

1. Navigate to "View Attendance" from the dashboard
2. Filter by:
   - Employee
   - Date range
   - Office
3. View attendance records
4. Export data if needed

### Step 4: HR Manages Standard Time Settings

1. Navigate to "Master Lists" → "Standard Time Settings"
2. Configure:
   - Standard time in
   - Standard time out
   - Break duration
3. Save settings

## 📊 Attendance Data Structure

Attendance records include:
- Employee ID
- Date
- Time in
- Time out
- Total hours worked
- Import filename (for tracking)

## 🔌 API Endpoints

### Get Attendance
```http
GET /api/v1/attendance
```

**Query Parameters:**
- `user_id` - Filter by user (HR/Admin only)
- `start_date` - Start date filter
- `end_date` - End date filter

### Import Attendance (HR Only)
```http
POST /api/v1/attendance/import
```

**Request:** Multipart form data with CSV file

### Get Import History (HR Only)
```http
GET /api/v1/attendance/import-history
```

### Get Attendance Statistics (HR Only)
```http
GET /api/v1/attendance/statistics
```

## 💡 Important Notes

- Attendance data is imported via CSV files
- Import history is tracked for audit purposes
- Standard time settings affect attendance calculations
- DTR can be exported for official use

## 🐛 Troubleshooting

### Issue: Cannot import attendance
**Solution**: Ensure CSV file format is correct and you have HR role.

### Issue: Attendance not showing
**Solution**: Check date range and ensure data has been imported for that period.

### Issue: Wrong time calculations
**Solution**: Verify standard time settings are configured correctly.

---

*For API details, see [API Documentation](../api/README.md)*

