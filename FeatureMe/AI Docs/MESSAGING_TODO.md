# Messaging System Implementation Todo

## Phase 1: Backend Infrastructure (Week 1-2)

### Database & Entities
- [ ] Create `Message.java` entity
  - [ ] Fields: id, senderId, receiverId, content, timestamp, isRead, messageType
  - [ ] Add MongoDB annotations and indexes
  - [ ] Create constructors, getters, setters
- [ ] Create `Conversation.java` entity
  - [ ] Fields: id, participants[], lastMessage, lastMessageTime, unreadCount
  - [ ] Add MongoDB annotations and indexes
  - [ ] Create constructors, getters, setters
- [ ] Create `MessageAttachment.java` entity (optional)
  - [ ] For handling audio files, images, etc.

### Repository Layer
- [ ] Create `MessageRepository.java`
  - [ ] CRUD operations for messages
  - [ ] Find by conversation ID
  - [ ] Find unread messages by user
- [ ] Create `ConversationRepository.java`
  - [ ] CRUD operations for conversations
  - [ ] Find conversations by participant
  - [ ] Find conversation between two users

### Service Layer
- [ ] Create `MessageService.java`
  - [ ] Send message logic
  - [ ] Mark messages as read
  - [ ] Delete message logic
  - [ ] Get conversation messages
- [ ] Create `ConversationService.java`
  - [ ] Start new conversation
  - [ ] Get user conversations
  - [ ] Update conversation metadata
- [ ] Integrate with existing `UserService.java`

## Phase 2: Backend API Endpoints (Week 2-3)

### Message Controller
- [ ] Create `MessageController.java`
  - [ ] `POST /api/messages/send` - Send message
  - [ ] `GET /api/messages/conversation/{conversationId}` - Get conversation messages
  - [ ] `GET /api/messages/unread/{userId}` - Get unread messages
  - [ ] `PATCH /api/messages/read/{conversationId}` - Mark messages as read
  - [ ] `DELETE /api/messages/{messageId}` - Delete message

### Conversation Controller
- [ ] Create `ConversationController.java`
  - [ ] `POST /api/conversations/start` - Start new conversation
  - [ ] `GET /api/conversations/user/{userId}` - Get user conversations
  - [ ] `GET /api/conversations/{conversationId}` - Get conversation details
  - [ ] `PATCH /api/conversations/{conversationId}` - Update conversation
  - [ ] `DELETE /api/conversations/{conversationId}` - Delete conversation

### Integration
- [ ] Add messaging endpoints to existing security configuration
- [ ] Update JWT authentication for messaging routes
- [ ] Add validation for message/conversation requests

## Phase 3: Real-time Communication (Week 3-4)

### WebSocket Setup
- [ ] Add WebSocket dependencies to `pom.xml`
  - [ ] `spring-boot-starter-websocket`
  - [ ] `spring-boot-starter-reactor-netty` (optional)
- [ ] Create WebSocket configuration class
- [ ] Configure WebSocket endpoints

### WebSocket Service
- [ ] Create `WebSocketService.java`
  - [ ] Handle user connections/disconnections
  - [ ] Broadcast messages to conversation participants
  - [ ] Handle typing indicators
  - [ ] Manage user online/offline status
- [ ] Create WebSocket message handlers
- [ ] Implement connection management

### Real-time Features
- [ ] Message broadcasting
- [ ] Typing indicators
- [ ] Online/offline status
- [ ] Message delivery receipts

## Phase 4: Frontend Components (Week 4-6)

### Core Messaging Components
- [ ] Create `MessageList.jsx`
  - [ ] Display conversation messages
  - [ ] Handle message scrolling
  - [ ] Show message timestamps
- [ ] Create `MessageInput.jsx`
  - [ ] Text input for new messages
  - [ ] Audio recording capability
  - [ ] File upload integration
- [ ] Create `ConversationList.jsx`
  - [ ] List of user conversations
  - [ ] Show last message preview
  - [ ] Unread message indicators
