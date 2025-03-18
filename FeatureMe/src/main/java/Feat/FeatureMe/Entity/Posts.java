package Feat.FeatureMe.Entity;
import java.time.LocalDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "posts")
public record Posts(
    @Id String id,
    String title,
    String description,
    String music,
    String features,
    String genre,
    String comments,
    LocalDate time,
    String likes

) {

}
