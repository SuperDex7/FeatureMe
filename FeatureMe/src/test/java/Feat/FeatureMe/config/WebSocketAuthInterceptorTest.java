package Feat.FeatureMe.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.messaging.Message;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.ChatService;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.UserService;
import jakarta.servlet.http.Cookie;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("WebSocketAuthInterceptor")
class WebSocketAuthInterceptorTest {

    private static final String EMAIL = "artist@example.com";
    private static final String USERNAME = "artist";
    private static final String VALID_JWT = "valid.jwt.token";

    @Mock private JwtService jwtService;
    @Mock private UserService userService;
    @Mock private ChatService chatService;

    private WebSocketAuthInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new WebSocketAuthInterceptor(jwtService, userService, chatService);

        User user = new User();
        user.setUserName(USERNAME);
        user.setRole("USER");
        user.setEmail(EMAIL);
        when(userService.findByUsernameOrEmail(EMAIL)).thenReturn(Optional.of(user));

        when(jwtService.extractUsername(VALID_JWT)).thenReturn(EMAIL);
        when(jwtService.validateToken(VALID_JWT, EMAIL)).thenReturn(true);
        when(jwtService.extractUsername("bad.token")).thenThrow(new RuntimeException("bad signature"));

        when(chatService.isUserInChat(anyString(), anyString())).thenReturn(false);
        when(chatService.isUserInChat("room-1", USERNAME)).thenReturn(true);
    }

    private static StompHeaderAccessor frame(StompCommand command) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setSessionAttributes(new HashMap<>());
        accessor.setLeaveMutable(true);
        return accessor;
    }

    private Message<byte[]> send(StompHeaderAccessor accessor) {
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
        interceptor.preSend(message, null);
        return message;
    }

    private static UsernamePasswordAuthenticationToken loggedIn() {
        return new UsernamePasswordAuthenticationToken(EMAIL, null, List.of(new SimpleGrantedAuthority("USER")));
    }

    /** A frame on a session that already completed CONNECT. */
    private static StompHeaderAccessor connectedFrame(StompCommand command) {
        StompHeaderAccessor accessor = frame(command);
        accessor.setUser(loggedIn());
        accessor.getSessionAttributes().put(WebSocketAuthInterceptor.USERNAME_ATTR, USERNAME);
        return accessor;
    }

    @Nested
    @DisplayName("CONNECT")
    class Connect {

        @Test
        @DisplayName("is rejected with no credentials")
        void rejectsAnonymous() {
            assertThrows(AccessDeniedException.class, () -> send(frame(StompCommand.CONNECT)));
        }

        @Test
        @DisplayName("is rejected for Spring's anonymous principal")
        void rejectsAnonymousToken() {
            StompHeaderAccessor accessor = frame(StompCommand.CONNECT);
            accessor.setUser(new AnonymousAuthenticationToken("k", "anonymousUser",
                List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));

            assertThrows(AccessDeniedException.class, () -> send(accessor));
        }

        @Test
        @DisplayName("accepts a user authenticated at the handshake (web cookie)")
        void acceptsHandshakeUser() {
            StompHeaderAccessor accessor = frame(StompCommand.CONNECT);
            accessor.setUser(loggedIn());

            send(accessor);

            assertEquals(USERNAME, accessor.getSessionAttributes().get(WebSocketAuthInterceptor.USERNAME_ATTR));
        }

        @Test
        @DisplayName("accepts a valid Bearer token in the CONNECT frame (mobile)")
        void acceptsBearerToken() {
            StompHeaderAccessor accessor = frame(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer " + VALID_JWT);

            send(accessor);

            assertEquals(EMAIL, accessor.getUser().getName());
            assertEquals(USERNAME, accessor.getSessionAttributes().get(WebSocketAuthInterceptor.USERNAME_ATTR));
        }

        @Test
        @DisplayName("the token's subject is an email: the user is found by email, not only by username")
        void bearerTokenLooksUpUserByEmail() {
            StompHeaderAccessor accessor = frame(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer " + VALID_JWT);

            send(accessor);

            verify(userService, atLeastOnce()).findByUsernameOrEmail(EMAIL);
            assertEquals(List.of(new SimpleGrantedAuthority("USER")),
                List.copyOf(((UsernamePasswordAuthenticationToken) accessor.getUser()).getAuthorities()));
        }

        @Test
        @DisplayName("rejects a validly signed token for a user that no longer exists")
        void rejectsTokenForDeletedUser() {
            when(jwtService.extractUsername("deleted.jwt")).thenReturn("gone@example.com");
            when(jwtService.validateToken("deleted.jwt", "gone@example.com")).thenReturn(true);
            when(userService.findByUsernameOrEmail("gone@example.com")).thenReturn(Optional.empty());
            StompHeaderAccessor accessor = frame(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer deleted.jwt");

            assertThrows(AccessDeniedException.class, () -> send(accessor));
        }

        @Test
        @DisplayName("rejects an invalid Bearer token")
        void rejectsBadToken() {
            StompHeaderAccessor accessor = frame(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer bad.token");

            assertThrows(AccessDeniedException.class, () -> send(accessor));
        }

        @Test
        @DisplayName("rejects an expired Bearer token")
        void rejectsExpiredToken() {
            when(jwtService.validateToken(VALID_JWT, EMAIL)).thenReturn(false);
            StompHeaderAccessor accessor = frame(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer " + VALID_JWT);

            assertThrows(AccessDeniedException.class, () -> send(accessor));
        }
    }

    @Nested
    @DisplayName("SUBSCRIBE")
    class Subscribe {

        @Test
        @DisplayName("to a chat the user belongs to is allowed")
        void memberCanSubscribe() {
            StompHeaderAccessor accessor = connectedFrame(StompCommand.SUBSCRIBE);
            accessor.setDestination("/topic/chat/room-1");

            assertDoesNotThrow(() -> send(accessor));
        }

        @Test
        @DisplayName("to someone else's chat is rejected")
        void nonMemberCannotSubscribe() {
            StompHeaderAccessor accessor = connectedFrame(StompCommand.SUBSCRIBE);
            accessor.setDestination("/topic/chat/someone-elses-room");

            assertThrows(AccessDeniedException.class, () -> send(accessor));
        }

        @Test
        @DisplayName("to chat deletions is allowed for logged-in users")
        void deletionsTopicAllowed() {
            StompHeaderAccessor accessor = connectedFrame(StompCommand.SUBSCRIBE);
            accessor.setDestination("/topic/chat-deletions");

            assertDoesNotThrow(() -> send(accessor));
        }

        @Test
        @DisplayName("to any other topic is rejected")
        void unknownTopicRejected() {
            StompHeaderAccessor accessor = connectedFrame(StompCommand.SUBSCRIBE);
            accessor.setDestination("/topic/chat/room-1/../../admin");

            assertThrows(AccessDeniedException.class, () -> send(accessor));
        }

        @Test
        @DisplayName("without an authenticated session is rejected")
        void anonymousCannotSubscribe() {
            StompHeaderAccessor accessor = frame(StompCommand.SUBSCRIBE);
            accessor.setDestination("/topic/chat/room-1");

            assertThrows(AccessDeniedException.class, () -> send(accessor));
        }
    }

    @Nested
    @DisplayName("Token expiry")
    class Expiry {

        private final Date past = new Date(System.currentTimeMillis() - 60_000);
        private final Date future = new Date(System.currentTimeMillis() + 3_600_000);

        @Test
        @DisplayName("CONNECT with a Bearer token records when it expires")
        void connectRecordsExpiry() {
            when(jwtService.extractExpiration(VALID_JWT)).thenReturn(future);
            StompHeaderAccessor accessor = frame(StompCommand.CONNECT);
            accessor.setNativeHeader("Authorization", "Bearer " + VALID_JWT);

            send(accessor);

            assertEquals(future, accessor.getSessionAttributes().get(WebSocketAuthInterceptor.EXPIRES_ATTR));
        }

        @Test
        @DisplayName("the handshake records the web cookie token's expiry")
        void handshakeRecordsCookieExpiry() {
            when(jwtService.extractExpiration("cookie.jwt")).thenReturn(future);
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/ws/info");
            request.setCookies(new Cookie("sessionToken", "cookie.jwt"));
            Map<String, Object> attributes = new HashMap<>();

            boolean proceed = interceptor.beforeHandshake(new ServletServerHttpRequest(request),
                new ServletServerHttpResponse(new MockHttpServletResponse()), null, attributes);

            assertTrue(proceed);
            assertEquals(future, attributes.get(WebSocketAuthInterceptor.EXPIRES_ATTR));
        }

        @Test
        @DisplayName("SEND after the token expired is rejected")
        void sendAfterExpiryRejected() {
            StompHeaderAccessor accessor = connectedFrame(StompCommand.SEND);
            accessor.setDestination("/app/chat/room-1/send");
            accessor.getSessionAttributes().put(WebSocketAuthInterceptor.EXPIRES_ATTR, past);

            assertThrows(AccessDeniedException.class, () -> send(accessor));
        }

        @Test
        @DisplayName("SUBSCRIBE after the token expired is rejected")
        void subscribeAfterExpiryRejected() {
            StompHeaderAccessor accessor = connectedFrame(StompCommand.SUBSCRIBE);
            accessor.setDestination("/topic/chat/room-1");
            accessor.getSessionAttributes().put(WebSocketAuthInterceptor.EXPIRES_ATTR, past);

            assertThrows(AccessDeniedException.class, () -> send(accessor));
        }

        @Test
        @DisplayName("frames before expiry are allowed")
        void sendBeforeExpiryAllowed() {
            StompHeaderAccessor accessor = connectedFrame(StompCommand.SEND);
            accessor.setDestination("/app/chat/room-1/send");
            accessor.getSessionAttributes().put(WebSocketAuthInterceptor.EXPIRES_ATTR, future);

            assertDoesNotThrow(() -> send(accessor));
        }
    }

    @Nested
    @DisplayName("SEND")
    class Send {

        @Test
        @DisplayName("without an authenticated session is rejected")
        void anonymousCannotSend() {
            StompHeaderAccessor accessor = frame(StompCommand.SEND);
            accessor.setDestination("/app/chat/room-1/send");

            assertThrows(AccessDeniedException.class, () -> send(accessor));
        }

        @Test
        @DisplayName("from an authenticated session is passed to the handler")
        void authenticatedCanSend() {
            StompHeaderAccessor accessor = connectedFrame(StompCommand.SEND);
            accessor.setDestination("/app/chat/room-1/send");

            assertDoesNotThrow(() -> send(accessor));
        }
    }
}
