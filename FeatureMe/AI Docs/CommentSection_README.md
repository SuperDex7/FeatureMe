# CommentSection Component

A reusable React component for handling comments functionality in posts, feeds, and other content items.

## Features

- **Reusable**: Can be used across different components with different styling prefixes
- **Configurable**: Customizable max height, placeholder text, and CSS classes
- **Real-time**: Handles comment creation and updates in real-time
- **Responsive**: Mobile-friendly design with responsive breakpoints
- **Consistent**: Maintains consistent styling and behavior across the app

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `postId` | string | required | The ID of the post this comment section belongs to |
| `comments` | array | `[]` | Array of comment objects |
| `onAddComment` | function | required | Callback function when a new comment is added |
| `showComments` | boolean | required | Whether comments are currently visible |
| `setShowComments` | function | required | Function to toggle comment visibility |
| `maxHeight` | string | `"300px"` | Maximum height for the comments list |
| `placeholder` | string | `"Add a comment..."` | Placeholder text for the comment input |

## Comment Object Structure

Each comment should have the following structure:

```javascript
{
  userName: "username",
  profilePic: "profile_picture_url",
  comment: "comment_text",
  time: "2024-01-01T00:00:00.000Z"
}
```

## Usage Examples

### Basic Usage

```jsx
import CommentSection from './CommentSection';

// In your component
<CommentSection
  postId={id}
  comments={comments}
  onAddComment={handleModalAddComment}
  showComments={showComments}
  setShowComments={setShowComments}
/>
```

### Custom Configuration

```jsx
<CommentSection
  postId={id}
  comments={comments}
  onAddComment={onAddComment}
  showComments={showComments}
  setShowComments={setShowComments}
  maxHeight="400px"
  placeholder="Share your thoughts..."
/>
```

## CSS Classes

The component uses consistent CSS classes:

- `.comment-section-container` - Main comments container
- `.comment-section-header` - Header with title and count
- `.comment-section-body` - Scrollable body section
- `.comment-section-footer` - Footer with input
- `.comments-list` - Scrollable comments list
- `.comment-item` - Individual comment
- `.add-comment-row` - Comment input row
- `.add-comment-input` - Comment input field
- `.add-comment-btn` - Post comment button

## Integration

### 1. Import the Component

```jsx
import CommentSection from './CommentSection';
```

### 2. Add Required State

```jsx
const [showComments, setShowComments] = useState(false);
```

### 3. Handle Comment Updates

```jsx
const handleModalAddComment = (newComment) => {
  if (typeof newComment === 'object' && newComment.comment) {
    setAllComments(prev => [...(prev || []), newComment]);
  } else if (Array.isArray(newComment)) {
    setAllComments(newComment);
  }
};
```

### 4. Use in JSX

```jsx
{showComments ? (
  <CommentSection
    postId={id}
    comments={comments}
    onAddComment={handleModalAddComment}
    showComments={showComments}
    setShowComments={setShowComments}
  />
) : (
  // Your likes section
)}
```

## Styling

The component comes with built-in CSS that provides:

- **Modern Design**: Glassmorphism with backdrop blur effects
- **Colorful Interface**: Purple/blue gradient theme with accent colors
- **Smooth Animations**: Hover effects and transitions
- **Fixed Layout**: Header and footer stay in view, comments scroll
- **Responsive Design**: Mobile-friendly layout
- **Accessibility**: Focus states and proper contrast

### Key Features

- **Fixed Header**: Shows comment count and title
- **Scrollable Body**: Only comments scroll, no double scrollbars
- **Fixed Footer**: Input always visible at bottom
- **Color-coded Elements**: Usernames in blue, timestamps in muted colors
- **Interactive Elements**: Hover effects on avatars and buttons

## Benefits

1. **Code Reusability**: Eliminates duplicate comment code across components
2. **Maintainability**: Single source of truth for comment functionality
3. **Consistency**: Ensures consistent comment behavior across the app
4. **Flexibility**: Easy to customize for different use cases
5. **Performance**: Optimized rendering and state management

## Migration from Old Code

### Before (Duplicate Code)

```jsx
// In FeedItem.jsx
<div className="feed-card-comments-section">
  <div className="feed-card-comments-title">Comments</div>
  <div className="comments-list">
    {comments?.map((comment, index) => (
      // ... comment rendering logic
    ))}
  </div>
  <div className="feed-card-add-comment-row">
    <input className="feed-card-add-comment-input" />
    <button className="feed-card-add-comment-btn">Post</button>
  </div>
</div>

// In SpotlightItem.jsx (similar duplicate code)
<div className="spotlight-modal-comments-section">
  // ... same logic with different class names
</div>
```

### After (Reusable Component)

```jsx
// In FeedItem.jsx
<CommentSection
  postId={id}
  comments={comments}
  onAddComment={handleModalAddComment}
  showComments={showComments}
  setShowComments={setShowComments}
/>

// In SpotlightItem.jsx
<CommentSection
  postId={id}
  comments={comments}
  onAddComment={onAddComment}
  showComments={showComments}
  setShowComments={setShowComments}
/>
```

## Future Enhancements

- Comment editing functionality
- Comment deletion with authorization
- Comment likes and reactions
- Nested replies
- Comment moderation tools
- Rich text formatting
- File attachments
- Mention system (@username)
