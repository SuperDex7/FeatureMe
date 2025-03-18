package Feat.FeatureMe.Entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "user")
public record User(
    @Id String id,
    
    @Indexed(unique = true) String userName,
    String password,
    @Indexed(unique = true) String email,
    String bio,
    String about,
    String profilePic,
    String banner,
    String demo,
    String friends,
    String followers,
    int posts,
    String following

) {
}
