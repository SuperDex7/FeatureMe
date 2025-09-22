package Feat.FeatureMe.Repository;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import Feat.FeatureMe.Entity.ChatMessage;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    @Query(value = "{ 'chatRoomId': ?0 }", sort = "{ 'time': -1 }")
    List<ChatMessage> findByChatRoomIdOrderByTimeDesc(String chatRoomId, Pageable pageable);
    
    // Delete all messages for a specific chat room
    void deleteByChatRoomId(String chatRoomId);
}
