# Prerequisites

## 📋 Overview

Before installing the DICT Project, ensure your development environment meets the following requirements.

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 2GB free space
- **Processor**: Dual-core 2GHz or better

### Recommended Requirements
- **RAM**: 8GB or more
- **Storage**: 5GB free space (for dependencies and development)
- **Processor**: Quad-core 2.5GHz or better

## 🛠️ Required Software

### 1. PHP (8.2 or Higher)

**Check if installed:**
```bash
php -v
```

**Installation:**

- **Windows**: 
  - Download from [php.net](https://windows.php.net/download/)
  - Or use [XAMPP](https://www.apachefriends.org/)
  - Or use [Laragon](https://laragon.org/)

- **macOS**:
  ```bash
  brew install php@8.2
  ```

- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update
  sudo apt install php8.2 php8.2-cli php8.2-common php8.2-mbstring php8.2-xml php8.2-zip php8.2-sqlite3
  ```

**Required PHP Extensions:**
- OpenSSL
- PDO
- Mbstring
- Tokenizer
- XML
- Ctype
- JSON
- BCMath
- Fileinfo
- SQLite3 (for development)

### 2. Composer (PHP Dependency Manager)

**Check if installed:**
```bash
composer -V
```

**Installation:**

- **All Platforms**: Follow instructions at [getcomposer.org](https://getcomposer.org/download/)

- **Quick Install (Linux/macOS)**:
  ```bash
  curl -sS https://getcomposer.org/installer | php
  sudo mv composer.phar /usr/local/bin/composer
  chmod +x /usr/local/bin/composer
  ```

### 3. Node.js (18.0 or Higher) and npm

**Check if installed:**
```bash
node -v
npm -v
```

**Installation:**

- **All Platforms**: Download from [nodejs.org](https://nodejs.org/) (LTS version recommended)

- **Using nvm (Recommended for macOS/Linux)**:
  ```bash
  # Install nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  
  # Install Node.js
  nvm install 18
  nvm use 18
  ```

- **Windows**: Download installer from nodejs.org or use:
  ```bash
  # Using Chocolatey
  choco install nodejs
  ```

### 4. Git

**Check if installed:**
```bash
git --version
```

**Installation:**

- **Windows**: Download from [git-scm.com](https://git-scm.com/)
- **macOS**: 
  ```bash
  brew install git
  ```
- **Linux**:
  ```bash
  sudo apt install git
  ```

### 5. Database (Choose One)

#### Option A: SQLite (Recommended for Development)
- Usually comes with PHP
- No additional setup required
- Lightweight and easy to use

#### Option B: MySQL (5.7+ or 8.0+)
**Check if installed:**
```bash
mysql --version
```

**Installation:**
- **Windows**: Use [XAMPP](https://www.apachefriends.org/) or [MySQL Installer](https://dev.mysql.com/downloads/installer/)
- **macOS**:
  ```bash
  brew install mysql
  brew services start mysql
  ```
- **Linux**:
  ```bash
  sudo apt install mysql-server
  sudo systemctl start mysql
  ```

#### Option C: PostgreSQL (12+)
**Check if installed:**
```bash
psql --version
```

**Installation:**
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)
- **macOS**:
  ```bash
  brew install postgresql
  brew services start postgresql
  ```
- **Linux**:
  ```bash
  sudo apt install postgresql postgresql-contrib
  sudo systemctl start postgresql
  ```

## 🔧 Optional but Recommended

### Code Editor/IDE

**Recommended: Visual Studio Code**
- Download from [code.visualstudio.com](https://code.visualstudio.com/)
- **Recommended Extensions**:
  - PHP Intelephense
  - Laravel Extension Pack
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - GitLens

**Alternatives:**
- PHPStorm (Paid, excellent for PHP/Laravel)
- Sublime Text
- Atom

### Development Tools

1. **Postman or Insomnia**
   - For API testing
   - Download: [postman.com](https://www.postman.com/) or [insomnia.rest](https://insomnia.rest/)

2. **Database Client**
   - TablePlus (Paid but has free tier)
   - DBeaver (Free)
   - phpMyAdmin (Web-based, for MySQL)

3. **Browser Developer Tools**
   - React Developer Tools (Chrome/Firefox extension)
   - Vue.js devtools (if needed)

## 🌐 Network Requirements

### Development
- Internet connection for installing dependencies
- No special firewall configuration needed

### Production
- Open ports: 80 (HTTP) and 443 (HTTPS)
- SSL certificate (Let's Encrypt recommended)
- Domain name (optional but recommended)

## ✅ Verification Checklist

Before proceeding to installation, verify all requirements:

```bash
# Check PHP version (should be 8.2+)
php -v

# Check Composer
composer -V

# Check Node.js (should be 18+)
node -v

# Check npm
npm -v

# Check Git
git --version

# Check database (SQLite example)
php -m | grep sqlite

# Check required PHP extensions
php -m | grep -E "(openssl|pdo|mbstring|tokenizer|xml|ctype|json)"
```

## 🎯 Platform-Specific Setup

### Windows with XAMPP

If using XAMPP:
1. Install XAMPP from [apachefriends.org](https://www.apachefriends.org/)
2. PHP is included in `C:\xampp\php`
3. Add PHP to system PATH
4. MySQL is included (Apache needs to be running)

### macOS with Homebrew

Homebrew is recommended for macOS:
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install all requirements
brew install php@8.2
brew install composer
brew install node
brew install git
```

### Linux (Ubuntu/Debian)

Complete setup:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PHP and extensions
sudo apt install php8.2 php8.2-cli php8.2-common php8.2-mbstring \
  php8.2-xml php8.2-zip php8.2-sqlite3 php8.2-mysql php8.2-curl -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install Git
sudo apt install git -y
```

## 🐛 Common Issues

### PHP Not Found
- Ensure PHP is in your system PATH
- Restart terminal after installation

### Composer Requires PHP Extensions
- Install missing extensions based on error messages
- On Linux: `sudo apt install php8.2-[extension-name]`

### Node/npm Version Issues
- Use nvm to manage Node.js versions
- Install the LTS version: `nvm install --lts`

### Permission Errors
- On Unix systems, you may need to use `sudo` for global installations
- Consider using version managers (nvm, phpenv) to avoid permission issues

## 📚 Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [PHP Manual](https://www.php.net/manual/en/)
- [Node.js Documentation](https://nodejs.org/docs/)

## ➡️ Next Steps

Once all prerequisites are installed and verified, proceed to the [Installation Guide](./INSTALLATION.md).

---

*Need help? Check the troubleshooting section or contact the development team.*

