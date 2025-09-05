package Feat.FeatureMe.Entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "post_views")
public class PostView {
    
    @Id
    private String id;
    
    @Indexed
    private String postId;        // Reference to the post
    
    @Indexed
    private String userName;      // User who viewed the post
    
    private String profilePic;    // User's profile picture
    private LocalDateTime firstView;   // When user first viewed this post
    private LocalDateTime lastView;    // Most recent view time
    private int viewCount;        // How many times this user viewed this post
    
    public PostView() {}
    
    public PostView(String postId, String userName, String profilePic, 
                   LocalDateTime firstView, LocalDateTime lastView, int viewCount) {
        this.postId = postId;
        this.userName = userName;
        this.profilePic = profilePic;
        this.firstView = firstView;
        this.lastView = lastView;
        this.viewCount = viewCount;
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
    
    public LocalDateTime getFirstView() {
        return firstView;
    }
    
    public void setFirstView(LocalDateTime firstView) {
        this.firstView = firstView;
    }
    
    public LocalDateTime getLastView() {
        return lastView;
    }
    
    public void setLastView(LocalDateTime lastView) {
        this.lastView = lastView;
    }
    
    public int getViewCount() {
        return viewCount;
    }
    
    public void setViewCount(int viewCount) {
        this.viewCount = viewCount;
    }
}
