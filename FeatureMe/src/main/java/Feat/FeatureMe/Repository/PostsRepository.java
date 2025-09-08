package Feat.FeatureMe.Repository;


import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Entity.Posts;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;



public interface PostsRepository extends MongoRepository<Posts, String> {
    
    List<PostsDTO> findByTitleStartingWithIgnoreCase(String title);
    List<Posts>  findByFeatures(String features);
    List<Posts>  findByGenre(String genre);
    List<Posts> findByAuthorStartingWithIgnoreCase(String author);
    // Removed: Can't sort by likes since they're now in separate collection
    // Use PostLikeService to get like counts and sort in service layer
    List<Posts> findAllByFeatures(String features);
    Page<Posts> findAllByOrderByTimeDesc(Pageable pageable);
    Page<Posts> findAllById(Pageable pageable);
    Page<Posts> findAllByIdIn(List<String> ids, Pageable pageable);
    
    // Method to find posts by ID list sorted by time descending
    @Query("{ '_id': { $in: ?0 } }")
    Page<Posts> findAllByIdInOrderByTimeDesc(List<String> ids, Pageable pageable);

    // Flexible search methods with multiple filters and sorting options
    
    // 1. Search by text (title/description) only
    @Query("{ $or: [ { 'title': { $regex: ?0, $options: 'i' } }, { 'description': { $regex: ?0, $options: 'i' } } ] }")
    Page<Posts> findByTitleOrDescriptionContainingIgnoreCase(String searchTerm, Pageable pageable);
    
    // 2. Search by genres only
    @Query("{ 'genre': { $in: ?0 } }")
    Page<Posts> findByGenreIn(List<String> genres, Pageable pageable);
    
    // 3. Search by text AND genres (both must match, ALL genres required)
    @Query("{ $and: [ { $or: [ { 'title': { $regex: ?0, $options: 'i' } }, { 'description': { $regex: ?0, $options: 'i' } } ] }, { 'genre': { $all: ?1 } } ] }")
    Page<Posts> findByTitleOrDescriptionAndGenreIn(String searchTerm, List<String> genres, Pageable pageable);
    
    // 4. Search by text OR genres (either can match)
    @Query("{ $or: [ { $or: [ { 'title': { $regex: ?0, $options: 'i' } }, { 'description': { $regex: ?0, $options: 'i' } } ] }, { 'genre': { $in: ?1 } } ] }")
    Page<Posts> findByTitleOrDescriptionOrGenreIn(String searchTerm, List<String> genres, Pageable pageable);
    
    // 5. Most liked posts (now using cached totalLikes field for efficient sorting)
    Page<Posts> findAllByOrderByTotalLikesDescTimeDesc(Pageable pageable);
    
    // 6. Most recent posts (sorted by time)
    @Query("{}")
    Page<Posts> findMostRecentPosts(Pageable pageable);
    
    // 7. Most liked posts with genre filter (ALL genres must match) - sorting handled by Pageable
    @Query("{ 'genre': { $all: ?0 } }")
    Page<Posts> findByGenreAllOrderByTotalLikesDescTimeDesc(List<String> genres, Pageable pageable);
    
    // 8. Most recent posts with genre filter (ALL genres must match)
    @Query("{ 'genre': { $all: ?0 } }")
    Page<Posts> findMostRecentPostsByGenre(List<String> genres, Pageable pageable);
    
    // Methods to filter by status (for feature approval system)
    Page<Posts> findByStatusOrderByTimeDesc(String status, Pageable pageable);
    List<Posts> findByStatus(String status);
    
    // Search methods with status filter
    @Query("{ $and: [ { 'status': ?1 }, { $or: [ { 'title': { $regex: ?0, $options: 'i' } }, { 'description': { $regex: ?0, $options: 'i' } } ] } ] }")
    Page<Posts> findByTitleOrDescriptionContainingIgnoreCaseAndStatus(String searchTerm, String status, Pageable pageable);
    
    @Query("{ $and: [ { 'status': ?1 }, { 'genre': { $in: ?0 } } ] }")
    Page<Posts> findByGenreInAndStatus(List<String> genres, String status, Pageable pageable);
    
    @Query("{ $and: [ { 'status': ?2 }, { $and: [ { $or: [ { 'title': { $regex: ?0, $options: 'i' } }, { 'description': { $regex: ?0, $options: 'i' } } ] }, { 'genre': { $all: ?1 } } ] } ] }")
    Page<Posts> findByTitleOrDescriptionAndGenreInAndStatus(String searchTerm, List<String> genres, String status, Pageable pageable);
    
    // Most liked posts with status filter
    @Query("{ 'status': ?0 }")
    Page<Posts> findByStatusOrderByTotalLikesDescTimeDesc(String status, Pageable pageable);
    
}

