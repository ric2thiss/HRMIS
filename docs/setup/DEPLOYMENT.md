# Deployment Guide

## 📋 Overview

This guide covers deploying the DICT Project to production environments, including server setup, deployment strategies, and post-deployment tasks.

## 🎯 Deployment Options

### Option 1: Traditional VPS/Server (Recommended)
- Full control over environment
- Suitable for government/enterprise deployments
- Examples: DigitalOcean, AWS EC2, Linode, On-premise

### Option 2: Platform as a Service (PaaS)
- Easier setup and management
- Examples: Laravel Forge, Heroku, Platform.sh

### Option 3: Serverless
- Auto-scaling and pay-per-use
- Examples: AWS Lambda, Vercel (frontend), AWS RDS (backend)

This guide focuses on **Option 1** (Traditional VPS).

## 🖥️ Server Requirements

### Minimum Production Requirements
- **OS**: Ubuntu 22.04 LTS or CentOS 8+
- **RAM**: 2GB (4GB recommended)
- **Storage**: 20GB SSD
- **CPU**: 2 cores
- **Bandwidth**: 2TB/month

### Recommended Production Requirements
- **RAM**: 4GB or more
- **Storage**: 40GB SSD
- **CPU**: 4 cores
- **Bandwidth**: Unlimited

## 🚀 Pre-Deployment Checklist

### Backend Preparation

- [ ] All tests passing
- [ ] Database migrations tested
- [ ] `.env.production` configured
- [ ] Dependencies updated
- [ ] Security scan completed
- [ ] Backup strategy planned

### Frontend Preparation

- [ ] Production build tested locally
- [ ] Environment variables set
- [ ] Assets optimized
- [ ] API endpoints configured
- [ ] Browser testing completed

## 📦 Server Setup

### Step 1: Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create deployment user
sudo adduser deploy
sudo usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

### Step 2: Install Required Software

#### Install PHP 8.2+

```bash
# Add PHP repository
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP and extensions
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-common \
    php8.2-mysql php8.2-pgsql php8.2-sqlite3 \
    php8.2-mbstring php8.2-xml php8.2-bcmath \
    php8.2-curl php8.2-zip php8.2-gd \
    php8.2-intl php8.2-redis
```

#### Install Composer

```bash
cd ~
curl -sS https://getcomposer.org/installer -o composer-setup.php
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
```

#### Install Node.js and npm

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Install Nginx

```bash
sudo apt install -y nginx
```

#### Install Database (MySQL)

```bash
# Install MySQL
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql
```

```sql
CREATE DATABASE dict_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dict_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON dict_db.* TO 'dict_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Install Redis (Optional, for caching/queues)

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Step 3: Clone and Configure Application

```bash
# Create directory
sudo mkdir -p /var/www/dict-project
sudo chown deploy:deploy /var/www/dict-project

# Clone repository
cd /var/www/dict-project
git clone <repository-url> .

# Or upload via SFTP/SCP
```

### Step 4: Backend Deployment

```bash
cd /var/www/dict-project/server

# Install dependencies (production only)
composer install --no-dev --optimize-autoloader

# Create and configure .env
cp .env.example .env
nano .env
```

**Production .env configuration:**

```env
APP_NAME="DICT HRIS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dict_db
DB_USERNAME=dict_user
DB_PASSWORD=strong_password_here

