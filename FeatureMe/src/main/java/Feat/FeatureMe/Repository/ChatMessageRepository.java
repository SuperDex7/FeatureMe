package Feat.FeatureMe.Repository;
import org.springframework.data.mongodb.repository.MongoRepository;

import Feat.FeatureMe.Entity.ChatMessage;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    
}
