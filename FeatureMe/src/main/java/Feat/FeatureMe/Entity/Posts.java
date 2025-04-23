package Feat.FeatureMe.Entity;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "posts")
public record Posts(
    @Id String id,
    String author,
    String title,
    String description,
    List<String> features,
    List<String> genre,
    String music,
    List<String> comments,
    LocalDate time,
    List<String> likes

) {

}
