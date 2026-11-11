package Feat.FeatureMe.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;



@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // @Lazy: the interceptor depends on ChatService, which depends on the messaging
    // template this configuration creates.
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    public WebSocketConfig(@Lazy WebSocketAuthInterceptor webSocketAuthInterceptor) {
        this.webSocketAuthInterceptor = webSocketAuthInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
       // SockJS endpoint supports both web and mobile clients.
       // Same origin allowlist as REST CORS: the web client authenticates the handshake
       // with a cookie, so any-origin would let other sites open sockets as the visitor.
       // Native mobile clients send no Origin header and are unaffected.
       registry.addEndpoint("/ws")
       .setAllowedOriginPatterns(SecurityConfig.allowedOrigins().toArray(String[]::new))
       .addInterceptors(webSocketAuthInterceptor) // records the cookie token's expiry
       .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
    }
}
