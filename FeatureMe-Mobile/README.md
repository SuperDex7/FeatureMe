# FeatureMe Mobile App

A React Native mobile application for the FeatureMe platform, featuring audio playback, social interactions, and post management.

## Features

- **Audio Player**: Full-featured audio player with play/pause, seek, and volume controls
- **Post Viewing**: View detailed post information including track details, artist info, and metadata
- **Comments System**: Add, view, and delete comments on posts
- **Download Support**: Download tracks when enabled by the author
- **User Authentication**: Secure API integration with JWT token management
- **Responsive Design**: Optimized for mobile devices with dark theme

## Project Structure

```
FeatureMe-Mobile/
├── app/
│   ├── _layout.jsx          # Main navigation layout
│   ├── index.jsx            # Home screen
│   ├── post.jsx             # Post detail screen (main feature)
│   ├── feed.jsx             # Feed screen
│   └── profile.jsx          # Profile screen
├── services/
│   ├── api.js               # API client with authentication
│   └── postsService.js      # Post-related API functions
└── components/              # Reusable components (existing)
```

## Key Components

### Post Screen (`app/post.jsx`)
The main feature of the app, includes:
- Hero section with track banner and actions
- Audio player with full controls
- Track details and artist information
- Comments section with pagination
- Download functionality
- Analytics integration (for premium users)

### API Services
- **api.js**: Axios instance with JWT token management and error handling
- **postsService.js**: All post-related API functions (likes, comments, views, downloads)

## Dependencies

- **expo-av**: Audio playback functionality
- **axios**: HTTP client for API requests
- **expo-file-system**: File system operations for downloads
- **expo-sharing**: Share downloaded files
- **@react-native-async-storage/async-storage**: Local storage for auth tokens
- **expo-router**: Navigation system

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Open the app on your device or simulator

## API Configuration

Update the API base URL in `services/api.js`:
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8080/api'  // Development
  : 'https://your-production-domain.com/api';  // Production
```

## Features Implemented

✅ **Completed:**
- Audio player with play/pause, seek, volume controls
- Post viewing with full track details
- Comments system with pagination
- Download functionality
- User authentication integration
- Responsive mobile design
- Navigation structure

🔄 **Future Enhancements:**
- Likes section component
- Views analytics component
- Push notifications
- Offline support
- Enhanced user profiles

## Troubleshooting

### Network Errors
If you see "Network Error" when trying to load posts:

1. **Check if your backend is running** on port 8080
2. **Update the API URL** in `services/api.js`:
   - For Android emulator: `http://10.0.2.2:8080/api`
   - For iOS simulator: `http://localhost:8080/api`
   - For physical device: `http://YOUR_COMPUTER_IP:8080/api`
3. **Demo Mode**: The app will automatically show sample data if the API is unavailable

### Audio Playback Issues
- The app now uses `expo-audio` instead of the deprecated `expo-av`
- Sample audio URLs are provided for testing

### Missing Assets
- The app.json has been simplified to avoid missing icon errors
- Icons can be added later to the `assets/images/` directory

## Notes

- The app uses JavaScript instead of TypeScript for consistency with the web app
- All styling is done with React Native StyleSheet
- Audio playback uses Expo Audio for cross-platform compatibility
- The design follows a dark theme consistent with modern music apps
- Demo mode ensures the app works even without a backend connection