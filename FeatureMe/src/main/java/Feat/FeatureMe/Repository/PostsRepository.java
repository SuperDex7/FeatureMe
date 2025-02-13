package Feat.FeatureMe.Repository;

import java.util.List;
import Feat.FeatureMe.Entity.Posts;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PostsRepository extends MongoRepository<Posts, String> {
    
    List<Posts> findByTitle(String title);
    List<Posts>  findByDescription(String description);
    List<Posts>  findByFeatures(String features);
    List<Posts>  findByGenre(String genre);
   
    
}
