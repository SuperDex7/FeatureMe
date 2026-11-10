package Feat.FeatureMe.Controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.Principal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import Feat.FeatureMe.Entity.ChatMessage;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.ChatService;
import Feat.FeatureMe.Service.UserService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ChatController STOMP handlers")
class ChatControllerWebSocketTest {

    private static final String ROOM = "room-1";

    @Mock private UserService userService;
    @Mock private ChatService chatService;

    @InjectMocks
    private ChatController chatController;

    private final Principal alice = () -> "alice@example.com";
    private final Principal mallory = () -> "mallory@example.com";

    private static User user(String userName, String email) {
        User user = new User();
        user.setUserName(userName);
        user.setEmail(email);
        return user;
    }

    private static ChatMessage message(String sender, ChatMessage.MessageType type) {
        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setMessage("hello");
        message.setType(type);
        return message;
    }

    @BeforeEach
    void setUp() {
        when(userService.findByUsernameOrEmail("alice@example.com")).thenReturn(Optional.of(user("alice", "alice@example.com")));
        when(userService.findByUsernameOrEmail("mallory@example.com")).thenReturn(Optional.of(user("mallory", "mallory@example.com")));
        when(userService.findByUsernameOrEmail("bob")).thenReturn(Optional.of(user("bob", "bob@example.com")));
        when(chatService.isUserInChat(anyString(), anyString())).thenReturn(false);
        when(chatService.isUserInChat(ROOM, "alice")).thenReturn(true);
        when(chatService.sendMessage(any(), anyString())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("send: the sender comes from the session, not the message body")
    void senderCannotBeSpoofed() {
        chatController.sendMessage(message("bob", ChatMessage.MessageType.CHAT), ROOM, alice);

        ArgumentCaptor<ChatMessage> sent = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatService).sendMessage(sent.capture(), eq(ROOM));
        assertEquals("alice", sent.getValue().getSender());
    }

    @Test
    @DisplayName("send: a spoofed JOIN/LEAVE type is downgraded to a normal chat message")
    void typeIsForcedToChat() {
        chatController.sendMessage(message("alice", ChatMessage.MessageType.LEAVE), ROOM, alice);

        ArgumentCaptor<ChatMessage> sent = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatService).sendMessage(sent.capture(), eq(ROOM));
        assertEquals(ChatMessage.MessageType.CHAT, sent.getValue().getType());
    }

    @Test
    @DisplayName("send: non-members can't post into a chat")
    void nonMemberCannotSend() {
        assertThrows(SecurityException.class,
            () -> chatController.sendMessage(message("mallory", ChatMessage.MessageType.CHAT), ROOM, mallory));
        verify(chatService, never()).sendMessage(any(), anyString());
    }

    @Test
    @DisplayName("send: no session principal is rejected")
    void noPrincipalRejected() {
        assertThrows(SecurityException.class,
            () -> chatController.sendMessage(message("alice", ChatMessage.MessageType.CHAT), ROOM, null));
    }

    @Test
    @DisplayName("add: the adder is the session user and must be in the chat")
    void adderMustBeMember() {
        chatController.addUser(message("bob", ChatMessage.MessageType.JOIN), ROOM, alice);
        verify(chatService).joinChat(ROOM, "bob", "alice");

        assertThrows(SecurityException.class,
            () -> chatController.addUser(message("bob", ChatMessage.MessageType.JOIN), ROOM, mallory));
        verify(chatService, never()).joinChat(ROOM, "bob", "mallory");
    }

    @Test
    @DisplayName("leave: only removes the session user, whatever the body says")
    void leaveRemovesSessionUser() {
        chatController.leaveChat(message("bob", ChatMessage.MessageType.LEAVE), ROOM, alice);

        verify(chatService).leaveChat(ROOM, "alice", "alice");
        verify(chatService, never()).leaveChat(eq(ROOM), eq("bob"), anyString());
    }
}
