package Feat.FeatureMe.Integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.lang.reflect.Type;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.http.HttpMessageConvertersAutoConfiguration;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.DispatcherServletAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.ServletWebServerFactoryAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration;
import org.springframework.boot.autoconfigure.websocket.servlet.WebSocketServletAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import com.fasterxml.jackson.databind.ObjectMapper;

import Feat.FeatureMe.Controller.ChatController;
import Feat.FeatureMe.Entity.ChatMessage;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.ChatService;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.UserService;
import Feat.FeatureMe.config.WebSocketAuthInterceptor;
import Feat.FeatureMe.config.WebSocketConfig;

/**
 * Starts the real WebSocket/STOMP stack on a random port and connects over SockJS the
 * way the mobile app does (JWT in the STOMP CONNECT frame). Services are mocked, so no
 * database is needed.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    classes = WebSocketAuthIntegrationTest.TestApp.class)
@DisplayName("WebSocket authentication (end to end)")
class WebSocketAuthIntegrationTest {

    @SpringBootConfiguration
    @ImportAutoConfiguration({
        ServletWebServerFactoryAutoConfiguration.class,
        DispatcherServletAutoConfiguration.class,
        WebMvcAutoConfiguration.class,
        HttpMessageConvertersAutoConfiguration.class,
        JacksonAutoConfiguration.class,
        WebSocketServletAutoConfiguration.class,
    })
    @Import({ WebSocketConfig.class, WebSocketAuthInterceptor.class, ChatController.class })
    static class TestApp { }

    private static final String TOKEN = "alice.jwt";
    private static final String ROOM = "room-1";

    @LocalServerPort private int port;

    @MockitoBean private JwtService jwtService;
    @MockitoBean private CachedUserDetailsService userDetailsService;
    @MockitoBean private UserService userService;
    @MockitoBean private ChatService chatService;

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        User alice = new User();
        alice.setUserName("alice");
        alice.setEmail("alice@example.com");
        when(userService.findByUsernameOrEmail("alice@example.com")).thenReturn(Optional.of(alice));

        when(jwtService.extractUsername(TOKEN)).thenReturn("alice@example.com");
        when(jwtService.validateToken(TOKEN, "alice@example.com")).thenReturn(true);
        when(userDetailsService.loadUserByUsername("alice@example.com")).thenReturn(
            org.springframework.security.core.userdetails.User.withUsername("alice@example.com")
                .password("").authorities("USER").build());

        when(chatService.isUserInChat(anyString(), anyString())).thenReturn(false);
        when(chatService.isUserInChat(ROOM, "alice")).thenReturn(true);
        when(chatService.sendMessage(any(), anyString())).thenAnswer(inv -> inv.getArgument(0));

        stompClient = new WebSocketStompClient(
            new SockJsClient(List.of(new WebSocketTransport(new StandardWebSocketClient()))));
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(new ObjectMapper().findAndRegisterModules());
        stompClient.setMessageConverter(converter);
    }

    @AfterEach
    void tearDown() {
        stompClient.stop();
    }

    private CompletableFuture<StompSession> connect(String bearerToken) {
        StompHeaders connectHeaders = new StompHeaders();
        if (bearerToken != null) {
            connectHeaders.add("Authorization", "Bearer " + bearerToken);
        }
        return stompClient.connectAsync("http://localhost:" + port + "/ws",
            new WebSocketHttpHeaders(), connectHeaders, new StompSessionHandlerAdapter() { });
    }

    private static void awaitDisconnect(StompSession session) throws InterruptedException {
        long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
        while (session.isConnected() && System.nanoTime() < deadline) {
            Thread.sleep(50);
        }
    }

    @Test
    @DisplayName("connecting without a token is refused")
    void connectWithoutTokenRefused() {
        assertThrows(ExecutionException.class, () -> connect(null).get(5, TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("connecting with an invalid token is refused")
    void connectWithBadTokenRefused() {
        when(jwtService.extractUsername("forged")).thenThrow(new RuntimeException("bad signature"));
        assertThrows(ExecutionException.class, () -> connect("forged").get(5, TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("a member can chat, and the sender is taken from the token, not the message")
    void memberChatsAsThemselves() throws Exception {
        StompSession session = connect(TOKEN).get(5, TimeUnit.SECONDS);

        BlockingQueue<ChatMessage> received = new LinkedBlockingQueue<>();
        session.subscribe("/topic/chat/" + ROOM, new StompFrameHandler() {
            @Override public Type getPayloadType(StompHeaders headers) { return ChatMessage.class; }
            @Override public void handleFrame(StompHeaders headers, Object payload) { received.add((ChatMessage) payload); }
        });
        Thread.sleep(200); // let the subscription register before sending

        ChatMessage spoofed = new ChatMessage();
        spoofed.setSender("bob");
        spoofed.setMessage("hi");
        spoofed.setType(ChatMessage.MessageType.CHAT);
        session.send("/app/chat/" + ROOM + "/send", spoofed);

        ChatMessage echoed = received.poll(5, TimeUnit.SECONDS);
        assertEquals("hi", echoed.getMessage());
        assertEquals("alice", echoed.getSender());
    }

    @Test
    @DisplayName("subscribing to someone else's chat closes the session")
    void subscribeToOtherChatRejected() throws Exception {
        StompSession session = connect(TOKEN).get(5, TimeUnit.SECONDS);
        assertTrue(session.isConnected());

        session.subscribe("/topic/chat/someone-elses-room", new StompSessionHandlerAdapter() { });

        awaitDisconnect(session);
        assertTrue(!session.isConnected(), "server should reject the SUBSCRIBE and close the session");
    }
}
