package Feat.FeatureMe.Entity;

import java.time.Instant;

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
    
    private Instant likedAt; // When the like was created
    
    public PostLike() {}
    
    public PostLike(String postId, String userName, Instant likedAt) {
        this.postId = postId;
        this.userName = userName;
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
    
    
    public Instant getLikedAt() {
        return likedAt;
    }
    
    public void setLikedAt(Instant likedAt) {
        this.likedAt = likedAt;
    }
}
