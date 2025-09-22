package Feat.FeatureMe.Controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.web.PagedModel;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import Feat.FeatureMe.Dto.MostRecentChatDTO;
import Feat.FeatureMe.Dto.CreateChatRequest;
import Feat.FeatureMe.Dto.FileUploadResponse;
import Feat.FeatureMe.Entity.ChatMessage;
import Feat.FeatureMe.Entity.Chats;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.ChatService;

import Feat.FeatureMe.Service.UserService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;




@RestController
@RequestMapping("/api/chats")
public class ChatController {
    @Autowired
    private UserService userService;
    @Autowired
    private ChatService chatService;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;


    @PostMapping("/create")
    public Chats createChat(@RequestBody CreateChatRequest req) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new RuntimeException("User not authenticated - please log in again");
            }
            
            String email = authentication.getName(); // This is the email from JWT token
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email + " - account may have been deleted"));
            
            return chatService.createChat(user, req.users(), req.chatname());
        } catch (Exception e) {
            System.err.println("Error creating chat with users " + req.users() + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create chat: " + e.getMessage());
        }
    }

    

    @GetMapping("/{chatRoomId}/messages/paged")
    public java.util.List<ChatMessage> getChatMessagesPaged(@PathVariable String chatRoomId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "15") int size) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new RuntimeException("User not authenticated - please log in again");
            }
            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email + " - account may have been deleted"));

            return chatService.getChatMessagesPaged(chatRoomId, user, page, size);
        } catch (Exception e) {
            System.err.println("Error getting paged chat messages for room " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to retrieve chat messages: " + e.getMessage());
        }
    }

    @GetMapping("/get/chats")
    public PagedModel<MostRecentChatDTO> getChats(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "5") int size) {
    // Get the authenticated user
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
        throw new RuntimeException("User not authenticated - please log in again");
    }
    
    String email = authentication.getName(); // This is the email from JWT token
    User user = userService.findByUsernameOrEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found: " + email + " - account may have been deleted"));
        return chatService.getChats(user, page, size);
    }

    @PostMapping("/{chatRoomId}/users")
    public Chats addUserToChat(@PathVariable String chatRoomId, @RequestParam String username) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new RuntimeException("User not authenticated - please log in again");
            }
            
            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email + " - account may have been deleted"));
            
            return chatService.addUserToChat(chatRoomId, username, user);
        } catch (Exception e) {
            System.err.println("Error adding user to chat " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to add user to chat: " + e.getMessage());
        }
    }

    @DeleteMapping("/{chatRoomId}/users/{username}")
    public Chats removeUserFromChat(@PathVariable String chatRoomId, @PathVariable String username) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new RuntimeException("User not authenticated - please log in again");
            }
            
            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email + " - account may have been deleted"));
            
            return chatService.removeUserFromChat(chatRoomId, username, user);
        } catch (Exception e) {
            System.err.println("Error removing user from chat " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to remove user from chat: " + e.getMessage());
        }
    }

    @PostMapping("/{chatRoomId}/files")
    public FileUploadResponse uploadFile(@PathVariable String chatRoomId, @RequestParam("file") MultipartFile file) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new RuntimeException("User not authenticated - please log in again");
            }
            
            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email + " - account may have been deleted"));
            
            // Upload file and get the response
            FileUploadResponse response = chatService.uploadFileToChat(chatRoomId, file, user);
            
            // Send WebSocket message to notify all users in the chat about the file upload
            ChatMessage fileMessage = chatService.getLastMessageForChat(chatRoomId);
            if (fileMessage != null) {
                // Ensure the message has all required fields for WebSocket
                fileMessage.setChatRoomId(chatRoomId);
                messagingTemplate.convertAndSend("/topic/chat/" + chatRoomId, fileMessage);
            }
            
            return response;
        } catch (Exception e) {
            System.err.println("Error uploading file to chat " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    @PostMapping("/{chatRoomId}/photo")
    public Chats updateChatPhoto(@PathVariable String chatRoomId, @RequestParam("photoUrl") String photoUrl) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new RuntimeException("User not authenticated - please log in again");
            }
            
            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email + " - account may have been deleted"));
            
            return chatService.updateChatPhoto(chatRoomId, photoUrl, user);
        } catch (Exception e) {
            System.err.println("Error updating chat photo for chat " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update chat photo: " + e.getMessage());
        }
    }

    @DeleteMapping("/{chatRoomId}")
    public boolean deleteChat(@PathVariable String chatRoomId) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new RuntimeException("User not authenticated - please log in again");
            }
            
            String email = authentication.getName();
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email + " - account may have been deleted"));
            
            // Check if user is part of this chat before allowing deletion
            if (!chatService.isUserInChat(chatRoomId, user.getUserName())) {
                throw new SecurityException("User " + user.getUserName() + " is not authorized to delete chat room " + chatRoomId);
            }
            
            return chatService.deleteChatRoom(chatRoomId);
        } catch (Exception e) {
            System.err.println("Error deleting chat " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete chat: " + e.getMessage());
        }
    }

    
    
    
