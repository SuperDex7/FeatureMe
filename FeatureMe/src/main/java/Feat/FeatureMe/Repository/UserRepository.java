package Feat.FeatureMe.Repository;

import java.util.List;
import java.util.Optional;

import Feat.FeatureMe.Entity.User;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    
        
        
    Optional<User> findByUserName(String userName);
    
    List<User> findByUserNameStartingWithIgnoreCase(String userName);
    /* Exists queries for fast uniqueness checks */
    boolean existsByUserName(String userName);
    boolean existsByEmail(String email);
    
}