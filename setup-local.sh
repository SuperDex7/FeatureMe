#!/bin/bash

# Setup script for FeatureMe local development
# This script helps you set up the application for local development with Docker

set -e

echo "🚀 Setting up FeatureMe for local development..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

echo "✅ Docker is running"

# Ask user which setup they want
echo ""
echo "Choose your setup:"
echo "1) HTTP only (simple, ports 3000 and 8080)"
echo "2) HTTPS with nginx reverse proxy (ports 80 and 443)"
echo ""
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🔧 Setting up HTTP-only configuration..."
        echo "Frontend will be available at: http://localhost:3000"
        echo "Backend API will be available at: http://localhost:8080"
        echo ""
        echo "Building and starting services..."
        docker-compose -f docker-compose.http.yml up --build -d
        ;;
    2)
        echo "🔧 Setting up HTTPS configuration..."
        
        # Generate SSL certificates if they don't exist
        if [ ! -f "docker/certs/localhost.crt" ]; then
            echo "🔐 Generating SSL certificates..."
            cd docker
            chmod +x generate-certs.sh
            ./generate-certs.sh
            cd ..
        else
            echo "✅ SSL certificates already exist"
        fi
        
        echo "Frontend and Backend will be available at: https://localhost"
        echo "HTTP requests will be redirected to HTTPS"
        echo ""
        echo "Building and starting services..."
        docker-compose up --build -d
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo ""
echo "To rebuild and restart:"
echo "  docker-compose up --build -d"
echo ""

if [ "$choice" = "2" ]; then
    echo "🔐 For HTTPS setup with nginx:"
    echo "1. Open your browser and go to https://localhost"
    echo "2. You may see a security warning - click 'Advanced' and 'Proceed to localhost'"
    echo "3. Or import the certificate from docker/certs/localhost.crt into your browser"
    echo ""
fi

echo "📝 Environment variables:"
echo "Make sure you have a .env file with the required environment variables."
echo "Check the docker-compose.yml file for the list of required variables."
