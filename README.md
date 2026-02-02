# OTA Network - Production Deployment Guide

Complete guide for deploying React frontend + Flask API on EC2 with Nginx and SSL.

## Architecture Overview

- **Frontend**: React app served as static files by Nginx (port 80/443)
- **Backend**: Flask API running with Gunicorn (port 8000)
- **Reverse Proxy**: Nginx handles SSL and routes `/api/*` requests to Flask
- **Process Management**: systemd keeps Flask running as a service

---

## Initial Setup

### 1. Install Dependencies

```bash
# Update system
sudo yum update -y

# Install Nginx
sudo yum install nginx -y

# Install Certbot for SSL
sudo yum install certbot python3-certbot-nginx -y

# Install Python dependencies
pip3 install gunicorn flask
# Add other Flask dependencies as needed
```

### 2. Directory Structure

```
/home/ec2-user/
├── otanet_frontend_/          # React app source
│   └── build/                 # Production build files
└── your-flask-app/            # Flask API source
    ├── app.py                 # Main Flask application
    └── database.db            # SQLite database

/var/www/
└── ota-network/               # React production files (served by Nginx)

/etc/nginx/
└── conf.d/
    └── yourapp.conf           # Nginx configuration

/etc/systemd/system/
└── flask-api.service          # Flask systemd service
```

---

## React Frontend Setup

### Build for Production

```bash
# Navigate to React app
cd /home/ec2-user/otanet_frontend_

# Install dependencies (first time only)
npm install

# Build production files
npm run build

# Copy to web directory
sudo mkdir -p /var/www/ota-network
sudo cp -r build/* /var/www/ota-network/
sudo chown -R nginx:nginx /var/www/ota-network
sudo chmod -R 755 /var/www/ota-network
```

### Update Frontend After Code Changes

```bash
cd /home/ec2-user/otanet_frontend_
npm run build
sudo cp -r build/* /var/www/ota-network/
# Nginx automatically serves new files - no restart needed
```

---

## Flask API Setup

### 1. Create systemd Service

```bash
sudo nano /etc/systemd/system/flask-api.service
```

**Service file content:**
```ini
[Unit]
Description=Flask API with Gunicorn
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/your-flask-app
Environment="PATH=/home/ec2-user/.local/bin:/usr/local/bin:/usr/bin"
Environment="FLASK_BASE_URL=https://ota-network.com"
ExecStart=/home/ec2-user/.local/bin/gunicorn -w 4 -b 127.0.0.1:8000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

### 2. Manage Flask Service

```bash
# Reload systemd after creating/editing service file
sudo systemctl daemon-reload

# Start Flask API
sudo systemctl start flask-api

# Enable auto-start on boot
sudo systemctl enable flask-api

# Check status
sudo systemctl status flask-api

# Restart after code changes
sudo systemctl restart flask-api

