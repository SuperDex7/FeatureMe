package Feat.FeatureMe.Repository;

import Feat.FeatureMe.Entity.UserRelation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRelationRepository extends MongoRepository<UserRelation, String> {
    
    // Check if a follow relationship exists
    boolean existsByFollowerUserNameAndFollowingUserNameAndStatus(
        String followerUserName, String followingUserName, UserRelation.RelationStatus status);
    
    // Find specific relationship
    Optional<UserRelation> findByFollowerUserNameAndFollowingUserNameAndStatus(
        String followerUserName, String followingUserName, UserRelation.RelationStatus status);
    
    // Get all followers of a user (paginated)
    Page<UserRelation> findByFollowingUserNameAndStatusOrderByCreatedAtDesc(
        String followingUserName, UserRelation.RelationStatus status, Pageable pageable);
    
    // Get all users that a user is following (paginated)
    Page<UserRelation> findByFollowerUserNameAndStatusOrderByCreatedAtDesc(
        String followerUserName, UserRelation.RelationStatus status, Pageable pageable);
    
    // Count followers
    long countByFollowingUserNameAndStatus(String followingUserName, UserRelation.RelationStatus status);
    
    // Count following
    long countByFollowerUserNameAndStatus(String followerUserName, UserRelation.RelationStatus status);
    
    // Get mutual followers (users who both follow each other)
    @Query("{ $and: [ " +
           "  { 'followerUserName': ?0, 'status': ?2 }, " +
           "  { 'followingUserName': { $in: ?1 } } " +
           "] }")
    List<UserRelation> findMutualConnections(String userName, List<String> potentialMutuals, 
                                           UserRelation.RelationStatus status);
    
    // Find users who follow both user A and user B (for friend suggestions)
    @Query("{ $and: [ " +
           "  { 'followingUserName': { $in: [?0, ?1] } }, " +
           "  { 'status': ?2 } " +
           "] }")
    List<UserRelation> findCommonFollowers(String userA, String userB, UserRelation.RelationStatus status);
    
    // Get follower usernames only (for backward compatibility)
    @Query(value = "{ 'followingUserName': ?0, 'status': ?1 }", fields = "{ 'followerUserName': 1 }")
    List<UserRelation> findFollowerUserNames(String followingUserName, UserRelation.RelationStatus status);
    
    // Get following usernames only (for backward compatibility)
    @Query(value = "{ 'followerUserName': ?0, 'status': ?1 }", fields = "{ 'followingUserName': 1 }")
    List<UserRelation> findFollowingUserNames(String followerUserName, UserRelation.RelationStatus status);
    
    // Delete relationship
    void deleteByFollowerUserNameAndFollowingUserNameAndStatus(
        String followerUserName, String followingUserName, UserRelation.RelationStatus status);
    
    // Get recent followers (for notifications/activity feed)
    List<UserRelation> findTop10ByFollowingUserNameAndStatusOrderByCreatedAtDesc(
        String followingUserName, UserRelation.RelationStatus status);
    
    // Find potential friend suggestions based on mutual connections
    @Query("{ $and: [ " +
           "  { 'followerUserName': { $in: ?0 } }, " +  // People followed by user's connections
           "  { 'followingUserName': { $ne: ?1 } }, " +   // Exclude the user themselves from suggestions
           "  { 'followingUserName': { $nin: ?2 } }, " + // Exclude people user already follows
           "  { 'status': ?3 } " +
           "] }")
    List<UserRelation> findFriendSuggestions(List<String> userConnections, String currentUser, 
                                           List<String> alreadyFollowing, UserRelation.RelationStatus status);
    
    // Delete all relations where user is either follower or following
    void deleteByFollowerUserNameOrFollowingUserName(String followerUserName, String followingUserName);
}
