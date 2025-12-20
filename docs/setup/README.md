# Setup Guide

## 📖 Overview

This guide will help you set up the DICT HRMIS on your local machine for development or prepare it for production deployment.

## 🎯 Quick Start

If you're experienced and have all prerequisites:

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
cd ../server
composer run dev
```

Visit `http://localhost:5173`

## 📚 Setup Documentation

Follow these guides in order:

### Step 1: [Prerequisites](./PREREQUISITES.md)
Install required software and tools before starting.

### Step 2: [Installation](./INSTALLATION.md)
Step-by-step installation instructions.

### Step 3: [Configuration](./CONFIGURATION.md)
Configure environment variables and system settings.

### Step 4: [Deployment](./DEPLOYMENT.md)
Production deployment guide (if needed).

## ✅ Setup Checklist

### Prerequisites
- [ ] PHP 8.2+ installed
- [ ] Composer installed
- [ ] Node.js 18+ and npm installed
- [ ] Git installed
- [ ] Database (SQLite for dev, MySQL/PostgreSQL for production)

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

## 🆘 Need Help?

- **Installation Issues**: See [Installation Guide](./INSTALLATION.md)
- **Configuration Problems**: See [Configuration Guide](./CONFIGURATION.md)
- **Production Deployment**: See [Deployment Guide](./DEPLOYMENT.md)

---

*Ready to get started? Begin with [Prerequisites](./PREREQUISITES.md)!*
