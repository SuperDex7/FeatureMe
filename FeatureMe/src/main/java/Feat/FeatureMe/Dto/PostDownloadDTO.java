package Feat.FeatureMe.Dto;

import java.time.LocalDateTime;

public record PostDownloadDTO(
    String id,
    String postId,
    String userId,
    String userName,
    String profilePic,
    LocalDateTime downloadTime
) {
    
}
