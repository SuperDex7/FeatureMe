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
        int totalDownloads,
        int totalLikes   // the real count; likes is only the 10 most recent
) {
    public PostsDTO(String id, UserPostsDTO author, String title, String description, List<String> features,
            List<String> pendingFeatures, String status, double price, boolean freeDownload, List<String> genre,
            String music, List<CommentDTO> comments, Instant time, List<LikesDTO> likes, List<ViewsDTO> views,
            int totalViews, int totalComments, int totalDownloads) {
        this(id, author, title, description, features, pendingFeatures, status, price, freeDownload, genre, music,
            comments, time, likes, views, totalViews, totalComments, totalDownloads, likes == null ? 0 : likes.size());
    }
}