- [ ] Create `ConversationItem.jsx`
  - [ ] Individual conversation preview
  - [ ] User avatar and name
  - [ ] Last message and time

### Message Display Components
- [ ] Create `MessageBubble.jsx`
  - [ ] Individual message display
  - [ ] Different styles for sent/received
  - [ ] Message status indicators
- [ ] Create `MessageAttachment.jsx`
  - [ ] Handle audio file playback
  - [ ] Image display
  - [ ] File download links

### Integration Components
- [ ] Create `MessagingPage.jsx`
  - [ ] Main messaging interface
  - [ ] Conversation list + message view
  - [ ] Responsive layout
- [ ] Create `MessagingModal.jsx`
  - [ ] Quick messaging popup
  - [ ] Start new conversation
  - [ ] Quick reply functionality

## Phase 5: Advanced Features (Week 6-8)

### Audio/File Messaging
- [ ] Extend `AudioPlayer.jsx` for message audio
- [ ] Integrate with existing S3 service for file uploads
- [ ] Audio recording capabilities
- [ ] File type validation and preview

### Collaboration Features
- [ ] Project invitation messaging
- [ ] File sharing in conversations
- [ ] Voice notes for feedback
- [ ] Collaboration request templates

### Smart Features
- [ ] Auto-suggestions based on user's music
- [ ] Collaboration matching suggestions
- [ ] Message templates for common requests
- [ ] Smart reply suggestions

## Phase 6: UI/UX & Polish (Week 8-9)

### Design System
- [ ] Create messaging-specific CSS
- [ ] Ensure consistency with existing `App.css`
- [ ] Mobile-responsive design
- [ ] Dark/light theme support

### User Experience
- [ ] Unread message indicators
- [ ] Typing indicators
- [ ] Message status (sent, delivered, read)
- [ ] Search functionality
- [ ] Message reactions (like, heart, etc.)

### Performance
- [ ] Message pagination
- [ ] Lazy loading for conversations
- [ ] Optimize WebSocket connections
- [ ] Message caching

## Phase 7: Testing & Deployment (Week 9-10)

### Testing
- [ ] Unit tests for backend services
- [ ] Integration tests for API endpoints
- [ ] Frontend component testing
- [ ] WebSocket connection testing
- [ ] End-to-end messaging flow testing

### Performance & Security
- [ ] Message encryption for sensitive content
- [ ] Rate limiting for message sending
- [ ] Message retention policies
- [ ] Load testing for concurrent users
- [ ] Security audit of messaging endpoints

### Documentation
- [ ] API documentation for messaging endpoints
- [ ] Frontend component documentation
- [ ] WebSocket message format documentation
- [ ] User guide for messaging features

## Integration Points

### Header Integration
- [ ] Add messaging icon to `Header.jsx`
- [ ] Show unread message count
- [ ] Link to messaging page
- [ ] Quick messaging dropdown

### Profile Integration
- [ ] Add "Message" button to user profiles
- [ ] Start conversation from profile page
- [ ] Show messaging history in profile

### Feed Integration
- [ ] Add messaging buttons to `FeedItem.jsx`
- [ ] Quick collaboration requests
- [ ] Message artists about their posts

## Dependencies & Setup

### Backend Dependencies
- [ ] Add WebSocket starter to `pom.xml`
- [ ] Update MongoDB configuration if needed
- [ ] Ensure JWT service supports messaging

### Frontend Dependencies
- [ ] Add WebSocket client library
- [ ] Audio recording library (if not built-in)
- [ ] File upload handling

## Success Metrics

### Functionality
- [ ] Users can send/receive text messages
- [ ] Real-time message delivery
- [ ] File and audio sharing works
- [ ] Conversation management functions

### Performance
- [ ] Message delivery < 100ms
- [ ] Support 100+ concurrent users
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### User Experience
- [ ] Intuitive messaging interface
- [ ] Quick conversation start
- [ ] Easy file sharing
- [ ] Clear message status indicators
