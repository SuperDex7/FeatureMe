package Feat.FeatureMe.Repository;

import java.util.List;
import java.util.Optional;

import Feat.FeatureMe.Entity.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    
        
        
    Optional<User> findByUserName(String userName);
    
    Page<User> findByUserNameContainingIgnoreCase(String userName, Pageable pageable);
    /* Exists queries for fast uniqueness checks */
    boolean existsByUserName(String userName);
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);


    List<User> findByUserNameIn(List<String> usernames);
    
    Optional<User> findByStripeCustomerId(String stripeCustomerId);
    
    Optional<User> findByAppleOriginalTransactionId(String appleOriginalTransactionId);
    
}