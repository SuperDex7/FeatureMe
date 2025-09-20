package Feat.FeatureMe.Dto;

import java.time.Instant;

public record CommentDTO(
    String id,
    String userName,
    String profilePic,
    String comment,
    Instant time
) {
    
}
