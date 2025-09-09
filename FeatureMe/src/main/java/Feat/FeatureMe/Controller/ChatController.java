package Feat.FeatureMe.Controller;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;

import Feat.FeatureMe.Entity.ChatMessage;
import Feat.FeatureMe.Repository.ChatMessageRepository;
import Feat.FeatureMe.Repository.UserRepository;
import Feat.FeatureMe.Service.UserService;

@Controller
public class ChatController {
    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ChatMessageRepository chatMessageRepository;

    
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
public ChatMessage addUser(@Payload ChatMessage chatMessage,
SimpMessageHeaderAccessor headerAccessor){
    if (userRepository.existsByEmail(chatMessage.getSender())) {
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        chatMessage.setTime(LocalDateTime.now());
        if (chatMessage.getMessage()==null) {
            chatMessage.setMessage("");

        }
        return chatMessageRepository.save(chatMessage);


    }
    return null;

}
@MessageMapping("/chat.sendMessage")
@SendTo("/topic/public")
public ChatMessage sendMessage(@Payload ChatMessage chatMessage){

}
@MessageMapping("/chat.sendPrivateMessage")
public void sendPrivateMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor){

}

}
