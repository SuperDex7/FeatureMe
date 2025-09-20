package Feat.FeatureMe.Entity;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "post_downloads")
public class PostDownload {

    @Id
    private String id;
    
    @Indexed
    private String postId;
    @Indexed
    private String userId;
    private String userName;
    @Indexed
    private Instant downloadTime;

    public PostDownload() {}

    public PostDownload(String id, String postId, String userId, String userName, Instant downloadTime) {
        this.id = id;
        this.postId = postId;
        this.userId = userId;
        this.userName = userName;
        this.downloadTime = downloadTime;
    }

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

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public Instant getDownloadTime() {
        return downloadTime;
    }

    public void setDownloadTime(Instant downloadTime) {
        this.downloadTime = downloadTime;
    }
}
