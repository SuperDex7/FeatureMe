package Feat.FeatureMe.Entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;

@Document(collection = "post_likes")
@CompoundIndex(def = "{'postId': 1, 'userName': 1}", unique = true)
public class PostLike {
    
    @Id
    private String id;
    
    @Indexed
    private String postId;        // Reference to the post
    
    @Indexed
    private String userName;      // User who liked the post
    
    private String profilePic;    // User's profile picture (cached for performance)
    private LocalDateTime likedAt; // When the like was created
    
    public PostLike() {}
    
    public PostLike(String postId, String userName, String profilePic, LocalDateTime likedAt) {
        this.postId = postId;
        this.userName = userName;
        this.profilePic = profilePic;
        this.likedAt = likedAt;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getPostId() {
        return postId;
    }
    
    public void setPostId(String postId) {
        this.postId = postId;
    }
    
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
    
    public String getProfilePic() {
        return profilePic;
    }
    
    public void setProfilePic(String profilePic) {
        this.profilePic = profilePic;
    }
    
    public LocalDateTime getLikedAt() {
        return likedAt;
    }
    
    public void setLikedAt(LocalDateTime likedAt) {
        this.likedAt = likedAt;
    }
}
