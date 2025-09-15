package Feat.FeatureMe.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import Feat.FeatureMe.Entity.Chats;

public interface ChatsRepository extends MongoRepository<Chats, String> {
    
}
