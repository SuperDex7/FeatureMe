package Feat.FeatureMe.Entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonIgnore;


@Document(collection = "posts")
public class Posts {

    @Id
    private String id;
    
    @DBRef(lazy = true)
    @JsonIgnore
    private User author;
    
    private String title;
    private String description;
    private List<String> features;
    private List<String> pendingFeatures; // Features awaiting approval
    private String status = "DRAFT"; // DRAFT, PUBLISHED, PARTIALLY_APPROVED
    private List<String> genre;
    private String music;
    // Comments are now stored in separate PostComment collection
    private LocalDateTime time;
    // Likes are now stored in separate PostLike collection
    // Views are now stored in separate PostView collection
    // Keep totalViews as cached field for performance (will be calculated from PostView collection)
    private int totalViews = 0;
    // Keep totalLikes as cached field for performance (will be calculated from PostLike collection)
    private int totalLikes = 0;
    // Keep totalComments as cached field for performance (will be calculated from PostComment collection)
    private int totalComments = 0;

    public Posts() { }

    public Posts(String id, User author, String title, String description, List<String> features, List<String> genre, String music, LocalDateTime time, int totalViews) {
        this.id = id;
        this.author = author;
        this.title = title;
        this.description = description;
        this.features = features;
        this.pendingFeatures = new ArrayList<>();
        this.status = "PUBLISHED"; // For backward compatibility
        this.genre = genre;
        this.music = music;
        this.time = time;
        this.totalViews = totalViews;
        this.totalLikes = 0; // Initialize with 0 likes
        this.totalComments = 0; // Initialize with 0 comments
    }
    
    public Posts(String id, User author, String title, String description, List<String> features, List<String> genre, String music, LocalDateTime time, int totalViews, int totalLikes) {
        this.id = id;
        this.author = author;
        this.title = title;
        this.description = description;
        this.features = features;
        this.pendingFeatures = new ArrayList<>();
        this.status = "PUBLISHED"; // For backward compatibility
        this.genre = genre;
        this.music = music;
        this.time = time;
        this.totalViews = totalViews;
        this.totalLikes = totalLikes;
        this.totalComments = 0; // Initialize with 0 comments
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getFeatures() {
        return features;
    }

    public void setFeatures(List<String> features) {
        this.features = features;
    }

    public List<String> getGenre() {
        return genre;
    }

    public void setGenre(List<String> genre) {
        this.genre = genre;
    }

    public String getMusic() {
        return music;
    }

    public void setMusic(String music) {
        this.music = music;
    }


    public LocalDateTime getTime() {
        return time;
    }

    public void setTime(LocalDateTime time) {
        this.time = time;
    }



    public int getTotalViews() {
        return totalViews;
    }

    public void setTotalViews(int totalViews) {
        this.totalViews = totalViews;
    }
    
    public int getTotalLikes() {
        return totalLikes;
    }

    public void setTotalLikes(int totalLikes) {
        this.totalLikes = totalLikes;
    }
    
    public int getTotalComments() {
        return totalComments;
    }

    public void setTotalComments(int totalComments) {
        this.totalComments = totalComments;
    }
    
    public List<String> getPendingFeatures() {
        return pendingFeatures;
    }

    public void setPendingFeatures(List<String> pendingFeatures) {
        this.pendingFeatures = pendingFeatures;
    }
    
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
