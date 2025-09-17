# Docker Setup for FeatureMe

This guide explains how to run your FeatureMe full-stack application locally using Docker with both HTTP and HTTPS configurations.

## Quick Start

### Option 1: HTTP Only (Simple)
```bash
# Windows PowerShell
.\setup-local.ps1

# Linux/Mac
./setup-local.sh
```
Choose option 1 for HTTP-only setup.

### Option 2: HTTPS with Reverse Proxy
```bash
# Windows PowerShell
.\setup-local.ps1

# Linux/Mac
./setup-local.sh
```
Choose option 2 for HTTPS setup with nginx reverse proxy.

## Manual Setup

### HTTP Only Setup

1. **Start the services:**
   ```bash
   docker-compose -f docker-compose.http.yml up --build -d
   ```

2. **Access your application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - MongoDB: localhost:27017

### HTTPS Setup

1. **Generate SSL certificates:**
   ```bash
   # Windows
   cd docker
   .\generate-certs.bat
   cd ..
   
   # Linux/Mac
   cd docker
   chmod +x generate-certs.sh
   ./generate-certs.sh
   cd ..
   ```

2. **Start the services:**
   ```bash
   docker-compose up --build -d
   ```

3. **Access your application:**
   - Frontend & Backend: https://localhost
   - HTTP requests automatically redirect to HTTPS

## Configuration Details

### Ports

#### HTTP Setup
- **Frontend**: 3000 → 80 (nginx container)
- **Backend**: 8080 → 8080 (Spring Boot container)
- **MongoDB**: 27017 → 27017

#### HTTPS Setup
- **HTTP**: 80 → 80 (nginx, redirects to HTTPS)
- **HTTPS**: 443 → 443 (nginx with SSL)
- **Backend**: Internal only (8080)
- **Frontend**: Internal only (80)
- **MongoDB**: 27017 → 27017

### Services

1. **nginx** (HTTPS setup only)
   - Reverse proxy for frontend and backend
   - SSL termination
   - CORS handling
   - Rate limiting
   - Security headers

2. **app** (Spring Boot Backend)
   - REST API endpoints
   - Authentication
   - Database operations

3. **frontend** (React Frontend)
   - User interface
   - Served by nginx in HTTPS setup

4. **mongo** (MongoDB Database)
   - Data persistence
   - Optional for local development

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB
MONGO_DATABASE=your_database_name
MONGO_USER=your_mongo_user
MONGO_PASSWORD=your_mongo_password
MONGO_CLUSTER=your_mongo_cluster

# AWS
aws_accessKeyId=your_aws_access_key
aws_secretAccessKey=your_aws_secret_key
aws_region=your_aws_region
aws_s3bucket=your_s3_bucket

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION_MS=86400000

# Stripe
public_key=your_stripe_public_key
secret_key=your_stripe_secret_key
webhook_secret=your_stripe_webhook_secret

# Resend
resend_api_key=your_resend_api_key
```

## SSL Certificate Trust

For HTTPS setup, you'll need to trust the self-signed certificate:

### Chrome/Edge
1. Go to `chrome://settings/certificates`
2. Click "Manage certificates" → "Authorities" → "Import"
3. Select `docker/certs/localhost.crt`
4. Check "Trust this certificate for identifying websites"
5. Restart your browser

### Firefox
1. Go to `about:preferences#privacy`
2. Click "View Certificates" → "Authorities" → "Import"
3. Select `docker/certs/localhost.crt`
4. Check "Trust this CA to identify websites"

## Useful Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f nginx
docker-compose logs -f app
docker-compose logs -f frontend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild and restart
docker-compose up --build -d

# Access container shell
docker-compose exec app bash
docker-compose exec frontend sh
docker-compose exec nginx sh

# Check service status
docker-compose ps
```

## Troubleshooting

### Port Already in Use
If you get port conflicts:
```bash
# Check what's using the port
netstat -ano | findstr :8080
netstat -ano | findstr :3000
netstat -ano | findstr :443

# Kill the process (Windows)
taskkill /PID <PID> /F
```

### SSL Certificate Issues
1. Make sure certificates are generated: `docker/certs/localhost.crt` and `docker/certs/localhost.key`
2. Check certificate permissions
3. Import certificate into browser as described above

### CORS Issues
The nginx configuration includes CORS headers. If you still have issues:
1. Check the nginx configuration in `docker/nginx.conf`
2. Verify the frontend is making requests to the correct domain
3. Check browser developer tools for CORS errors

### Database Connection Issues
1. Ensure MongoDB is running: `docker-compose ps`
2. Check MongoDB logs: `docker-compose logs mongo`
3. Verify connection string in environment variables

## Development Workflow

1. **Make changes to your code**
2. **Rebuild the affected service:**
   ```bash
   # Rebuild specific service
   docker-compose up --build -d app
   docker-compose up --build -d frontend
   
   # Or rebuild all
   docker-compose up --build -d
   ```
3. **View logs to verify changes:**
   ```bash
   docker-compose logs -f
   ```

## Production Considerations

This setup is designed for local development. For production:

1. Use proper SSL certificates (not self-signed)
2. Configure proper security headers
3. Set up proper logging and monitoring
4. Use environment-specific configurations
5. Consider using Docker secrets for sensitive data
6. Set up proper backup strategies for MongoDB
