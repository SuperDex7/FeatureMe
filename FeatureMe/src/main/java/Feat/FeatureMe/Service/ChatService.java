package Feat.FeatureMe.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PagedModel;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import Feat.FeatureMe.Dto.MostRecentChatDTO;
import Feat.FeatureMe.Dto.NotificationsDTO;
import Feat.FeatureMe.Dto.FileUploadResponse;
import Feat.FeatureMe.Entity.ChatMessage;
import Feat.FeatureMe.Entity.Chats;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.ChatMessageRepository;
import Feat.FeatureMe.Repository.ChatsRepository;
import Feat.FeatureMe.Repository.UserRepository;
import Feat.FeatureMe.Service.ChatService;

import java.io.File;

@Service
public class ChatService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    @Autowired
    private ChatsRepository chatsRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private S3Service s3Service;
    @Autowired
    private FileUploadService fileUploadService;

    /**
     * Validates chat file uploads with role-based restrictions
     * @param file The uploaded file
     * @param user The user uploading the file
     * @throws RuntimeException if validation fails
     */
    private void validateChatFileForUser(MultipartFile file, User user) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        
        // Determine max file size based on user role
        int maxSizeInMB = "USERPLUS".equals(user.getRole()) ? 90 : 15;
        long maxSize = maxSizeInMB * 1024L * 1024L;
        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds " + maxSizeInMB + "MB limit for " + user.getRole() + " users");
        }
        
        // Get allowed file types based on user role
        String[] allowedExtensions;
        if ("USERPLUS".equals(user.getRole())) {
            // USERPLUS: images (png, jpg, jpeg, gif) + audio (mp3, wav)
            allowedExtensions = new String[]{".png", ".jpg", ".jpeg", ".gif", ".mp3", ".wav"};
        } else {
            // USER: images (png, jpg, jpeg) + audio (mp3)
            allowedExtensions = new String[]{".png", ".jpg", ".jpeg", ".mp3"};
        }
        
        // Check file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            boolean isValidType = false;
            
            for (String allowedExt : allowedExtensions) {
                if (fileExtension.equals(allowedExt.toLowerCase())) {
                    isValidType = true;
                    break;
                }
            }
            
            if (!isValidType) {
                String allowedTypesStr = String.join(", ", allowedExtensions);
                throw new RuntimeException("File type not allowed for " + user.getRole() + " users in chat. Allowed types: " + allowedTypesStr);
            }
        } else {
            throw new RuntimeException("File must have a valid extension");
        }
    }
    
    /**
     * Determines the appropriate S3 folder for chat files based on file extension
     * @param fileExtension The file extension (e.g., ".mp3", ".png")
     * @return The appropriate folder path
     */
    private String determineChatFileFolder(String fileExtension) {
        if (fileExtension == null) {
            return "chat-files/misc";
        }
        
        String ext = fileExtension.toLowerCase();
        if (ext.equals(".png") || ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".gif")) {
            return "chat-files/images";
        } else if (ext.equals(".mp3") || ext.equals(".wav")) {
            return "chat-files/audio";
        } else {
            return "chat-files/misc";
        }
    }

    // Add this method to your ChatService class
