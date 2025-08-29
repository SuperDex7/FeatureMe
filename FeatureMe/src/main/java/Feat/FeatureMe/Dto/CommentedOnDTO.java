package Feat.FeatureMe.Dto;

import java.time.LocalDateTime;

public record CommentedOnDTO(
    String id,
    String commented,
    LocalDateTime time
) {
    
}
