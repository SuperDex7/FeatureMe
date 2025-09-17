#!/bin/bash

# Setup script for EC2 instance
# Run this on your EC2 instance to prepare it for deployment

set -e

echo "Setting up EC2 instance for FeatureMe deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker

# Install AWS CLI
sudo apt install -y awscli

# Install Git
sudo apt install -y git

# Create application directory
sudo mkdir -p /home/ubuntu/FeatureMe
sudo chown ubuntu:ubuntu /home/ubuntu/FeatureMe

# Clone repository
cd /home/ubuntu
if [ ! -d "FeatureMe" ]; then
    git clone https://github.com/SuperDex7/FeatureMe.git
fi

# Create directories for certificates and nginx config
mkdir -p /home/ubuntu/FeatureMe/docker/certs
mkdir -p /home/ubuntu/FeatureMe/docker/nginx

# Set up nginx config for production
cat > /home/ubuntu/FeatureMe/docker/nginx/nginx.conf << 'EOF'
events {}

http {
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate     /etc/letsencrypt/live/featureme.co/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/featureme.co/privkey.pem;

        # React static site
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Proto https;
            proxy_set_header X-Forwarded-For $remote_addr;
        }

        # Backend API
        location /api/ {
            proxy_pass http://app:8080/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Proto https;
            proxy_set_header X-Forwarded-For $remote_addr;
        }

        # WebSocket endpoint
        location /ws {
            proxy_pass http://app:8080/ws;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Proto https;
            proxy_set_header X-Forwarded-For $remote_addr;
        }
    }

    server {
        listen 80;
        return 301 https://$host$request_uri;
    }
}
EOF

echo "EC2 setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: chmod +x /home/ubuntu/FeatureMe/scripts/setup-ecr.sh"
echo "2. Run: /home/ubuntu/FeatureMe/scripts/setup-ecr.sh"
echo "3. Configure GitHub secrets (see setup-github-secrets.md)"
echo "4. Push your code to trigger deployment"