public User validateJwtAndGetUser(String jwtToken) {
    try {
        // Extract username from token
        String userEmail = jwtService.extractUsername(jwtToken);
        
        if (userEmail != null && !jwtService.isTokenExpired(jwtToken)) {
            // Find user by email
            return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new SecurityException("User not found: " + userEmail));
        }
        throw new SecurityException("Invalid or expired token");
    } catch (Exception e) {
        throw new SecurityException("Token validation failed: " + e.getMessage());
    }
}

    public Chats createChat(User user, List<String> users, String chatName){
        final List<String> oUsers = new ArrayList<>(users);
        users.add(user.getUserName());
       // List<User> group = userRepository.findAllByUsernames(users);
        Chats chat = new Chats(
        null,
        chatName,
        null, // chatPhoto will be null initially
        users,
        new ArrayList<>(),
        null
        );
        Chats newChat = chatsRepository.insert(chat);

        if(user.getChats() ==null){
            user.setChats(new ArrayList<>());
           }
        user.getChats().add(newChat.getChatRoomId());
        userRepository.save(user);
        for(String user2: oUsers){
           User thisUser = userRepository.findByUserName(user2).orElseThrow(() -> new RuntimeException("User not found: " + user2));
           if(thisUser.getChats() ==null){
            thisUser.setChats(new ArrayList<>());
           }
           
            thisUser.getChats().add(newChat.getChatRoomId());
            thisUser.getNotifications().add(new NotificationsDTO(
                newChat.getChatRoomId(), 
                user.getUserName(), 
                "Added you to a chat named " + newChat.getChatName(), 
                LocalDateTime.now(),
                NotificationsDTO.NotiType.CHAT
            ));
            userRepository.save(thisUser);
        }
       // users.getChats().add(newChat.getChatRoomId());

        ChatMessage chatMessage = new ChatMessage(
            null,
            user.getUserName() + " Created this Chat",
            user.getUserName(),
            newChat.getChatRoomId(),
            LocalDateTime.now(),
            ChatMessage.MessageType.CREATE
        );
        chatMessageRepository.save(chatMessage);
        

         newChat.getMessages().add(chatMessage);
         newChat.setMostRecentChat(new MostRecentChatDTO(newChat.getChatRoomId(), newChat.getChatName(), newChat.getChatPhoto(), newChat.getUsers(),chatMessage.getMessage(), LocalDateTime.now()));
        chatsRepository.save(newChat);
        
return newChat;

    }

    public ChatMessage joinChat(String chatRoomId, String addedUserName, String adderUserName){
        try {
            // Find the user being added
            User user = userRepository.findByUserName(addedUserName)
                .orElseThrow(() -> new RuntimeException("User not found: " + addedUserName));
            
            // Find the chat room
            Chats chat = chatsRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + chatRoomId));
            
            // Check if user is already in the chat
            if (chat.getUsers().contains(addedUserName)) {
                throw new RuntimeException("User " + addedUserName + " is already in this chat");
            }
            
            // Add user to chat
            chat.getUsers().add(addedUserName);
            
            // Add chat to user's chat list
            if (user.getChats() == null) {
                user.setChats(new ArrayList<>());
            }
            user.getChats().add(chatRoomId);
            
            // Create join message
            ChatMessage message = new ChatMessage(
                null,
                adderUserName + " added " + addedUserName + " to the chat",
                adderUserName,
                chatRoomId,
                LocalDateTime.now(),
                ChatMessage.MessageType.JOIN
            );
            chat.getMessages().add(message);
            
            // Add notification to the user being added
            if (user.getNotifications() == null) {
                user.setNotifications(new ArrayList<>());
            }
            user.getNotifications().add(new NotificationsDTO(
                chat.getChatRoomId(), 
                adderUserName, 
                "Added you to chat: " + chat.getChatName(), 
                LocalDateTime.now(),
                NotificationsDTO.NotiType.CHAT
            ));
            
            // Update most recent chat
            chat.setMostRecentChat(new MostRecentChatDTO(
                chat.getChatRoomId(), 
                chat.getChatName(), 
                chat.getChatPhoto(),
                chat.getUsers(), 
                message.getMessage(), 
                LocalDateTime.now()
            ));
            
            chatMessageRepository.save(message);
            userRepository.save(user);
            chatsRepository.save(chat);
            
            return message;
        } catch (Exception e) {
            System.err.println("Error adding user " + addedUserName + " to chat " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to add user to chat: " + e.getMessage());
        }
    }
    public ChatMessage sendMessage(ChatMessage chatMessage, String chatRoomId) {
        Chats chatRoom = chatsRepository.findById(chatRoomId).orElse(null);
        if (chatMessage.getType().toString().equals("LEAVE")) {
            
        }
        chatMessage.setChatRoomId(chatRoomId);
        chatMessage.setTime(LocalDateTime.now());
        chatRoom.setMostRecentChat( new MostRecentChatDTO(chatRoom.getChatRoomId(), chatRoom.getChatName(), chatRoom.getChatPhoto(), chatRoom.getUsers(), chatMessage.getMessage(), LocalDateTime.now()));
        chatMessageRepository.save(chatMessage);

        chatRoom.getMessages().add(chatMessage);
        
        chatsRepository.save(chatRoom);
        return chatMessage;

    }

    public ChatMessage leaveChat(String chatRoomId, String addedUserName, String adderUserName){
        User user =userRepository.findByUserName(addedUserName).get();
        Chats chat = chatsRepository.findById(chatRoomId).get();
        user.getChats().remove(chatRoomId);
        if (user.getChats() == null) {
            user.setChats(new ArrayList<>());
        }
        chat.getUsers().remove(addedUserName);
        ChatMessage message = new ChatMessage(
            null,
            addedUserName + " left the chat",
            adderUserName,
            chatRoomId,
            LocalDateTime.now(),
            ChatMessage.MessageType.LEAVE
        );
        chat.getMessages().add(message);
        
        chatMessageRepository.save(message);
        chat.setMostRecentChat( new MostRecentChatDTO(chat.getChatRoomId(), chat.getChatName(), chat.getChatPhoto(), chat.getUsers(), message.getMessage(), LocalDateTime.now()));
       
        userRepository.save(user);
        chatsRepository.save(chat);
        

        return message;
    }

    

    public List<ChatMessage> getChatMessagesPaged(String chatRoomId, User user, int page, int size) {
        try {
            Chats chat = chatsRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + chatRoomId + " - room may have been deleted"));

            if (!chat.getUsers().contains(user.getUserName())) {
                throw new SecurityException("User " + user.getUserName() + " is not authorized to access chat room " + chatRoomId);
            }

            PageRequest pageable = PageRequest.of(page, size);
            List<ChatMessage> pageDesc = chatMessageRepository.findByChatRoomIdOrderByTimeDesc(chatRoomId, pageable);
            java.util.Collections.reverse(pageDesc);
            return pageDesc;
        } catch (Exception e) {
            System.err.println("Error retrieving paged messages for chat room " + chatRoomId + " for user " + user.getUserName() + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to retrieve chat messages: " + e.getMessage());
        }
    }

    public PagedModel<MostRecentChatDTO> getChats(User user, int page, int size) {
        // Get all chat IDs for the user
        List<String> allChatsId = user.getChats();
        
        // Fetch all chats without pagination first to sort them
        List<Chats> allChats = chatsRepository.findAllByChatRoomIdIn(allChatsId);
        
        // Sort chats by most recent message time (newest first)
        allChats.sort((chat1, chat2) -> {
            if (chat1.getMostRecentChat() == null && chat2.getMostRecentChat() == null) {
                return 0;
            }
            if (chat1.getMostRecentChat() == null) {
                return 1; // Put chats without recent messages at the end
            }
            if (chat2.getMostRecentChat() == null) {
                return -1; // Put chats without recent messages at the end
            }
            // Sort by time in descending order (newest first)
            return chat2.getMostRecentChat().time().compareTo(chat1.getMostRecentChat().time());
        });
        
        // Apply pagination manually
        int start = page * size;
        int end = Math.min(start + size, allChats.size());
        
        // Create a sublist for the current page
        List<Chats> pagedChats = allChats.subList(start, end);
        
        // Convert to MostRecentChatDTO
        List<MostRecentChatDTO> mostRecentChats = pagedChats.stream()
            .map(chat -> new MostRecentChatDTO(
                chat.getChatRoomId(), 
                chat.getChatName(), 
                chat.getChatPhoto(),
                chat.getUsers(), 
                chat.getMostRecentChat() != null ? chat.getMostRecentChat().message() : "No messages yet",
                chat.getMostRecentChat() != null ? chat.getMostRecentChat().time() : null
            ))
            .collect(java.util.stream.Collectors.toList());
        
        // Create a custom Page implementation for the sorted results
        Page<MostRecentChatDTO> mostRecentPage = new org.springframework.data.domain.PageImpl<>(
            mostRecentChats, 
            PageRequest.of(page, size), 
            allChats.size()
        );
        
        return new PagedModel<MostRecentChatDTO>(mostRecentPage);
    }

    public Chats addUserToChat(String chatRoomId, String username, User requester) {
        try {
            // Find the chat room
            Chats chat = chatsRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + chatRoomId));
            
            // Check if requester is part of this chat
            if (!chat.getUsers().contains(requester.getUserName())) {
                throw new SecurityException("User " + requester.getUserName() + " is not authorized to add users to chat room " + chatRoomId);
            }
            
            // Find the user to add
            User userToAdd = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
            
            // Check if user is already in the chat
            if (chat.getUsers().contains(username)) {
                throw new RuntimeException("User " + username + " is already in this chat");
            }
            
            // Add user to chat
            chat.getUsers().add(username);
            
            // Add chat to user's chat list
            if (userToAdd.getChats() == null) {
                userToAdd.setChats(new ArrayList<>());
            }
            userToAdd.getChats().add(chatRoomId);
            
            // Add notification to the user being added
            if (userToAdd.getNotifications() == null) {
                userToAdd.setNotifications(new ArrayList<>());
            }
            userToAdd.getNotifications().add(new NotificationsDTO(
                chatRoomId, 
                requester.getUserName(), 
                "Added you to chat: " + chat.getChatName(), 
                LocalDateTime.now(),
                NotificationsDTO.NotiType.CHAT
            ));
            
            // Create join message
            ChatMessage joinMessage = new ChatMessage(
                null,
                requester.getUserName() + " added " + username + " to the chat",
                requester.getUserName(),
                chatRoomId,
                LocalDateTime.now(),
                ChatMessage.MessageType.JOIN
            );
            
            chat.getMessages().add(joinMessage);
            chat.setMostRecentChat(new MostRecentChatDTO(
                chat.getChatRoomId(), 
                chat.getChatName(), 
                chat.getChatPhoto(),
                chat.getUsers(), 
                joinMessage.getMessage(), 
                LocalDateTime.now()
            ));
            
            chatMessageRepository.save(joinMessage);
            userRepository.save(userToAdd);
            chatsRepository.save(chat);
            
            return chat;
        } catch (Exception e) {
            System.err.println("Error adding user " + username + " to chat " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to add user to chat: " + e.getMessage());
        }
    }

    public Chats removeUserFromChat(String chatRoomId, String username, User requester) {
        try {
            // Find the chat room
            Chats chat = chatsRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + chatRoomId));
            
            // Check if requester is part of this chat
            if (!chat.getUsers().contains(requester.getUserName())) {
                throw new SecurityException("User " + requester.getUserName() + " is not authorized to remove users from chat room " + chatRoomId);
            }
            
            // Find the user to remove
            User userToRemove = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
            
            // Check if user is in the chat
            if (!chat.getUsers().contains(username)) {
                throw new RuntimeException("User " + username + " is not in this chat");
            }
            
            // Remove user from chat
            chat.getUsers().remove(username);
            
            // Remove chat from user's chat list
            if (userToRemove.getChats() != null) {
                userToRemove.getChats().remove(chatRoomId);
            }
            
            // Create leave message
            ChatMessage leaveMessage = new ChatMessage(
                null,
                requester.getUserName() + " removed " + username + " from the chat",
                requester.getUserName(),
                chatRoomId,
                LocalDateTime.now(),
                ChatMessage.MessageType.LEAVE
            );
            
            chat.getMessages().add(leaveMessage);
            chat.setMostRecentChat(new MostRecentChatDTO(
                chat.getChatRoomId(), 
                chat.getChatName(), 
                chat.getChatPhoto(),
                chat.getUsers(), 
                leaveMessage.getMessage(), 
                LocalDateTime.now()
            ));
            
            chatMessageRepository.save(leaveMessage);
            userRepository.save(userToRemove);
            chatsRepository.save(chat);
            
            return chat;
        } catch (Exception e) {
            System.err.println("Error removing user " + username + " from chat " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to remove user from chat: " + e.getMessage());
        }
    }

    public Chats updateChatPhoto(String chatRoomId, String photoUrl, User user) {
        try {
            // Find the chat room
            Chats chat = chatsRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + chatRoomId));
            
            // Check if user is part of this chat
            if (!chat.getUsers().contains(user.getUserName())) {
                throw new SecurityException("User " + user.getUserName() + " is not authorized to update chat photo for room " + chatRoomId);
            }
            
            // Update chat photo
            chat.setChatPhoto(photoUrl);
            
            // Create a system message about the photo change with photo URL
            ChatMessage photoChangeMessage = new ChatMessage(
                null,
                user.getUserName() + " changed the chat photo | PHOTO_URL:" + photoUrl,
                user.getUserName(),
                chatRoomId,
                LocalDateTime.now(),
                ChatMessage.MessageType.CHAT
            );
            
            // Add the message to the chat
            chat.getMessages().add(photoChangeMessage);
            chatMessageRepository.save(photoChangeMessage);
            
            // Update most recent chat with new photo and message
            chat.setMostRecentChat(new MostRecentChatDTO(
                chat.getChatRoomId(), 
                chat.getChatName(), 
                photoUrl,
                chat.getUsers(), 
                photoChangeMessage.getMessage(), 
                LocalDateTime.now()
            ));
            
            chatsRepository.save(chat);
            return chat;
            
        } catch (Exception e) {
            System.err.println("Error updating chat photo for chat " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update chat photo: " + e.getMessage());
        }
    }

    public FileUploadResponse uploadFileToChat(String chatRoomId, MultipartFile file, User user) {
        try {
            // Find the chat room
            Chats chat = chatsRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + chatRoomId));
            
            // Check if user is part of this chat
            if (!chat.getUsers().contains(user.getUserName())) {
                throw new SecurityException("User " + user.getUserName() + " is not authorized to upload files to chat room " + chatRoomId);
            }
            
            // Validate file with role-based size limits and file types
            validateChatFileForUser(file, user);
            
            // Generate unique filename with folder organization
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
            
            // Determine folder based on file type
            String folder = determineChatFileFolder(fileExtension);
            String uniqueFilename = fileUploadService.generateUniqueFilenameWithFolder(file, folder);
            
            // Upload file to S3
            File tempFile = File.createTempFile("temp", null);
            file.transferTo(tempFile);
            String fileUrl = s3Service.uploadFile(uniqueFilename, tempFile.getAbsolutePath());
            
            // Clean up temp file
            tempFile.delete();
            
            // Create file message
            ChatMessage fileMessage = new ChatMessage(
                null,
                user.getUserName() + " sent a file: " + originalFilename,
                user.getUserName(),
                chatRoomId,
                LocalDateTime.now(),
                ChatMessage.MessageType.FILE
            );
            
            // Add file metadata to message (you might want to extend ChatMessage for this)
            // For now, we'll store it in the message text
            fileMessage.setMessage(user.getUserName() + " sent a file: " + originalFilename + 
                " | FILE_URL:" + fileUrl + " | FILE_SIZE:" + file.getSize());
            
            chat.getMessages().add(fileMessage);
            chat.setMostRecentChat(new MostRecentChatDTO(
                chat.getChatRoomId(), 
                chat.getChatName(), 
                chat.getChatPhoto(),
                chat.getUsers(), 
                fileMessage.getMessage(), 
                LocalDateTime.now()
            ));
            
            chatMessageRepository.save(fileMessage);
            chatsRepository.save(chat);
            
            return new FileUploadResponse(
                fileUrl,
                originalFilename,
                file.getSize(),
                file.getContentType()
            );
            
        } catch (Exception e) {
            System.err.println("Error uploading file to chat " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }
    
    /**
     * Get the last message for a chat room (useful for WebSocket notifications)
     */
    public ChatMessage getLastMessageForChat(String chatRoomId) {
        try {
            Chats chat = chatsRepository.findById(chatRoomId).orElse(null);
            if (chat != null && !chat.getMessages().isEmpty()) {
                // Return the last message in the chat
                return chat.getMessages().get(chat.getMessages().size() - 1);
            }
            return null;
        } catch (Exception e) {
            System.err.println("Error getting last message for chat " + chatRoomId + ": " + e.getMessage());
            return null;
        }
    }
    
}
