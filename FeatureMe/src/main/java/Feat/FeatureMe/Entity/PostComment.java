package Feat.FeatureMe.Entity;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

@Document(collection = "post_comments")
@CompoundIndexes({
    @CompoundIndex(name = "post_time_idx", def = "{'postId': 1, 'time': -1}"),
    @CompoundIndex(name = "user_time_idx", def = "{'userName': 1, 'time': -1}")
})
public class PostComment {
    
    @Id
    private String id;
    
    @Indexed
    private String postId;        // Reference to the post
    
    @Indexed
    private String userName;      // User who made the comment
    
    private String comment;       // The comment text
    private Instant time;   // When the comment was made
    
    public PostComment() {}
    
    public PostComment(String postId, String userName, String comment, Instant time) {
        this.postId = postId;
        this.userName = userName;
        this.comment = comment;
        this.time = time;
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
    
    
    public String getComment() {
        return comment;
    }
    
    public void setComment(String comment) {
        this.comment = comment;
    }
    
    public Instant getTime() {
        return time;
    }
    
    public void setTime(Instant time) {
        this.time = time;
    }
}
