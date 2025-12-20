# Announcements Module

## 📋 Overview

The Announcements module allows HR to create and manage announcements. All users can view active announcements and react to them.

## ✨ Features

- Create announcements (HR)
- View active announcements
- React to announcements (like/remove)
- Archive announcements (HR)
- Announcement management (HR)

## 👥 User Roles

### All Users
- Can view active announcements
- Can react to announcements
- Can view announcement details

### HR
- Can create announcements
- Can edit announcements
- Can delete announcements
- Can archive announcements
- Can manage announcement recipients

## 📝 Step-by-Step Workflows

### Step 1: HR Creates Announcement

1. Navigate to "Manage Announcements" from the dashboard
2. Click "Create Announcement"
3. Fill in announcement details:
   - Title
   - Content
   - Recipient type (All or Specific)
   - If specific, select recipients
4. Click "Publish"
5. Announcement is sent to selected recipients

### Step 2: Users View Announcements

1. Navigate to "My Announcements" or view on dashboard
2. See list of active announcements
3. Click on an announcement to view details
4. Read full content

### Step 3: Users React to Announcements

1. Open an announcement
2. Click "Like" button to react
3. Click again to remove reaction
4. View total reactions count

### Step 4: HR Archives Announcement

1. Navigate to "Manage Announcements"
2. Find the announcement to archive
3. Click "Archive"
4. Announcement moves to archive
5. View archived announcements in "Announcement Archive"

## 📊 Announcement Statuses

- **Active**: Currently visible to recipients
- **Archived**: No longer active

## 🔌 API Endpoints

### Get Active Announcements
```http
GET /api/v1/announcements/active
```

### Get All Announcements (HR Only)
```http
GET /api/v1/announcements
```

### Create Announcement (HR Only)
```http
POST /api/v1/announcements
```

**Request Body:**
```json
{
  "title": "Announcement Title",
  "content": "Announcement content",
  "recipient_type": "all", // or "specific"
  "recipient_ids": [] // if specific
}
```

### React to Announcement
```http
POST /api/v1/announcements/{id}/react
```

**Request Body:**
```json
{
  "reaction": "like" // or "remove"
}
```

## 💡 Important Notes

- Announcements can be sent to all users or specific users
- Users can react to announcements
- Archived announcements are no longer visible to users
- HR can manage all announcements

## 🐛 Troubleshooting

### Issue: Cannot see announcements
**Solution**: Check if you are in the recipient list and announcement is active.

### Issue: Cannot create announcement
**Solution**: Ensure you have HR role.

### Issue: Reaction not working
**Solution**: Refresh the page and try again.

---

*For API details, see [API Documentation](../api/README.md)*

