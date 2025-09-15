package Feat.FeatureMe.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import Feat.FeatureMe.Entity.ChatMessage;
import Feat.FeatureMe.Entity.Chats;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.ChatService;

import Feat.FeatureMe.Service.UserService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;


@RestController
@RequestMapping("/api/chats")
public class ChatController {
    @Autowired
    private UserService userService;
    @Autowired
    private ChatService chatService;


    @PostMapping("/create")
    public Chats createChat(@RequestBody List<String> users) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new RuntimeException("User not authenticated - please log in again");
            }
            
            String email = authentication.getName(); // This is the email from JWT token
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email + " - account may have been deleted"));
            
            return chatService.createChat(user, users);
        } catch (Exception e) {
            System.err.println("Error creating chat with users " + users + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create chat: " + e.getMessage());
        }
    }

    @GetMapping("/{chatRoomId}/messages")
    public Chats getChatMessages(@PathVariable String chatRoomId) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new RuntimeException("User not authenticated - please log in again");
            }
            
            String email = authentication.getName(); // This is the email from JWT token
            User user = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email + " - account may have been deleted"));
            
            return chatService.getChatMessages(chatRoomId, user);
        } catch (Exception e) {
            System.err.println("Error getting chat messages for room " + chatRoomId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to retrieve chat messages: " + e.getMessage());
        }
    }
    
    
@MessageMapping("/chat/{chatRoomId}/add")
@SendTo("/topic/chat/{chatRoomId}")
public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor,@DestinationVariable String chatRoomId){

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
    if (chatMessage.getType().toString().equals("JOIN")) {
        return chatService.joinChat(chatRoomId, senderUser.getUserName(), senderUser.getUserName());
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

