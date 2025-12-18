# Setup Guide

## 📖 Overview

This guide will help you set up the DICT Project on your local machine for development or prepare it for production deployment.

## 📚 Setup Documentation

### Quick Links

1. **[Prerequisites](./PREREQUISITES.md)** - Required software and tools
2. **[Installation](./INSTALLATION.md)** - Step-by-step installation guide
3. **[Configuration](./CONFIGURATION.md)** - Environment and system configuration
4. **[Deployment](./DEPLOYMENT.md)** - Production deployment guide

## 🚀 Quick Start (For the Impatient)

If you have all prerequisites installed:

```bash
# Clone repository
git clone <repository-url>
cd DICT-Project

# Backend setup
cd server
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# Frontend setup
cd ../client
npm install

# Run development servers
# Terminal 1 (Backend)
cd server
php artisan serve

# Terminal 2 (Frontend)
cd client
npm run dev
```

Visit `http://localhost:5173`

> ⚠️ **Note**: For detailed setup including troubleshooting, please follow the complete guides linked above.

## 📋 Setup Checklist

Use this checklist to track your setup progress:

### Prerequisites
- [ ] PHP 8.2 or higher installed
- [ ] Composer installed
- [ ] Node.js 18+ and npm installed
- [ ] Git installed
- [ ] Database (SQLite for dev, MySQL/PostgreSQL for production)
- [ ] Text editor/IDE (VS Code recommended)

### Backend Setup
- [ ] Repository cloned
- [ ] Dependencies installed (`composer install`)
- [ ] Environment file created (`.env`)
- [ ] Application key generated
- [ ] Database configured
- [ ] Database migrated and seeded
- [ ] Storage directories writable
- [ ] Backend server running

### Frontend Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] API endpoint configured
- [ ] Development server running
- [ ] Can access application in browser

### Verification
- [ ] Can access login page
- [ ] Can log in with seeded account
- [ ] API requests working
- [ ] No console errors
- [ ] All features loading correctly

## 🆘 Need Help?

- **Installation Issues**: See [Installation Guide](./INSTALLATION.md)
- **Configuration Problems**: See [Configuration Guide](./CONFIGURATION.md)
- **Production Deployment**: See [Deployment Guide](./DEPLOYMENT.md)

## 🔧 Development Tools (Optional but Recommended)

### Backend Development
- **Laravel Debugbar**: For debugging Laravel applications
- **Laravel Telescope**: For monitoring application
- **PHPUnit**: For testing (included)

### Frontend Development
- **React Developer Tools**: Browser extension for React debugging
- **Redux DevTools**: For state debugging (if using Redux)
- **Vite DevTools**: Built into Vite

### Database Tools
- **TablePlus**: Universal database tool
- **DBeaver**: Free universal database tool
- **phpMyAdmin**: Web-based MySQL administration

### API Testing
- **Postman**: API testing and documentation
- **Insomnia**: Alternative to Postman
- **Thunder Client**: VS Code extension

## 🌐 URLs After Setup

| Service | Development URL | Description |
|---------|----------------|-------------|
| Frontend | `http://localhost:5173` | React application |
| Backend API | `http://localhost:8000` | Laravel API |
| Database | SQLite file or DB server | Database connection |

## 📝 Default Credentials (After Seeding)

After running the database seeders, you should have default accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dict.gov.ph | password |
| HR | hr@dict.gov.ph | password |
| Employee | employee@dict.gov.ph | password |

> ⚠️ **Security**: Change these passwords immediately in production!

## 🔄 Next Steps

After completing the setup:

1. **Explore the Application**: Log in and test features
2. **Read Module Documentation**: See [Modules](../modules/README.md)
3. **Review Architecture**: See [General Documentation](../general/README.md)
4. **Start Development**: Begin working on features

## 🐛 Common Issues

### Port Already in Use
If port 8000 or 5173 is already in use:

```bash
# For Laravel (use different port)
php artisan serve --port=8001

# For Vite (use different port)
npm run dev -- --port 5174
```

### Permission Errors
If you encounter permission errors on storage directories:

```bash
cd server
chmod -R 775 storage bootstrap/cache
```

### Database Connection Issues
Check your `.env` database configuration and ensure the database server is running.

### npm Install Fails
Try clearing npm cache:

```bash
npm cache clean --force
npm install
```

## 📞 Support

For more detailed help with specific issues, refer to the individual setup documents or contact the development team.

---

*Ready to get started? Begin with [Prerequisites](./PREREQUISITES.md)!*

