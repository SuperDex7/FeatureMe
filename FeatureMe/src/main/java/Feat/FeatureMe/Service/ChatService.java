package Feat.FeatureMe.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import Feat.FeatureMe.Dto.MostRecentChatDTO;
import Feat.FeatureMe.Entity.ChatMessage;
import Feat.FeatureMe.Entity.Chats;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.ChatMessageRepository;
import Feat.FeatureMe.Repository.ChatsRepository;
import Feat.FeatureMe.Repository.UserRepository;
import Feat.FeatureMe.Service.ChatService;

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

    public Chats createChat( User user, List<String> users){
        users.add(user.getUserName());
       // List<User> group = userRepository.findAllByUsernames(users);
        Chats chat = new Chats(
        null,
        users,
        new ArrayList<>(),
        null
        );
        Chats newChat = chatsRepository.insert(chat);
        for(String user2: users){
           User thisUser = userRepository.findByUserName(user2).orElseThrow(() -> new RuntimeException("User not found: " + user2));;
            thisUser.getChats().add(newChat.getChatRoomId());
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
        chatsRepository.save(newChat);
        
return newChat;

    }

    public ChatMessage joinChat(String chatRoomId, String addedUserName, String adderUserName){
        User user =userRepository.findByUserName(addedUserName).get();
        Chats chat = chatsRepository.findById(chatRoomId).get();
        user.getChats().add(chatRoomId);
        chat.getUsers().add(addedUserName);
        ChatMessage message = new ChatMessage(
            null,
            adderUserName + " added " + addedUserName + " to the chat",
            adderUserName,
            chatRoomId,
            LocalDateTime.now(),
            ChatMessage.MessageType.JOIN
        );
        chat.getMessages().add(message);
        
        chatMessageRepository.save(message);

        userRepository.save(user);
        
        chatsRepository.save(chat);
        

        return message;
    }
    public ChatMessage sendMessage(ChatMessage chatMessage, String chatRoomId) {
        Chats chatRoom = chatsRepository.findById(chatRoomId).orElse(null);
        if (chatMessage.getType().toString().equals("LEAVE")) {
            
        }
        chatMessage.setChatRoomId(chatRoomId);
        chatMessage.setTime(LocalDateTime.now());
        chatRoom.setMostRecentChat( new MostRecentChatDTO(chatMessage.getMessage(), LocalDateTime.now()));
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

       
        userRepository.save(user);
        chatsRepository.save(chat);
        

        return message;
    }

    public Chats getChatMessages(String chatRoomId, User user) {
        try {
            // Find the chat room
            Chats chat = chatsRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found: " + chatRoomId + " - room may have been deleted"));
            
            // Check if user is part of this chat
            if (!chat.getUsers().contains(user.getUserName())) {
                throw new SecurityException("User " + user.getUserName() + " is not authorized to access chat room " + chatRoomId);
            }
            
            return chat;
        } catch (Exception e) {
            System.err.println("Error retrieving messages for chat room " + chatRoomId + " for user " + user.getUserName() + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to retrieve chat messages: " + e.getMessage());
        }
    }
    
}
