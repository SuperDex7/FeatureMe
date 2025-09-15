package Feat.FeatureMe.Entity;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import Feat.FeatureMe.Dto.MostRecentChatDTO;
@Document(collection = "chatRooms")
public class Chats {
    @Id
    private String chatRoomId;
    private String chatName;
    private String chatPhoto;
    
    private List<String> users;
    private List<ChatMessage> messages;
    private MostRecentChatDTO mostRecentChat;



public Chats() { }



    public Chats(String chatRoomId, String chatName, String chatPhoto, List<String> users, List<ChatMessage> messages, MostRecentChatDTO mostRecentChat) {
    this.chatRoomId = chatRoomId;
    this.chatName = chatName;
    this.chatPhoto = chatPhoto;
    this.users = users;
    this.messages = messages;
    this.mostRecentChat = mostRecentChat;
}



    public String getChatRoomId() {
        return chatRoomId;
    }




    public void setChatRoomId(String chatRoomId) {
        this.chatRoomId = chatRoomId;
    }


    public String getChatName() {
            return chatName;
        }



    public void setChatName(String chatName) {
        this.chatName = chatName;
    }

    public String getChatPhoto() {
        return chatPhoto;
    }

    public void setChatPhoto(String chatPhoto) {
        this.chatPhoto = chatPhoto;
    }

    public MostRecentChatDTO getMostRecentChat() {
        return mostRecentChat;
    }




    public void setMostRecentChat(MostRecentChatDTO mostRecentChat) {
        this.mostRecentChat = mostRecentChat;
    }


    public List<String> getUsers() {
        return users;
    }
    public void setUsers(List<String> users) {
        this.users = users;
    }
    public List<ChatMessage> getMessages() {
        return messages;
    }
    public void setMessages(List<ChatMessage> messages) {
        this.messages = messages;
    }
}
