# Installation Guide

## 📋 Overview

This guide provides step-by-step instructions for installing the DICT HRMIS on your local development environment.

> ℹ️ **Note**: Ensure you have completed all [Prerequisites](./PREREQUISITES.md) before proceeding.

## 📦 Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd DICT-Project
```

If you don't have the repository URL, contact your team lead.

### Step 2: Backend Setup (Laravel)

#### Step 2.1: Navigate to Server Directory

```bash
cd server
```

#### Step 2.2: Install PHP Dependencies

```bash
composer install
```

This installs all Laravel dependencies. May take 2-5 minutes.

#### Step 2.3: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# On Windows (if cp doesn't work)
copy .env.example .env
```

#### Step 2.4: Generate Application Key

```bash
php artisan key:generate
```

This generates a unique encryption key for your application.

#### Step 2.5: Configure Database

Open the `.env` file and configure your database settings.

**Option A: SQLite (Recommended for Development)**

```env
DB_CONNECTION=sqlite
# Comment out or remove these:
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=dict_db
# DB_USERNAME=root
# DB_PASSWORD=
```

Create the SQLite database file:
```bash
# Unix/Mac
touch database/database.sqlite

# Windows
type nul > database\database.sqlite
```

**Option B: MySQL**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dict_db
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

Create the database:
```bash
mysql -u root -p
CREATE DATABASE dict_db;
EXIT;
```

#### Step 2.6: Run Database Migrations

```bash
php artisan migrate
```

This creates all necessary database tables.

#### Step 2.7: Seed Database (Optional but Recommended)

```bash
php artisan db:seed
```

This populates the database with:
- Default user accounts
- Sample master data (offices, positions, leave types)
- Test data for development

**Default seeded accounts:**
- Admin: `admin@dict.gov.ph` / `password`
- HR: `hr@dict.gov.ph` / `password`
- Employee: `employee@dict.gov.ph` / `password`

> ⚠️ **Security**: Change these passwords immediately in production!

#### Step 2.8: Configure Storage

```bash
# Create symbolic link for storage
php artisan storage:link

# Set proper permissions (Unix/Mac)
chmod -R 775 storage bootstrap/cache
```

#### Step 2.9: Verify Backend Installation

```bash
# Start the development server
php artisan serve
```

You should see:
```
INFO  Server running on [http://127.0.0.1:8000]
```

Test in browser: `http://localhost:8000`

Press `Ctrl+C` to stop the server.

### Step 3: Frontend Setup (React + Vite)

#### Step 3.1: Navigate to Client Directory

```bash
# From project root
cd client

# Or from server directory
cd ../client
```

#### Step 3.2: Install Node Dependencies

```bash
npm install
```

May take 3-7 minutes depending on your internet connection.

#### Step 3.3: Configure Environment Variables

Create a `.env` file in the `client` directory:

```bash
# Create .env file
touch .env

# Windows
type nul > .env
```

Add the following content to `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

> ℹ️ **Note**: Adjust the URL if your Laravel server runs on a different port.

#### Step 3.4: Verify Frontend Installation

```bash
# Start the development server
npm run dev
```

You should see output like:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open `http://localhost:5173` in your browser.

### Step 4: Full System Verification

#### Step 4.1: Run Both Servers

You need two terminal windows/tabs:

**Terminal 1 (Backend):**
```bash
cd server
php artisan serve
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

#### Step 4.2: Access the Application

Open your browser and navigate to: `http://localhost:5173`

#### Step 4.3: Test Login

Try logging in with seeded credentials:
- Email: `admin@dict.gov.ph`
- Password: `password`

#### Step 4.4: Check for Errors

- Open browser console (F12) and check for errors
- Verify API requests are reaching the backend
- Ensure pages load without issues

## 🎯 Alternative: Using Laravel's Concurrent Script

Laravel provides a convenient script to run multiple services:

```bash
cd server
composer run dev
```

This will start:
- Laravel development server
- Queue worker
- Task scheduler (`schedule:work`)
- Log viewer (Pail)
- Vite development server

> ℹ️ **Note**: This requires `concurrently` to be installed globally or the script may need adjustment.

## ✅ Installation Verification Checklist

- [ ] Repository cloned successfully
- [ ] Backend dependencies installed
- [ ] Environment file configured
- [ ] Application key generated
- [ ] Database configured and connected
- [ ] Migrations run successfully
- [ ] Database seeded (if applicable)
- [ ] Storage linked
- [ ] Backend server starts without errors
- [ ] Frontend dependencies installed
- [ ] Frontend environment configured
- [ ] Frontend server starts without errors
- [ ] Can access application in browser
- [ ] Can log in with seeded account
- [ ] No console errors in browser
- [ ] API requests working correctly

## 🐛 Troubleshooting

### Issue: Composer Install Fails

**Solution:**
```bash
# Clear Composer cache
composer clear-cache

# Try again
composer install
```

### Issue: npm Install Fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Try again
npm install
```

### Issue: Port Already in Use

**Solution:**

For Laravel:
```bash
php artisan serve --port=8001
```

For Vite:
```bash
npm run dev -- --port 5174
```

### Issue: Database Connection Refused

**Solution:**
- Verify database server is running
- Check database credentials in `.env`
- Ensure database exists

For SQLite:
```bash
# Ensure file exists and is writable
ls -l database/database.sqlite
chmod 664 database/database.sqlite
```

### Issue: Permission Denied (Storage)

**Solution:**
```bash
# Unix/Mac
cd server
chmod -R 775 storage bootstrap/cache
```

### Issue: CORS Errors

**Solution:**
Check `server/config/cors.php` and ensure it's configured correctly.

### Issue: API Requests Fail (404)

**Solution:**
- Verify backend server is running on correct port
- Check `VITE_API_BASE_URL` in client `.env`
- Check browser console for actual error

### Issue: "Class not found" Errors

**Solution:**
```bash
cd server
composer dump-autoload
php artisan config:clear
php artisan cache:clear
```

## 📚 Additional Setup (Optional)

### Setting Up Queue Worker

For background jobs:

```bash
cd server
php artisan queue:work
```

### Setting Up Task Scheduler

The task scheduler runs scheduled tasks defined in `routes/console.php`.

**For Development:**

If you're using `composer run dev`, the scheduler is already included via `php artisan schedule:work`. Alternatively, you can run it separately:

```bash
cd server
php artisan schedule:work
```

**For Production:**

Add to crontab (Linux/Mac):
```bash
* * * * * cd /path-to-your-project/server && php artisan schedule:run >> /dev/null 2>&1
```

> ℹ️ **Note**: `schedule:work` is for development (runs continuously), while `schedule:run` is for production (called by cron every minute).

## 🚀 Next Steps

After successful installation:

1. **Read Configuration Guide**: [Configuration](./CONFIGURATION.md)
2. **Explore the Application**: Log in and test features
3. **Review Module Documentation**: [Modules](../modules/README.md)
4. **Check Architecture**: [General Documentation](../general/README.md)

## 📞 Need Help?

- Check [Troubleshooting](#-troubleshooting) section above
- Review [Prerequisites](./PREREQUISITES.md)
- Contact the development team

---

*Installation complete? Great! Proceed to [Configuration](./CONFIGURATION.md) to customize your setup.*
