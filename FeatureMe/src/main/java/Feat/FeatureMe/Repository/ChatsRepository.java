package Feat.FeatureMe.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;

import Feat.FeatureMe.Entity.Chats;

public interface ChatsRepository extends MongoRepository<Chats, String> {
    
    Page<Chats> findAllByChatRoomIdIn(List<String> ids, Pageable pageable);
    
    List<Chats> findAllByChatRoomIdIn(List<String> ids);
    
    // Remove a user from all chat rooms they're part of
    @Query("{ 'users': ?0 }")
    @Update("{ $pull: { 'users': ?0 } }")
    void removeUserFromAllChats(String userId);
    
    // Delete chat by chatRoomId
    void deleteByChatRoomId(String chatRoomId);
}
