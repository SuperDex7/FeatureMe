package Feat.FeatureMe.Dto;

import java.time.LocalDateTime;

public record CommentDTO(
    String id,
    String userName,
    String profilePic,
    String comment,
    LocalDateTime time
) {
    
}
