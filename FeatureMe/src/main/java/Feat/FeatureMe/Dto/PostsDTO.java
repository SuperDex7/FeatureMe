package Feat.FeatureMe.Dto;

import java.time.LocalDateTime;
import java.util.List;

public record PostsDTO(
    String id,
        UserPostsDTO author,
        String title,
        String description,
        List<String> features,
        List<String> pendingFeatures,
        String status,
        List<String> genre,
        String music,
        List<CommentDTO> comments,
        LocalDateTime time,
        List<LikesDTO> likes,
        List<ViewsDTO> views,
        int totalViews
        
) {

}