# Cache & Session
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail (configure with your SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"

# Sanctum
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
SESSION_DOMAIN=.yourdomain.com
```

```bash
# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed database (if needed)
php artisan db:seed --force

# Create storage link
php artisan storage:link

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
sudo chown -R deploy:www-data /var/www/dict-project/server/storage
sudo chown -R deploy:www-data /var/www/dict-project/server/bootstrap/cache
sudo chmod -R 775 /var/www/dict-project/server/storage
sudo chmod -R 775 /var/www/dict-project/server/bootstrap/cache
```

### Step 5: Frontend Build

```bash
cd /var/www/dict-project/client

# Install dependencies
npm ci

# Create production .env
nano .env.production
```

Add:
```env
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_APP_NAME=DICT HRIS
```

```bash
# Build for production
npm run build

# The built files are now in dist/
```

### Step 6: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/dict-project
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Root directory for React app
    root /var/www/dict-project/client/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend - Serve React app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Proxy to Laravel
    location /api {
        alias /var/www/dict-project/server/public;
        try_files $uri $uri/ @laravel;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/dict-project/server/public/index.php;
            include fastcgi_params;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/index.php?/$1 last;
    }

    # Laravel public assets
    location /storage {
        alias /var/www/dict-project/server/storage/app/public;
    }

    # Deny access to sensitive files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/dict-project /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

### Step 8: Configure PHP-FPM

```bash
# Edit PHP-FPM pool configuration
sudo nano /etc/php/8.2/fpm/pool.d/www.conf
```

Key settings to adjust:

```ini
user = www-data
group = www-data
listen = /var/run/php/php8.2-fpm.sock
listen.owner = www-data
listen.group = www-data

pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 500
```

```bash
# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
```

### Step 9: Setup Supervisor (For Queue Workers)

```bash
# Install Supervisor
sudo apt install -y supervisor

# Create configuration for Laravel queue worker
sudo nano /etc/supervisor/conf.d/dict-worker.conf
```

```ini
[program:dict-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/dict-project/server/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/dict-project/server/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
# Update and start Supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start dict-worker:*
```

### Step 10: Setup Cron for Task Scheduler

```bash
# Edit crontab for deploy user
crontab -e
```

Add:
```
* * * * * cd /var/www/dict-project/server && php artisan schedule:run >> /dev/null 2>&1
```

## 🔄 Deployment Script

Create a deployment script for future updates:

```bash
nano /var/www/dict-project/deploy.sh
chmod +x /var/www/dict-project/deploy.sh
```

```bash
#!/bin/bash

# DICT Project Deployment Script

echo "🚀 Starting deployment..."

# Navigate to project
cd /var/www/dict-project

# Enable maintenance mode
cd server
php artisan down

# Pull latest changes
cd ..
git pull origin main

# Backend deployment
echo "📦 Updating backend..."
cd server
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend deployment
echo "🎨 Building frontend..."
cd ../client
npm ci
npm run build

# Set permissions
sudo chown -R deploy:www-data ../server/storage
sudo chown -R deploy:www-data ../server/bootstrap/cache

# Restart services
echo "♻️ Restarting services..."
sudo systemctl reload php8.2-fpm
sudo systemctl reload nginx
sudo supervisorctl restart dict-worker:*

# Disable maintenance mode
cd ../server
php artisan up

echo "✅ Deployment complete!"
```

## 📊 Monitoring and Maintenance

### Application Monitoring

1. **Logs**: Monitor Laravel logs
```bash
tail -f /var/www/dict-project/server/storage/logs/laravel.log
```

2. **Server Resources**:
```bash
# CPU and Memory
htop

# Disk Usage
df -h
```

3. **Nginx Access/Error Logs**:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Backup Strategy

Create automated backup script:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/dict-project"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
mysqldump -u dict_user -p dict_db > $BACKUP_DIR/db_$DATE.sql

# Backup uploads/storage
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz /var/www/dict-project/server/storage/app

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

## 🔒 Security Hardening

### Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Configure rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
```

### Fail2Ban (Protect against brute-force)

```bash
# Install
sudo apt install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

### Regular Updates

```bash
# Auto-update security patches
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## ✅ Post-Deployment Verification

- [ ] Application accessible via HTTPS
- [ ] API endpoints responding correctly
- [ ] Login functionality working
- [ ] Database connections stable
- [ ] File uploads working
- [ ] Queue workers running
- [ ] Cron jobs executing
- [ ] SSL certificate valid
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Backup system functional
- [ ] Monitoring active

## 🐛 Troubleshooting

### Issue: 500 Internal Server Error

Check:
- Laravel logs: `/var/www/dict-project/server/storage/logs/`
- Nginx error log: `/var/log/nginx/error.log`
- PHP-FPM log: `/var/log/php8.2-fpm.log`
- Permissions on storage directories

### Issue: API Requests Failing

- Verify CORS configuration
- Check SANCTUM_STATEFUL_DOMAINS
- Verify SSL certificate
- Test API directly: `curl https://yourdomain.com/api/health`

### Issue: Queue Jobs Not Processing

```bash
# Check worker status
sudo supervisorctl status dict-worker:*

# Restart workers
sudo supervisorctl restart dict-worker:*

# Check logs
tail -f /var/www/dict-project/server/storage/logs/worker.log
```

## 📞 Support

For deployment issues:
- Review server logs
- Check Laravel error logs
- Verify all services are running
- Contact DevOps team

---

*Deployment complete! Your application is now live in production.*

