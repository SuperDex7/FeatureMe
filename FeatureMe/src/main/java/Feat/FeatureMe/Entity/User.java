package Feat.FeatureMe.Entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "user")
public record User(
    @Id String id,
    String userName,
    String password,
    String email,
    String profilePic
) {
}
