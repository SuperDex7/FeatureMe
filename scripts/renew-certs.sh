#!/bin/bash

# Manual script to renew Let's Encrypt certificates
# Run this script when you need to renew certificates: ./scripts/renew-certs.sh

set -e

echo "=========================================="
echo "Renewing SSL Certificates"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "This script needs sudo privileges to access /etc/letsencrypt"
    echo "Please run: sudo ./scripts/renew-certs.sh"
    exit 1
fi

# Change to project directory
cd /home/ubuntu/FeatureMe

# Check current certificate status
echo "Current certificate status:"
certbot certificates
echo ""

# Renew certificates
# Use --no-directory-hooks to prevent certbot from trying to restart nginx
# (nginx is running in Docker, so we'll reload it manually)
echo "Attempting to renew certificates..."
certbot renew --force-renewal --no-directory-hooks

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Certificates renewed successfully!"
    echo ""
    
    # Reload nginx in docker container
    echo "Reloading nginx to pick up new certificates..."
    docker-compose -f docker-compose.prod.yml exec -T nginx nginx -s reload 2>/dev/null || {
        echo "Warning: Could not reload nginx via docker-compose, trying direct docker command..."
        docker ps --filter "name=nginx" --format "{{.Names}}" | head -1 | xargs -I {} docker exec {} nginx -s reload
    }
    
    echo ""
    echo "✅ Nginx reloaded successfully!"
    echo ""
    echo "New certificate status:"
    certbot certificates
    echo ""
    echo "=========================================="
    echo "Renewal complete! Your site should now be secure."
    echo "=========================================="
else
    echo ""
    echo "❌ Certificate renewal failed. Please check the error messages above."
    exit 1
fi

