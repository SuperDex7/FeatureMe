<div align="center">
  <img src="https://raw.githubusercontent.com/SuperDex7/FeatureMe/main/react-feature/public/Jpgs/Asset%2012.jpg" alt="FeatureMe" width="800" />
  <br><br>
  <img src="https://raw.githubusercontent.com/SuperDex7/FeatureMe/main/react-feature/public/PNGs/Logo+Text%20Gradient.png" alt="FeatureMe Logo" width="200" />
  <br><br>
  <img src="https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk" alt="Java 21" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5.6-brightgreen?style=for-the-badge&logo=spring" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/React%20Native-0.81.5-blue?style=for-the-badge&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-54.0.20-black?style=for-the-badge&logo=expo" alt="Expo" />
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
- 🎧 **Audio Player** - Built-in audio player with background playback support
- 📊 **Analytics** - Track views, likes, downloads, and engagement on your posts
- 🏆 **Badge System** - Earn recognition for your achievements
- 📱 **Multi-Platform** - Web application and native iOS/Android mobile apps
- 🔗 **Universal Links** - Deep linking support for seamless app navigation
- 💳 **Subscription System** - Stripe-powered subscriptions with Plus tier benefits

## 🏗️ Architecture

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.5.6 with Java 21
- **Database**: MongoDB Atlas for flexible document storage
- **Security**: JWT authentication with Spring Security
- **File Storage**: AWS S3 for music files, images, and media
- **Payments**: Stripe integration for subscriptions (USER and USERPLUS tiers)
- **Real-time**: WebSocket support for live messaging
- **Email**: Resend API for email verification and notifications
- **Caching**: Redis for session management and performance optimization

### Web Frontend (React)
- **Framework**: React 19.0.0 with Vite
- **Routing**: React Router v7 for navigation
- **State Management**: React Query (TanStack Query) for server state
- **Styling**: Custom CSS with glassmorphism design principles
- **Real-time**: SockJS + STOMP for WebSocket communication
- **Payments**: Stripe.js for subscription management

### Mobile App (React Native)
- **Framework**: React Native 0.81.5 with Expo 54.0.20
- **Routing**: Expo Router v6 for file-based navigation
- **Audio**: Expo Audio with background playback support
- **Storage**: AsyncStorage for local data persistence
- **Deep Linking**: Universal Links for iOS and Android
- **Platforms**: iOS (App Store) and Android support
- **Features**: Native camera, image picker, file system access

### Infrastructure
- **Containerization**: Docker with multi-service setup
- **Reverse Proxy**: Nginx with SSL termination
- **Database**: MongoDB Atlas with connection pooling
- **Cloud Storage**: AWS S3 for scalable file storage
- **Deployment**: AWS EC2 for hosting web services
- **CI/CD**: GitHub Actions for automated deployments

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
- **USER** tier: Free tier with basic features
- **USERPLUS** tier: Premium subscription with enhanced features
  - Larger file upload limits (90MB vs 15MB)
  - GIF profile pictures and banners
  - Additional demo upload slots
- Monthly or Yearly subscription options
- Stripe Dashboard for subscription management

### 📱 Mobile App Features
- Native iOS and Android applications
- Full feature parity with web application
- Background audio playback
- Universal links for deep navigation
- Push notifications (ready for implementation)

## 🛠️ Development

### Project Structure
```
FeatureMe/
├── FeatureMe/                # Spring Boot Backend
│   ├── src/main/java/        # Java source code
│   ├── src/main/resources/   # Configuration files
│   ├── Dockerfile            # Backend container config
│   └── pom.xml               # Maven dependencies
├── react-feature/            # React Web Frontend
│   ├── src/                  # React source code
│   │   ├── Components/       # Reusable components
│   │   ├── Pages/            # Page components
│   │   └── services/         # API services
│   ├── public/               # Static assets
│   ├── Dockerfile            # Frontend container config
│   └── package.json          # Node dependencies
├── FeatureMe-Mobile/         # React Native Mobile App
│   ├── app/                  # Expo Router pages
│   ├── components/           # React Native components
│   ├── services/             # API services
│   ├── contexts/             # React contexts
│   ├── assets/               # Images and assets
│   ├── app.json              # Expo configuration
│   └── package.json          # Node dependencies
├── docker/                   # Docker configuration
│   ├── nginx/                # Nginx setup
│   └── certs/                # SSL certificates
├── scripts/                  # Deployment scripts
└── docker-compose.yml        # Container orchestration
```

