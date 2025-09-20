package Feat.FeatureMe.Dto;

import java.time.Instant;

public record UserRelationDTO(
    String id,
    String userName,           // The other user in the relationship
    String profilePic,         // Their profile picture
    Instant createdAt,   // When the relationship was created
    String relationType,       // FOLLOW, FRIEND_REQUEST, etc.
    String status             // ACTIVE, PENDING, etc.
) {
    
    // Helper constructor for followers (from follower's perspective)
    public static UserRelationDTO fromFollower(String id, String followerUserName, String followerProfilePic, 
                                             Instant createdAt, String relationType, String status) {
        return new UserRelationDTO(id, followerUserName, followerProfilePic, createdAt, relationType, status);
    }
    
    // Helper constructor for following (from following's perspective)  
    public static UserRelationDTO fromFollowing(String id, String followingUserName, String followingProfilePic,
                                              Instant createdAt, String relationType, String status) {
        return new UserRelationDTO(id, followingUserName, followingProfilePic, createdAt, relationType, status);
    }
}
