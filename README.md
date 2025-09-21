# 🎵 FeatureMe

<div align="center">
  <img src="https://raw.githubusercontent.com/SuperDex7/FeatureMe/main/react-feature/public/CurrentLogo.jpg" alt="FeatureMe Logo" width="100" height="100" />
  <br><br>
  <img src="https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk" alt="Java 21" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5.5-brightgreen?style=for-the-badge&logo=spring" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</div>

<div align="center">
  <h3>🌐 <a href="https://featureme.co/" target="_blank">Visit FeatureMe.co</a></h3>
  <p><strong>Where Musicians Connect, Create, and Get Discovered</strong></p>
</div>

---

## 🎯 Overview

FeatureMe is a music collaboration platform that connects musicians, producers, and artists worldwide. Built with modern technologies, it provides a seamless experience for discovering talent, collaborating on projects, and sharing musical creations.

### ✨ Key Features

- 🎼 **Music Sharing & Discovery** - Upload and share your music, beats, and demos
- 🤝 **Collaboration Hub** - Connect with artists and request features on tracks
- 💬 **Real-time Messaging** - Chat with other musicians and collaborators
- 👥 **Social Network** - Follow artists, like posts, and build your music community
- 🎧 **Audio Player** - Built-in audio player for seamless music streaming
- 📊 **Analytics** - Track views, likes, and engagement on your posts
- 🏆 **Badge System** - Earn recognition for your achievements
- 📱 **Responsive Design** - Optimized for desktop and mobile devices

## 🏗️ Architecture

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.5.5 with Java 21
- **Database**: MongoDB for flexible document storage
- **Security**: JWT authentication with Spring Security
- **File Storage**: AWS S3 for music files and media
- **Payments**: Stripe integration for subscriptions
- **Real-time**: WebSocket support for live messaging
- **Email**: Resend API for notifications

### Frontend (React)
- **Framework**: React 19.0.0 with Vite
- **Routing**: React Router for navigation
- **State Management**: React Query for server state
- **Styling**: Custom CSS with modern design principles
- **Real-time**: SockJS + STOMP for WebSocket communication

### Infrastructure
- **Containerization**: Docker with multi-service setup
- **Reverse Proxy**: Nginx with SSL termination
- **Database**: MongoDB with connection pooling
- **Cloud Storage**: AWS S3 for scalable file storage

## 📱 Core Functionality

### 🎵 Music Posts
- Upload audio files with metadata (title, description, genre)
- Set pricing for paid downloads or offer free content (TBD)
- Request features from other artists
- Track analytics (views, likes, downloads)

### 👤 User Profiles
- Customizable profiles with bio, location, and social media
- Badge system for achievements
- Friend/follower system
- Demo showcase

### 💬 Messaging System
- Real-time chat with other users
- File sharing in conversations
- Message history and notifications

### 💳 Payment Integration
- Stripe-powered subscription system
- Monthly or Yearly Subscriptions
- Stripe Dashboard to Review Subscription

## 🛠️ Development

### Project Structure
```
FeatureMe/
├── FeatureMe/                # Spring Boot Backend
│   ├── src/main/java/        # Java source code
│   ├── src/main/resources/   # Configuration files
│   └── pom.xml               # Maven dependencies
├── react-feature/            # React Frontend
│   ├── src/                  # React source code
│   ├── public/               # Static assets
│   └── package.json          # Node dependencies
├── docker/                   # Docker configuration
│   ├── nginx/                # Nginx setup
│   └── certs/                # SSL certificates
└── docker-compose.yml        # Container orchestration
```

### Key Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend API | Spring Boot 3.5.5 | REST API, Security, Business Logic |
| Frontend | React 19.0.0 | User Interface, State Management |
| Database | MongoDB | Document Storage, User Data, Posts |
| File Storage | AWS S3 | Audio Files, Images, Media |
| Authentication | JWT + Spring Security | User Authentication, Authorization |
| Payments | Stripe | Subscription, Payment Processing |
| Real-time | WebSocket + SockJS | Live Messaging |
| Containerization | Docker + Docker Compose | Deployment, Scaling |
| Reverse Proxy | Nginx | SSL, Load Balancing, CORS |


## 🎨 Features in Detail

### 🎼 Music Collaboration
- **Post Creation**: Upload tracks with detailed metadata
- **Feature Requests**: Request collaborations from other artists
- **Approval Workflow**: Manage pending feature requests
- **Genre Classification**: Organize content by musical styles

### 👥 Social Features
- **User Discovery**: Search and find other musicians
- **Following System**: Follow your favorite artists
- **Like & Comment**: Engage with community content

### 💬 Communication
- **Direct Messaging**: Private conversations between users
- **File Sharing**: Exchange audio files and documents
- **Real-time Updates**: Instant message delivery

### 📊 Analytics
- **Post Performance**: Track views, likes, and downloads
- **User Engagement**: Monitor follower growth and interactions

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Java 21 (for local development)
- Node.js 18+ (for frontend development)

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/SuperDex7/FeatureMe.git
   cd FeatureMe
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   # HTTP setup (simple)
   docker-compose -f docker-compose.http.yml up --build -d
   
   # OR HTTPS setup (production-like)
   docker-compose up --build -d
   ```

4. **Access the application**
   - **Frontend**: http://localhost:3000 (HTTP) or https://localhost (HTTPS)
   - **Backend API**: http://localhost:8080
   - **MongoDB**: localhost:27017

### Option 2: Local Development

#### Backend Setup
```bash
cd FeatureMe
./mvnw spring-boot:run
```

#### Frontend Setup
```bash
cd react-feature
npm install
npm run dev
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/{id}` - Get specific post
- `PUT /api/posts/{id}` - Update post
- `DELETE /api/posts/{id}` - Delete post

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{username}` - Get user profile
- `PUT /api/users/{username}` - Update profile

### Messaging
- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send message
- `WebSocket /ws` - Real-time messaging

## 🚀 Deployment

### Production Deployment
1. **Web Hosting**: Deploy containers on AWS EC2 instances
2. **Domain Registration**: Domain registered through GoDaddy
3. **HTTPS Certs**: Certbot for HTTPS Certifications
4. **Database**: MongoDB Atlas or AWS RDS for production database
5. **File Storage**: AWS S3 for scalable file storage
6. **SSL Certificates**: Configure SSL certificates for HTTPS
7. **Environment Variables**: Set up production environment variables
8. **Docker Deployment**: Deploy using Docker Compose on EC2

### Environment Setup
```bash
# Generate SSL certificates
cd docker
./generate-certs.sh

# Start production services
docker-compose up --build -d
```

## 🤝 Contributing

I welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow Java coding standards for backend
- Use ESLint for frontend code quality
- Write tests for new features
- Update documentation as needed


## 🌟 Acknowledgments

- Built with ❤️ for the music community
- Inspired by the need for better artist collaboration tools
- Thanks to all contributors and the open-source community

---

<div align="center">
  <p><strong>🎵 Connect with the music community at <a href="https://featureme.co/">FeatureMe.co</a> 🎵</strong></p>
  <p>Made with ❤️ for musicians, by musicians</p>
</div>
