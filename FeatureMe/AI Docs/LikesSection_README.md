# LikesSection Component

A reusable React component for handling likes functionality in posts, feeds, and other content items.

## Features

- **Reusable**: Can be used across different components consistently
- **Smart Like Logic**: Handles both like and unlike functionality
- **Real-time Updates**: Optimistic UI updates with server synchronization
- **Beautiful Design**: Red/orange gradient theme with smooth animations
- **Responsive**: Mobile-friendly design with responsive breakpoints

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `postId` | string | required | The ID of the post this likes section belongs to |
| `likes` | array | `[]` | Array of like objects |
| `onLikeUpdate` | function | optional | Callback function when likes are updated |
| `showLikes` | boolean | required | Whether likes are currently visible |
| `setShowLikes` | function | required | Function to toggle likes visibility |
| `maxHeight` | string | `"300px"` | Maximum height for the likes list |

## Like Object Structure

Each like should have the following structure:

```javascript
{
  userName: "username",
  profilePic: "profile_picture_url"
}
```

## Usage Examples

### Basic Usage

```jsx
import LikesSection from './LikesSection';

// In your component
<LikesSection
  postId={id}
  likes={likes}
  onLikeUpdate={handleLikeUpdate}
  showLikes={!showComments}
  setShowLikes={setShowComments}
/>
```

### With Custom Height

```jsx
<LikesSection
  postId={id}
  likes={likes}
  onLikeUpdate={handleLikeUpdate}
  showLikes={!showComments}
  setShowLikes={setShowComments}
  maxHeight="400px"
/>
```

## Integration

### 1. Import the Component

```jsx
import LikesSection from './LikesSection';
```

### 2. Add Required State

```jsx
const [localLikes, setLocalLikes] = useState(likes || []);
```

### 3. Handle Like Updates

```jsx
const handleLikeUpdate = (updatedLikes) => {
  setLocalLikes(updatedLikes);
};
```

### 4. Use in JSX

```jsx
{!showComments ? (
  <LikesSection
    postId={id}
    likes={localLikes}
    onLikeUpdate={handleLikeUpdate}
    showLikes={!showComments}
    setShowLikes={setShowComments}
  />
) : (
  // Your comments section
)}
```

## CSS Classes

The component uses consistent CSS classes:

- `.likes-section-container` - Main likes container
- `.likes-section-header` - Header with title and count
- `.likes-section-body` - Body section with like button and list
- `.like-button-container` - Container for the like/unlike button
- `.like-btn` - Like/unlike button
- `.likes-list` - Scrollable likes list
- `.like-item` - Individual like item
- `.like-avatar` - User avatar in like item
- `.like-username` - Username in like item

## Styling

The component comes with built-in CSS that provides:

- **Red/Orange Theme**: Gradient colors matching the heart/like concept
- **Interactive Button**: Like/Unlike button with state changes
- **Smooth Animations**: Hover effects, pulse animation for liked state
- **Fixed Layout**: Header and body sections with proper spacing
- **Responsive Design**: Mobile-friendly layout

### Key Features

- **Like Button**: Shows "Like" or "Unlike" based on current state
- **Like Count**: Displays total number of likes in header
- **User List**: Shows all users who liked the post
- **Profile Links**: Clickable usernames that link to profiles
- **Empty State**: Beautiful message when no likes exist

## How It Works

### Like Flow:
1. **User clicks Like** → Button shows "Unlike" immediately
2. **Optimistic Update** → Like appears in list instantly
3. **Server Request** → Like sent to backend
4. **Server Response** → List updated with server data
5. **Error Handling** → Reverts changes if server fails

### Unlike Flow:
1. **User clicks Unlike** → Button shows "Like" immediately
2. **Optimistic Update** → Like removed from list instantly
3. **Server Request** → Unlike sent to backend
4. **Server Response** → List updated with server data
5. **Error Handling** → Reverts changes if server fails

## Benefits

1. **Code Reusability**: Eliminates duplicate likes code across components
2. **Smart Logic**: Handles both like and unlike in one component
3. **Optimistic UI**: Instant feedback for better user experience
4. **Error Handling**: Graceful fallback if server requests fail
5. **Consistent Design**: Same look and feel across all components

## Migration from Old Code

### Before (Duplicate Code)

```jsx
// In FeedItem.jsx
<div className="feed-card-likes-section">
  <div className="feed-card-comments-title">Likes</div>
  <button onClick={handleLike}>Like</button>
  <ul className="feed-card-likes-list">
    {localLikes.map((like, idx) => (
      <li key={idx} className="feed-card-like-user">
        <img src={like.profilePic} alt="profile" />
        <a href={`/profile/${like.userName}`}>{like.userName}</a>
      </li>
    ))}
  </ul>
</div>

// In SpotlightItem.jsx (similar duplicate code)
<div className="spotlight-modal-likes-section">
  // ... same logic with different class names
</div>
```

### After (Reusable Component)

```jsx
// In FeedItem.jsx
<LikesSection
  postId={id}
  likes={localLikes}
  onLikeUpdate={handleLikeUpdate}
  showLikes={!showComments}
  setShowLikes={setShowComments}
/>

// In SpotlightItem.jsx
<LikesSection
  postId={id}
  likes={localLikes}
  onLikeUpdate={handleLikeUpdate}
  showLikes={!showComments}
  setShowLikes={setShowComments}
/>
```

## Future Enhancements

- Like notifications
- Like analytics and insights
- Like reactions (different types of likes)
- Like sharing
- Like moderation tools
- Like history tracking
