package Feat.FeatureMe.Dto;

import java.time.Instant;
import java.util.List;

public record PostsDTO(
    String id,
        UserPostsDTO author,
        String title,
        String description,
        List<String> features,
        List<String> pendingFeatures,
        String status,
        double price,
        boolean freeDownload,
        List<String> genre,
        String music,
        List<CommentDTO> comments,
        Instant time,
        List<LikesDTO> likes,
        List<ViewsDTO> views,
        int totalViews,
        int totalComments,
        int totalDownloads
        
) {

}
