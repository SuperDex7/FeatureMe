# LoggedInHeader Component

A comprehensive header component for the FeatureMe mobile app that provides navigation, notifications, user management, and quick access to key features.

## Features

- **Notifications**: Real-time notification display with badge count and modal view
- **User Search**: Quick access to user search functionality
- **Messaging**: Direct access to messaging features
- **Feature Requests**: Submit and manage feature requests
- **User Menu**: Profile access, logout, and additional options
- **Responsive Design**: Matches the website header design patterns
- **Safe Area Support**: Properly handles device safe areas

## Components Created

### 1. LoggedInHeader (`components/ui/LoggedInHeader.jsx`)
The main header component with:
- Logo with navigation to main app
- Notifications button with badge
- User avatar with dropdown menu
- Modal overlays for notifications and user menu

### 2. User Search (`app/user-search.jsx`)
Full-featured user search screen with:
- Real-time search functionality
- User list with avatars and roles
- Navigation to user profiles
- Empty state handling

### 3. Messages (`app/messages.jsx`)
Messaging interface with:
- Conversation list (placeholder)
- New message modal
- Coming soon messaging features
- Empty state with call-to-action

### 4. Feature Requests (`app/feature-request.jsx`)
Feature request management with:
- List of existing feature requests
- Status tracking (pending, in-progress, completed)
- Voting system
- New request submission modal
- Genre-based organization

### 5. Create Post (`app/create-post.jsx`)
Post creation interface with:
- Form inputs for title, description, features
- Genre selection
- Audio file upload
- Live preview
- Form validation

## Integration

### Basic Integration
```jsx
import LoggedInHeader from '../components/ui/LoggedInHeader';

export default function YourScreen() {
  return (
    <View style={styles.container}>
      <LoggedInHeader />
      {/* Your content with proper top padding */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingTop: 100 }}>
        {/* Your existing content */}
      </ScrollView>
    </View>
  );
}
```

### Styling Considerations
- The header is positioned absolutely at the top
- Content should have `paddingTop: 100` to account for header height
- Safe area insets are handled automatically
- Header height is approximately 100px including safe area

## API Integration

The header integrates with existing services:
- `api.js` - Authentication and API calls
- `userService.js` - User-related operations
- `getCurrentUser()` - Current user data
- `clearMyNotifications()` - Notification management

## Navigation Routes

The header provides navigation to:
- `/main-app` - Main application (logo tap)
- `/user-search` - User search screen
- `/messages` - Messaging interface
- `/feature-request` - Feature request management
- `/create-post` - Post creation
- `/profile/{username}` - User profiles
- `/login` - Logout redirect

## Design Patterns

### Visual Design
- Dark theme with glassmorphism effects
- Gradient accents (#667eea to #764ba2)
- Rounded corners and subtle shadows
- Consistent spacing and typography

### Interaction Patterns
- Modal overlays for dropdowns
- Smooth animations and transitions
- Touch-friendly button sizes (44px minimum)
- Haptic feedback support

### Responsive Behavior
- Adapts to different screen sizes
- Handles safe area insets properly
- Optimized for mobile touch interfaces
- Consistent with website design language

## Customization

### Styling
All styles are defined in the component using StyleSheet.create() for optimal performance. Key customizable elements:
- Colors and gradients
- Border radius and shadows
- Typography and spacing
- Animation durations

### Functionality
The component can be extended with:
- Additional menu items
- Custom notification handling
- Different user roles/permissions
- Theme switching support

## Dependencies

Required packages:
- `react-native` - Core React Native components
- `expo-linear-gradient` - Gradient backgrounds
- `expo-router` - Navigation
- `react-native-safe-area-context` - Safe area handling
- `@react-native-async-storage/async-storage` - Local storage

## Future Enhancements

Potential improvements:
- Real-time notification updates
- Push notification integration
- Offline support
- Accessibility improvements
- Theme customization
- Animation enhancements
- Performance optimizations

## Usage Example

See `app/feed-with-header-example.jsx` for a complete integration example showing how to replace an existing header with the new LoggedInHeader component.
