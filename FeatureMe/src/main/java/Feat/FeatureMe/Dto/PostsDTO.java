package Feat.FeatureMe.Dto;

import java.time.LocalDateTime;
import java.util.List;
public record PostsDTO(
    String id,
        UserDTO author,
        String title,
        String description,
        List<String> features,
        List<String> genre,
        String music,
        List<String> comments,
        LocalDateTime time,
        List<String> likes
        
) {

}
