package Feat.FeatureMe.Entity;

import java.time.LocalDateTime;
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
    private List<String> genre;
    private String music;
    private List<String> comments;
    private LocalDateTime time;
    private List<String> likes;

    public Posts() { }

    public Posts(String id, User author, String title, String description, List<String> features, List<String> genre, String music, List<String> comments, LocalDateTime time, List<String> likes) {
        this.id = id;
        this.author = author;
        this.title = title;
        this.description = description;
        this.features = features;
        this.genre = genre;
        this.music = music;
        this.comments = comments;
        this.time = time;
        this.likes = likes;
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

    public List<String> getComments() {
        return comments;
    }

    public void setComments(List<String> comments) {
        this.comments = comments;
    }

    public LocalDateTime getTime() {
        return time;
    }

    public void setTime(LocalDateTime time) {
        this.time = time;
    }

    public List<String> getLikes() {
        return likes;
    }

    public void setLikes(List<String> likes) {
        this.likes = likes;
    }
}
