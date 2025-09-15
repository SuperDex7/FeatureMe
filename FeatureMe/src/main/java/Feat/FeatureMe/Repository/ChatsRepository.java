package Feat.FeatureMe.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import Feat.FeatureMe.Entity.Chats;

public interface ChatsRepository extends MongoRepository<Chats, String> {
    
    Page<Chats> findAllByChatRoomIdIn(List<String> ids, Pageable pageable);
    
    List<Chats> findAllByChatRoomIdIn(List<String> ids);
}
