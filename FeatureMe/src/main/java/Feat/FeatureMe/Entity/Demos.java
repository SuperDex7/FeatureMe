package Feat.FeatureMe.Entity;



import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document(collection = "demos")
public class Demos {
    @Id
    private String id;

    
    private String creatorId;
    private String title;
    private List<String> features;
    private String songUrl;

    public Demos() { }

    
    public Demos(String id, String creatorId, String title, List<String> features, String songUrl) {
        this.id = id;
        this.creatorId= creatorId;
        this.title = title;
        this.features = features;
        this.songUrl = songUrl;
    }

    
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }
    public List<String> getFeatures() {
        return features;
    }
    public void setFeatures(List<String> features) {
        this.features = features;
    }
    public String getSongUrl() {
        return songUrl;
    }
    public void setSongUrl(String songUrl) {
        this.songUrl = songUrl;
    }

    public String getCreatorId() {
        return creatorId;
    }


    public void setCreatorId(String creatorId) {
        this.creatorId = creatorId;
    }
}