### Key Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend API | Spring Boot 3.5.6 | REST API, Security, Business Logic |
| Web Frontend | React 19.0.0 + Vite | Web User Interface, State Management |
| Mobile App | React Native 0.81.5 + Expo 54 | Native iOS/Android Applications |
| Database | MongoDB Atlas | Document Storage, User Data, Posts |
| File Storage | AWS S3 | Audio Files, Images, Media |
| Authentication | JWT + Spring Security | User Authentication, Authorization |
| Payments | Stripe | Subscription Plans, Payment Processing |
| Real-time | WebSocket + SockJS + STOMP | Live Messaging |
| Caching | Redis | Session Management, Performance |
| Containerization | Docker + Docker Compose | Deployment, Scaling |
| Reverse Proxy | Nginx | SSL, Load Balancing, CORS |
| Mobile Deployment | Expo Application Services (EAS) | iOS App Store, TestFlight |


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

#### Mobile App Setup
```bash
cd FeatureMe-Mobile
npm install
npx expo start

# For iOS
npx expo start --ios

# For Android
npx expo start --android
```

**Note**: For production builds, use Expo Application Services (EAS):
```bash
# Install EAS CLI
npm install -g eas-cli

# Login and configure
eas login
eas build:configure

# Build for iOS/Android
eas build --platform ios
eas build --platform android
```

## 🔧 API Endpoints

### Authentication
- `POST /api/user/auth/create` - User registration (multipart/form-data)
- `POST /api/user/auth/login` - User login
- `GET /api/user/auth/check-email/{email}` - Check email availability
- `GET /api/user/auth/check-username/{username}` - Check username availability
- `POST /api/user/auth/email/{email}` - Send verification email
- `POST /api/user/auth/verify-code` - Verify email code
- `POST /api/user/auth/reset-password` - Request password reset

### Posts
- `GET /api/posts/get/all` - Get all posts (paginated)
- `GET /api/posts/get/{id}` - Get specific post
- `POST /api/posts/create` - Create new post (multipart/form-data)
- `DELETE /api/posts/delete/{id}` - Delete post
- `POST /api/posts/like/{postId}` - Like/unlike a post
- `POST /api/posts/comment/{postId}` - Add comment to post
- `GET /api/posts/comments/{postId}` - Get post comments
- `POST /api/posts/view/{postId}` - Track post view
- `POST /api/posts/download/{postId}` - Track download

### Users
- `GET /api/user/me` - Get current user profile
- `GET /api/user/{username}` - Get user profile by username
- `PATCH /api/user/update` - Update user profile (multipart/form-data)
- `DELETE /api/user/delete/{id}` - Delete user account
- `POST /api/user/follow/{username}` - Follow user
- `POST /api/user/unfollow/{username}` - Unfollow user
- `GET /api/user/{username}/followers` - Get user followers
- `GET /api/user/{username}/following` - Get users following

### Messaging
- `GET /api/chats` - Get user chats
- `GET /api/chats/{chatId}/messages` - Get chat messages
- `POST /api/chats` - Create new chat
- `WebSocket /ws` - Real-time messaging endpoint

### Subscriptions
- `GET /api/subscription/checkout` - Create Stripe checkout session
- `POST /api/subscription/webhook` - Stripe webhook handler
- `GET /api/subscription/status` - Get subscription status

## 🚀 Deployment

### Production Deployment

#### Web Application
1. **Web Hosting**: Deploy containers on AWS EC2 instances
2. **Domain Registration**: Domain registered through GoDaddy (featureme.co)
3. **HTTPS Certs**: Certbot for HTTPS Certifications
4. **Database**: MongoDB Atlas for production database
5. **File Storage**: AWS S3 for scalable file storage
6. **SSL Certificates**: Configure SSL certificates for HTTPS
7. **Environment Variables**: Set up production environment variables
8. **Docker Deployment**: Deploy using Docker Compose on EC2
9. **CI/CD**: GitHub Actions for automated deployments

#### Mobile Application
1. **iOS Deployment**:
   - Configure App Store Connect
   - Build with EAS Build
   - Submit to TestFlight for beta testing
   - Submit to App Store for production release
   
2. **Android Deployment**:
   - Build with EAS Build
   - Submit to Google Play Console

3. **Universal Links**:
   - Host AASA file at `/.well-known/apple-app-site-association`
   - Configure Android App Links
   - Test deep linking functionality

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
