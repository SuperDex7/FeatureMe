# Comments System Enhancement Todo

## Phase 1: Backend Structure Enhancement (Week 1)

### Update Comment Structure
- [ ] Modify `Posts.java` entity
  - [ ] Add `id` field to Comment inner class
  - [ ] Add `likes` field for comment likes
  - [ ] Add `replies` field for nested replies (optional)
  - [ ] Update Comment inner class with proper getters/setters
- [ ] Update comment creation logic
  - [ ] Generate unique UUID for each comment
  - [ ] Ensure proper timestamp handling
  - [ ] Validate comment content

### Add Comment ID Generation
- [ ] Update `Comment` inner class constructor
  - [ ] Auto-generate UUID on comment creation
  - [ ] Ensure ID uniqueness across all posts
- [ ] Update existing comments in database
  - [ ] Migration script to add IDs to existing comments
  - [ ] Handle comments without IDs gracefully

## Phase 2: Delete Comment Endpoint (Week 1-2)

### Backend Implementation
- [ ] Create delete comment endpoint in `PostsController.java`
  - [ ] `DELETE /api/posts/{postId}/comments/{commentId}`
  - [ ] Proper JWT authentication
  - [ ] Authorization checks (comment owner OR post owner)
- [ ] Implement authorization logic
  - [ ] Extract user from JWT token
  - [ ] Verify user owns comment OR post
  - [ ] Handle unauthorized access gracefully
- [ ] Add validation
  - [ ] Check if post exists
  - [ ] Check if comment exists
  - [ ] Validate user permissions

### Security Implementation
- [ ] Update security configuration
  - [ ] Add delete comment endpoint to protected routes
  - [ ] Ensure proper JWT validation
- [ ] Add rate limiting
  - [ ] Prevent abuse of delete endpoint
  - [ ] Log all delete operations for audit

## Phase 3: Frontend Comment Management (Week 2)

### Update Comment Structure
- [ ] Modify `FeedItem.jsx` comment handling
  - [ ] Update comment state to include IDs
  - [ ] Handle comment deletion in UI
  - [ ] Update comment display to show delete buttons
- [ ] Add delete functionality
  - [ ] Delete button for comment owners
  - [ ] Delete button for post owners
  - [ ] Confirmation dialog before deletion

### UI Enhancements
- [ ] Add delete buttons to comments
  - [ ] Show only for authorized users
  - [ ] Style delete buttons consistently
  - [ ] Add hover effects and confirmations
- [ ] Update comment display
  - [ ] Ensure comment IDs are properly handled
  - [ ] Update comment counting logic
  - [ ] Handle comment updates gracefully

## Phase 4: Comment Likes System (Week 2-3)

### Backend Implementation
- [ ] Add comment like endpoint
  - [ ] `POST /api/posts/{postId}/comments/{commentId}/like/{username}`
  - [ ] Toggle like functionality
  - [ ] Update comment like count
- [ ] Update comment structure
  - [ ] Add likes array to Comment class
  - [ ] Handle like/unlike logic
  - [ ] Prevent duplicate likes from same user

### Frontend Implementation
- [ ] Add like buttons to comments
  - [ ] Show like count
  - [ ] Toggle like state
  - [ ] Update UI immediately on like
- [ ] Integrate with existing like system
  - [ ] Use similar styling to post likes
  - [ ] Consistent user experience

## Phase 5: Comment Replies (Optional - Week 3-4)

### Backend Structure
- [ ] Extend Comment class for replies
  - [ ] Add `replies` field as List<Comment>
  - [ ] Update comment creation to handle replies
  - [ ] Add reply-specific endpoints
- [ ] Implement reply logic
  - [ ] `POST /api/posts/{postId}/comments/{commentId}/reply`
  - [ ] Handle nested comment display
  - [ ] Limit reply depth (e.g., max 2 levels)

### Frontend Implementation
- [ ] Add reply functionality to comments
  - [ ] Reply button on each comment
  - [ ] Nested comment display
  - [ ] Reply input fields
- [ ] Update comment display
  - [ ] Show reply count
  - [ ] Collapsible reply threads
  - [ ] Proper indentation for replies

## Phase 6: Comment Moderation (Week 3-4)

