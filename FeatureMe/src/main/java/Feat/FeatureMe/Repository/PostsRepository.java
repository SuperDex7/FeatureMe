package Feat.FeatureMe.Repository;


import Feat.FeatureMe.Entity.Posts;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface PostsRepository extends MongoRepository<Posts, String> {
    
    List<Posts> findByTitleStartingWith(String title);
    List<Posts>  findByFeatures(String features);
    List<Posts>  findByGenre(String genre);
   
    
}
