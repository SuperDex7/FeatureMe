package Feat.FeatureMe.Dto;
import java.time.LocalDate;
import java.util.List;
public record PostsDTO(
    String id,
        UserDTO author,          // only the four fields you want
        String title,
        String description,
        List<String> features,
        List<String> genre,
        String music,
        List<String> comments,
        LocalDate time,
        int likeCount      // example derived value
        
) {

}