# Stop service
sudo systemctl stop flask-api
```

### 3. Database Permissions

```bash
# Ensure Flask can read/write SQLite database
cd /home/ec2-user/your-flask-app
chmod 664 database.db
chmod 775 .
```

---

## Nginx Configuration

### 1. Create Nginx Config

```bash
sudo nano /etc/nginx/conf.d/yourapp.conf
```

**Configuration content:**
```nginx
server {
    listen 80;
    server_name ota-network.com;

    # Serve React static files
    root /var/www/ota-network;
    index index.html;

    # React app - handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Flask
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Manage Nginx

```bash
# Test configuration syntax
sudo nginx -t

# Start Nginx
sudo systemctl start nginx

# Enable auto-start on boot
sudo systemctl enable nginx

# Reload after config changes (no downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## SSL Setup with Let's Encrypt

### 1. Install SSL Certificate

```bash
# Run Certbot (automatically updates Nginx config)
sudo certbot --nginx -d ota-network.com

# Follow prompts to:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

### 2. Auto-Renewal

Certbot automatically sets up a renewal cron job. Test it:

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot-renew.timer
```

---

## Common Operations

### Deploy Code Updates

**React Frontend:**
```bash
cd /home/ec2-user/otanet_frontend_
npm run build
sudo cp -r build/* /var/www/ota-network/
```

**Flask Backend:**
```bash
# After editing Flask code
sudo systemctl restart flask-api
```

### Check What's Running

```bash
# Check all services
sudo systemctl status nginx
sudo systemctl status flask-api

# Check what's listening on ports
sudo netstat -tulpn | grep :80    # Nginx (HTTP)
sudo netstat -tulpn | grep :443   # Nginx (HTTPS)
sudo netstat -tulpn | grep :8000  # Flask API
```

### View Logs

```bash
# Flask API logs (real-time)
sudo journalctl -u flask-api -f

# Flask API logs (last 50 lines)
sudo journalctl -u flask-api -n 50

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### 500 Internal Server Error

**Check Nginx error logs:**
```bash
sudo tail -50 /var/log/nginx/error.log
```

**Common causes:**
- Permission denied → Check file permissions
- Flask not running → Check `sudo systemctl status flask-api`
- Wrong proxy configuration → Test Flask directly: `curl http://127.0.0.1:8000/`

### Permission Denied Errors

```bash
# Fix React build directory permissions
sudo chmod -R 755 /var/www/ota-network
sudo chown -R nginx:nginx /var/www/ota-network

# Fix home directory permissions
chmod 755 /home/ec2-user

# Check SELinux (if enforcing)
getenforce
sudo chcon -R -t httpd_sys_content_t /var/www/ota-network
```

### Flask API Not Starting

```bash
# Check detailed error logs
sudo journalctl -u flask-api -n 100

# Test Flask manually (bypass systemd)
cd /home/ec2-user/your-flask-app
gunicorn -w 4 -b 127.0.0.1:8000 app:app

# Common issues:
# - Wrong WorkingDirectory in service file
# - Missing Python dependencies
# - Database file permissions
# - Port 8000 already in use
```

### Mixed Content Errors (HTTP/HTTPS)

**Issue:** Browser blocks HTTP requests when page is HTTPS

**Solution:** Ensure all API calls use relative URLs:
```javascript
// ✅ Correct
fetch('/api/recent_manga?per_page=10&page=3')

// ❌ Wrong
fetch('http://ota-network.com:8000/recent_manga')
```

### API Routes Returning 404

**Check Flask routes match Nginx config:**
- If Nginx strips `/api`, Flask routes should NOT include `/api`
- Example: Flask route `/image/<path>` matches browser request `/api/image/<path>`

**Test API directly:**
```bash
# Bypass Nginx - test Flask directly
curl http://127.0.0.1:8000/image/test.jpg

# Through Nginx
curl http://ota-network.com/api/image/test.jpg
```

### Database Locked Errors

```bash
# SQLite needs write access to database AND directory
cd /home/ec2-user/your-flask-app
chmod 664 database.db
chmod 775 .

# Check who owns the file
ls -la database.db
```

### Nginx Won't Start

```bash
# Check what's using port 80
sudo netstat -tulpn | grep :80

# Stop conflicting service (Apache)
sudo systemctl stop httpd
sudo systemctl disable httpd

# Test Nginx configuration
sudo nginx -t

# Check SELinux
sudo setsebool -P httpd_can_network_connect 1
```

---

## Security Checklist

### EC2 Security Group Settings

Ensure these ports are open:
- **Port 80** (HTTP) - inbound from 0.0.0.0/0
- **Port 443** (HTTPS) - inbound from 0.0.0.0/0
- **Port 22** (SSH) - inbound from your IP only
- **Port 8000** should NOT be open (Flask only accessible internally)

### File Permissions

```bash
# Web files - readable by Nginx
sudo chmod -R 755 /var/www/ota-network

# Flask app - owned by ec2-user
sudo chown -R ec2-user:ec2-user /home/ec2-user/your-flask-app

# Database - writable by Flask
chmod 664 /home/ec2-user/your-flask-app/database.db
```

### Environment Variables

Store secrets in systemd service file, not in code:
```ini
Environment="DATABASE_URL=sqlite:///database.db"
Environment="SECRET_KEY=your-secret-key-here"
Environment="FLASK_BASE_URL=https://ota-network.com"
```

---

## Monitoring & Maintenance

### Check Service Health

```bash
# Quick health check script
#!/bin/bash
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager

echo "=== Flask API Status ==="
sudo systemctl status flask-api --no-pager

echo "=== Port Check ==="
sudo netstat -tulpn | grep -E ':80|:443|:8000'

echo "=== SSL Certificate Expiry ==="
sudo certbot certificates
```

### Log Rotation

Nginx logs are automatically rotated. For Flask logs:
```bash
# View log size
sudo journalctl -u flask-api --disk-usage

# Clear old logs (older than 7 days)
sudo journalctl --vacuum-time=7d
```

---

## Quick Reference

### Service Management
```bash
sudo systemctl start|stop|restart|status nginx
sudo systemctl start|stop|restart|status flask-api
```

### View Logs
```bash
sudo journalctl -u flask-api -f              # Flask logs (follow)
sudo tail -f /var/log/nginx/error.log        # Nginx errors
sudo tail -f /var/log/nginx/access.log       # Nginx access
```

### Test Endpoints
```bash
curl http://127.0.0.1:8000/                  # Test Flask directly
curl http://ota-network.com/api/             # Test through Nginx
curl -I https://ota-network.com              # Check SSL
```

### Deploy Updates
```bash
# React
cd /home/ec2-user/otanet_frontend_ && npm run build && sudo cp -r build/* /var/www/ota-network/

# Flask
sudo systemctl restart flask-api
```

---

## Helpful Commands

### System Information
```bash
# OS version
cat /etc/os-release

# Python version
python3 --version

# Node/npm version
node --version
npm --version

# Nginx version
nginx -v

# Check disk space
df -h

# Check memory usage
free -h
```

### Network Diagnostics
```bash
# Test DNS resolution
nslookup ota-network.com

# Check firewall
sudo iptables -L

# Test connectivity
curl -I https://ota-network.com

# Check open ports
sudo netstat -tulpn
```

---

## Additional Notes

- **Never run Flask's development server in production** - always use Gunicorn
- **Keep systemd service files in `/etc/systemd/system/`** for custom services
- **Run `sudo systemctl daemon-reload`** after editing service files
- **Use `sudo nginx -t`** before reloading Nginx to catch config errors
- **Monitor logs regularly** to catch issues early
- **Set up backups** for your SQLite database

---

## Support & Documentation

- **Nginx Documentation**: https://nginx.org/en/docs/
- **Flask Documentation**: https://flask.palletsprojects.com/
- **Gunicorn Documentation**: https://docs.gunicorn.org/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **systemd**: `man systemd.service`

---

**Last Updated:** February 2026
