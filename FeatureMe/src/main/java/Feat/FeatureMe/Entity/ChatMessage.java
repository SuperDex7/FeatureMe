package Feat.FeatureMe.Entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.format.annotation.DateTimeFormat;

@Document(collection = "chat_messages")
public class ChatMessage {
    @Id
   private String id;
    private String message;
   private String sender;
   private String chatRoomId;

   @DateTimeFormat
   private LocalDateTime time;

    private MessageType type;

   public enum MessageType{
    CHAT, PRIVATE_MESSAGE, JOIN, LEAVE, TYPING, CREATE
   }

   public ChatMessage() { }

   public ChatMessage(String id, String message, String sender, String chatRoomId, LocalDateTime time, MessageType type) {
    this.id = id;
    this.message = message;
    this.sender = sender;
    this.chatRoomId = chatRoomId;
    this.time = time;
    this.type = type;
}

   public String getId() {
    return id;
}

   public void setId(String id) {
    this.id = id;
   }

   public String getMessage() {
    return message;
   }

   public void setMessage(String message) {
    this.message = message;
   }

   public String getSender() {
    return sender;
   }

   public void setSender(String sender) {
    this.sender = sender;
   }


   public LocalDateTime getTime() {
    return time;
   }

   public void setTime(LocalDateTime time) {
    this.time = time;
   }

   public MessageType getType() {
    return type;
   }

   public void setType(MessageType type) {
    this.type = type;
   }

   public String getChatRoomId() {
    return chatRoomId;
   }

   public void setChatRoomId(String chatRoomId) {
    this.chatRoomId = chatRoomId;
   }

   
}
