package Feat.FeatureMe.config;

import java.security.Principal;
import java.util.Date;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.ChatService;
import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.UserService;
import jakarta.servlet.http.Cookie;

/**
 * Authenticates STOMP sessions and authorizes chat subscriptions.
 *
 * CONNECT: the user comes from either
 *   - the HTTP handshake (web: the HttpOnly sessionToken cookie is checked by the JWT filter), or
 *   - an "Authorization: Bearer <jwt>" header on the STOMP CONNECT frame (mobile, which can't
 *     set HTTP headers through SockJS).
 *   Connections with neither are rejected.
 *
 * SUBSCRIBE: /topic/chat/{chatRoomId} is only allowed for members of that chat.
 *
 * SEND: requires an authenticated session; the handlers in ChatController enforce membership.
 */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor, HandshakeInterceptor {

    static final String USERNAME_ATTR = "ws.userName";
    /** java.util.Date when the token that authenticated this session expires. */
    static final String EXPIRES_ATTR = "ws.tokenExpires";

    private static final Pattern CHAT_TOPIC = Pattern.compile("^/topic/chat/([^/]+)$");
    private static final String CHAT_DELETIONS_TOPIC = "/topic/chat-deletions";

    private final JwtService jwtService;
    private final CachedUserDetailsService userDetailsService;
    private final UserService userService;
    private final ChatService chatService;

    public WebSocketAuthInterceptor(JwtService jwtService,
                                    CachedUserDetailsService userDetailsService,
                                    UserService userService,
                                    ChatService chatService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userService = userService;
        this.chatService = chatService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message; // heartbeats and non-STOMP frames
        }

        StompCommand command = accessor.getCommand();
        if (command == StompCommand.CONNECT) {
            authenticate(accessor);
        } else if (command == StompCommand.SUBSCRIBE) {
            requireUnexpired(accessor);
            authorizeSubscribe(accessor);
        } else if (command == StompCommand.SEND) {
            requireUnexpired(accessor);
            requireUser(accessor);
        }
        return message;
    }

    // ---- Handshake: remember when the web client's cookie token expires ----

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            Cookie[] cookies = servletRequest.getServletRequest().getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("sessionToken".equals(cookie.getName())) {
                        try {
                            Date expiry = jwtService.extractExpiration(cookie.getValue());
                            if (expiry != null) {
                                attributes.put(EXPIRES_ATTR, expiry);
                            }
                        } catch (Exception e) {
                            // Invalid cookie: the JWT filter already rejects these; CONNECT will fail without a user
                        }
                        break;
                    }
                }
            }
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) { }

    /**
     * A STOMP session outlives the token that opened it. Once that token expires, reject
     * further frames; the server then closes the session and the client must reconnect
     * with a valid token.
     */
    private void requireUnexpired(StompHeaderAccessor accessor) {
        Map<String, Object> attrs = accessor.getSessionAttributes();
        Object expires = attrs != null ? attrs.get(EXPIRES_ATTR) : null;
        if (expires instanceof Date expiry && expiry.before(new Date())) {
            throw new AccessDeniedException("Session token expired");
        }
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            accessor.setUser(authenticateToken(jwt));
            // Session attribute maps are ConcurrentHashMaps on a live server: no null values
            Date expiry = jwtService.extractExpiration(jwt);
            Map<String, Object> attrs = accessor.getSessionAttributes();
            if (attrs != null && expiry != null) {
                attrs.put(EXPIRES_ATTR, expiry);
            }
        }

        Principal user = accessor.getUser();
        if (!isLoggedIn(user)) {
            throw new AccessDeniedException("WebSocket connection requires authentication");
        }

        // Cache the username (chat membership is stored by username, the JWT carries the email)
        String userName = userService.findByUsernameOrEmail(user.getName())
            .orElseThrow(() -> new AccessDeniedException("User not found"))
            .getUserName();
        Map<String, Object> attrs = accessor.getSessionAttributes();
        if (attrs != null) {
            attrs.put(USERNAME_ATTR, userName);
        }
    }

    private Authentication authenticateToken(String jwt) {
        try {
            String subject = jwtService.extractUsername(jwt);
            UserDetails details = userDetailsService.loadUserByUsername(subject);
            if (!jwtService.validateToken(jwt, details.getUsername())) {
                throw new AccessDeniedException("Invalid or expired token");
            }
            return new UsernamePasswordAuthenticationToken(details.getUsername(), null, details.getAuthorities());
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            throw new AccessDeniedException("Invalid or expired token");
        }
    }

    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        String userName = requireUser(accessor);
        String destination = accessor.getDestination();
        if (destination == null) {
            throw new AccessDeniedException("Subscription destination required");
        }

        if (CHAT_DELETIONS_TOPIC.equals(destination)) {
            return;
        }

        Matcher chat = CHAT_TOPIC.matcher(destination);
        if (chat.matches() && chatService.isUserInChat(chat.group(1), userName)) {
            return;
        }

        throw new AccessDeniedException("Not allowed to subscribe to " + destination);
    }

    /** Returns the session's username, or rejects the frame if the session isn't authenticated. */
    private String requireUser(StompHeaderAccessor accessor) {
        if (!isLoggedIn(accessor.getUser())) {
            throw new AccessDeniedException("Not authenticated");
        }
        Map<String, Object> attrs = accessor.getSessionAttributes();
        Object userName = attrs != null ? attrs.get(USERNAME_ATTR) : null;
        if (userName instanceof String name) {
            return name;
        }
        return userService.findByUsernameOrEmail(accessor.getUser().getName())
            .orElseThrow(() -> new AccessDeniedException("User not found"))
            .getUserName();
    }

    private static boolean isLoggedIn(Principal user) {
        if (user == null) {
            return false;
        }
        if (user instanceof Authentication auth) {
            return AuthUtils.isLoggedIn(auth);
        }
        return true;
    }
}
