# Setup script for FeatureMe local development
# This script helps you set up the application for local development with Docker

Write-Host "🚀 Setting up FeatureMe for local development..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
    Write-Host "✅ docker-compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ docker-compose is not installed. Please install docker-compose and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Choose your setup:" -ForegroundColor Yellow
Write-Host "1) HTTP only (simple, ports 3000 and 8080)" -ForegroundColor Cyan
Write-Host "2) HTTPS with nginx reverse proxy (ports 80 and 443)" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Enter your choice (1 or 2)"

switch ($choice) {
    "1" {
        Write-Host "🔧 Setting up HTTP-only configuration..." -ForegroundColor Yellow
        Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Backend API will be available at: http://localhost:8080" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Building and starting services..." -ForegroundColor Yellow
        docker-compose -f docker-compose.http.yml up --build -d
    }
    "2" {
        Write-Host "🔧 Setting up HTTPS configuration..." -ForegroundColor Yellow
        
        # Generate SSL certificates if they don't exist
        if (-not (Test-Path "docker/certs/localhost.crt")) {
            Write-Host "🔐 Generating SSL certificates..." -ForegroundColor Yellow
            Set-Location docker
            & .\generate-certs.sh
            Set-Location ..
        } else {
            Write-Host "✅ SSL certificates already exist" -ForegroundColor Green
        }
        
        Write-Host "Frontend and Backend will be available at: https://localhost" -ForegroundColor Cyan
        Write-Host "HTTP requests will be redirected to HTTPS" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Building and starting services..." -ForegroundColor Yellow
        docker-compose up --build -d
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again and choose 1 or 2." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "To stop services:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "To rebuild and restart:" -ForegroundColor Yellow
Write-Host "  docker-compose up --build -d" -ForegroundColor White
Write-Host ""

if ($choice -eq "2") {
    Write-Host "🔐 For HTTPS setup with nginx:" -ForegroundColor Yellow
    Write-Host "1. Open your browser and go to https://localhost" -ForegroundColor White
    Write-Host "2. You may see a security warning - click 'Advanced' and 'Proceed to localhost'" -ForegroundColor White
    Write-Host "3. Or import the certificate from docker/certs/localhost.crt into your browser" -ForegroundColor White
    Write-Host ""
}

Write-Host "📝 Environment variables:" -ForegroundColor Yellow
Write-Host "Make sure you have a .env file with the required environment variables." -ForegroundColor White
Write-Host "Check the docker-compose.yml file for the list of required variables." -ForegroundColor White
