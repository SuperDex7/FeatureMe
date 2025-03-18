package Feat.FeatureMe.Repository;

import java.util.List;
import Feat.FeatureMe.Entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    
        
        //User findByUserName(String userName);
        User findByEmail(String email);
        //List<User> findByUserNameContaining(String userName);
        //List<User> findByEmailContaining(String email);
        List<User> findbyUsername(String userName);
    
    
}