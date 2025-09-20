package Feat.FeatureMe.Dto;

import java.time.Instant;

public record PostDownloadDTO(
    String id,
    String postId,
    String userId,
    String userName,
    String profilePic,
    Instant downloadTime
) {
    
}
