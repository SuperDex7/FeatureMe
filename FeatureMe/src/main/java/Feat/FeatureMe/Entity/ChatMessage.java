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
   private String recipiant;
   private String color;


   @DateTimeFormat
   private LocalDateTime time;

    private MessageType type;

   public enum MessageType{
    CHAT, PRIVATE_MESSAGE, JOIN, LEAVE, TYPING
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

   public String getRecipiant() {
    return recipiant;
   }

   public void setRecipiant(String recipiant) {
    this.recipiant = recipiant;
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

   
}
