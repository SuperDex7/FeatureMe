package Feat.FeatureMe.config;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component

public class WebSocketEventListener {

    @EventListener
    public void handleWebSocketEventListener(SessionDisconnectEvent event){
        
    }
    
}
