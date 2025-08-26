package Feat.FeatureMe.Repository;


import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Entity.Posts;

import java.util.List;


import org.springframework.data.mongodb.repository.MongoRepository;



public interface PostsRepository extends MongoRepository<Posts, String> {
    
    List<PostsDTO> findByTitleStartingWithIgnoreCase(String title);
    List<Posts>  findByFeatures(String features);
    List<Posts>  findByGenre(String genre);
    List<Posts> findByAuthorStartingWithIgnoreCase(String author);
    List<Posts> findAllByOrderByLikesDesc();
    List<Posts> findAllByFeatures(String features);
}