### Backend Moderation
- [ ] Add comment reporting endpoint
  - [ ] `POST /api/posts/{postId}/comments/{commentId}/report`
  - [ ] Store report reasons
  - [ ] Track report counts
- [ ] Implement moderation actions
  - [ ] Auto-hide comments with multiple reports
  - [ ] Admin review system
  - [ ] Comment removal by moderators

### Frontend Moderation
- [ ] Add report functionality
  - [ ] Report button on comments
  - [ ] Report reason selection
  - [ ] Confirmation dialogs
- [ ] Show moderation status
  - [ ] Indicate hidden comments
  - [ ] Show moderation actions

## Phase 7: Performance & Polish (Week 4)

### Performance Optimization
- [ ] Implement comment pagination
  - [ ] Load comments in chunks
  - [ ] Lazy loading for long comment threads
  - [ ] Optimize comment queries
- [ ] Add comment caching
  - [ ] Cache frequently accessed comments
  - [ ] Reduce database calls

### UI/UX Improvements
- [ ] Add comment sorting options
  - [ ] Sort by time (newest/oldest)
  - [ ] Sort by likes
  - [ ] Sort by replies
- [ ] Improve comment input
  - [ ] Character count
  - [ ] Auto-resize textarea
  - [ ] Mention users with @ symbol

## Phase 8: Testing & Validation (Week 4-5)

### Backend Testing
- [ ] Unit tests for comment services
  - [ ] Test comment creation
  - [ ] Test comment deletion
  - [ ] Test authorization logic
- [ ] Integration tests
  - [ ] Test complete comment flow
  - [ ] Test error handling
  - [ ] Test security measures

### Frontend Testing
- [ ] Component testing
  - [ ] Test comment display
  - [ ] Test comment interactions
  - [ ] Test delete functionality
- [ ] User flow testing
  - [ ] Test comment creation flow
  - [ ] Test comment deletion flow
  - [ ] Test error scenarios

## Phase 9: Documentation & Deployment (Week 5)

### Documentation
- [ ] Update API documentation
  - [ ] Document new comment endpoints
  - [ ] Document comment structure changes
  - [ ] Document authorization requirements
- [ ] Update frontend documentation
  - [ ] Document comment component changes
  - [ ] Document new features
  - [ ] Document user interactions

### Deployment
- [ ] Database migration
  - [ ] Add IDs to existing comments
  - [ ] Update comment structure
  - [ ] Validate data integrity
- [ ] Backend deployment
  - [ ] Deploy updated endpoints
  - [ ] Test in staging environment
  - [ ] Monitor for errors
- [ ] Frontend deployment
  - [ ] Deploy updated components
  - [ ] Test user interactions
  - [ ] Monitor performance

## Integration Points

### Existing Components
- [ ] Update `FeedItem.jsx` comment handling
- [ ] Ensure compatibility with `PostsController.java`
- [ ] Maintain consistency with existing like system
- [ ] Update comment counting in feed display

### User Experience
- [ ] Maintain existing comment flow
- [ ] Add new features seamlessly
- [ ] Ensure mobile responsiveness
- [ ] Keep consistent styling

## Success Metrics

### Functionality
- [ ] Comment deletion works for authorized users
- [ ] Comment likes function properly
- [ ] Comment IDs are unique and reliable
- [ ] Authorization prevents unauthorized actions

### Performance
- [ ] Comment operations are fast (< 200ms)
- [ ] No performance regression in feed display
- [ ] Efficient comment loading and pagination
- [ ] Minimal database impact

### Security
- [ ] Only authorized users can delete comments
- [ ] JWT validation works properly
- [ ] No unauthorized access to comment endpoints
- [ ] Proper error handling for security violations

## Dependencies & Requirements

### Backend Dependencies
- [ ] Ensure JWT service supports comment operations
- [ ] MongoDB indexes for efficient comment queries
- [ ] Proper error handling and logging

### Frontend Dependencies
- [ ] Update comment state management
- [ ] Ensure proper error handling
- [ ] Maintain responsive design

## Risk Mitigation

### Data Integrity
- [ ] Backup existing comments before migration
- [ ] Test migration scripts thoroughly
- [ ] Rollback plan if issues arise
- [ ] Validate data after migration

### User Experience
- [ ] Maintain backward compatibility
- [ ] Graceful degradation for errors
- [ ] Clear error messages for users
- [ ] Smooth transition to new features
