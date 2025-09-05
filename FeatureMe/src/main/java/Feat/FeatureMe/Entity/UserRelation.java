package Feat.FeatureMe.Entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "user_relations")
@CompoundIndexes({
    @CompoundIndex(name = "follower_following_idx", def = "{'followerUserName' : 1, 'followingUserName' : 1}", unique = true),
    @CompoundIndex(name = "follower_created_idx", def = "{'followerUserName' : 1, 'createdAt' : -1}"),
    @CompoundIndex(name = "following_created_idx", def = "{'followingUserName' : 1, 'createdAt' : -1}")
})
public class UserRelation {
    
    @Id
    private String id;
    
    private String followerUserName;  // User who is following
    private String followingUserName; // User being followed
    
    private RelationType relationType;
    private RelationStatus status;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Optional: Store additional metadata
    private String followerProfilePic;
    private String followingProfilePic;
    
    public enum RelationType {
        FOLLOW,
        FRIEND_REQUEST, // For future friend system
        BLOCK          // For future blocking system
    }
    
    public enum RelationStatus {
        ACTIVE,
        PENDING,   // For friend requests
        BLOCKED,
        REMOVED
    }
    
    public UserRelation() {}
    
    public UserRelation(String followerUserName, String followingUserName, RelationType relationType, 
                       RelationStatus status, String followerProfilePic, String followingProfilePic) {
        this.followerUserName = followerUserName;
        this.followingUserName = followingUserName;
        this.relationType = relationType;
        this.status = status;
        this.followerProfilePic = followerProfilePic;
        this.followingProfilePic = followingProfilePic;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getFollowerUserName() {
        return followerUserName;
    }
    
    public void setFollowerUserName(String followerUserName) {
        this.followerUserName = followerUserName;
    }
    
    public String getFollowingUserName() {
        return followingUserName;
    }
    
    public void setFollowingUserName(String followingUserName) {
        this.followingUserName = followingUserName;
    }
    
    public RelationType getRelationType() {
        return relationType;
    }
    
    public void setRelationType(RelationType relationType) {
        this.relationType = relationType;
    }
    
    public RelationStatus getStatus() {
        return status;
    }
    
    public void setStatus(RelationStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getFollowerProfilePic() {
        return followerProfilePic;
    }
    
    public void setFollowerProfilePic(String followerProfilePic) {
        this.followerProfilePic = followerProfilePic;
    }
    
    public String getFollowingProfilePic() {
        return followingProfilePic;
    }
    
    public void setFollowingProfilePic(String followingProfilePic) {
        this.followingProfilePic = followingProfilePic;
    }
}
