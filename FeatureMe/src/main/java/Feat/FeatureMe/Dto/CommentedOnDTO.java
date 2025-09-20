package Feat.FeatureMe.Dto;

import java.time.Instant;

public record CommentedOnDTO(
    String id,
    String commented,
    Instant time
) {
    
}