@MessageMapping("/chat/{chatRoomId}/add")
@SendTo("/topic/chat/{chatRoomId}")
public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor,@DestinationVariable String chatRoomId){

    // For adding users via WebSocket, we get the adder from the addedBy field
    String addedUserName = chatMessage.getSender();
    String adderUserName = chatMessage.getAddedBy();
    
    if (addedUserName == null || addedUserName.trim().isEmpty()) {
        throw new SecurityException("User to add is required");
    }
    
    if (adderUserName == null || adderUserName.trim().isEmpty()) {
        throw new SecurityException("User doing the adding is required");
    }
    
    // Verify both users exist
    User userToAdd = userService.findByUsernameOrEmail(addedUserName)
        .orElseThrow(() -> new SecurityException("User to add not found: " + addedUserName));
    
    User adderUser = userService.findByUsernameOrEmail(adderUserName)
        .orElseThrow(() -> new SecurityException("User doing the adding not found: " + adderUserName));
    
    // Validate message type
    if (chatMessage.getType().toString().equals("JOIN")) {
        return chatService.joinChat(chatRoomId, addedUserName, adderUserName);
    }
    
    throw new SecurityException("Wrong Message Type: " + chatMessage.getType());
        

}
@MessageMapping("/chat/{chatRoomId}/send")
@SendTo("/topic/chat/{chatRoomId}")
public ChatMessage sendMessage(@Payload ChatMessage chatMessage, @DestinationVariable String chatRoomId, SimpMessageHeaderAccessor headerAccessor){
     
    // For WebSocket connections, we'll validate the sender by checking if the username exists
    // This is a simplified approach - in production you'd want more robust authentication
    String senderUsername = chatMessage.getSender();
    if (senderUsername == null || senderUsername.trim().isEmpty()) {
        throw new SecurityException("Sender username is required");
    }
    
    // Verify the user exists
    User senderUser = userService.findByUsernameOrEmail(senderUsername)
        .orElseThrow(() -> new SecurityException("User not found: " + senderUsername));
    
    // Set the sender in the message to ensure consistency
    chatMessage.setSender(senderUser.getUserName());
    
    return chatService.sendMessage(chatMessage, chatRoomId);

}

@MessageMapping("/chat/{chatRoomId}/leave")
@SendTo("/topic/chat/{chatRoomId}")
public ChatMessage leaveChat(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor,@DestinationVariable String chatRoomId){
    // Validate the sender username
    String senderUsername = chatMessage.getSender();
    if (senderUsername == null || senderUsername.trim().isEmpty()) {
        throw new SecurityException("Sender username is required");
    }
    
    // Verify the user exists
    User senderUser = userService.findByUsernameOrEmail(senderUsername)
        .orElseThrow(() -> new SecurityException("User not found: " + senderUsername));

    // Set user in session
    if (headerAccessor.getSessionAttributes() != null) {
        headerAccessor.getSessionAttributes().put("user", senderUser);
        headerAccessor.getSessionAttributes().put("username", senderUser.getEmail());
    }

    // Validate message type
    if (chatMessage.getType().toString().equals("LEAVE")) {
        return chatService.leaveChat(chatRoomId, senderUser.getUserName(), senderUser.getUserName());
    }

    throw new SecurityException("Wrong Message Type: " + chatMessage.getType());

}
@MessageMapping("/chat.sendPrivateMessage")
public void sendPrivateMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor){

}


}

