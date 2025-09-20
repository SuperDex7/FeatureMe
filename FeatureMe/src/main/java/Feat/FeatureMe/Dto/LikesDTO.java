package Feat.FeatureMe.Dto;

import java.time.Instant;

public record LikesDTO(
    String userName,
    String profilePic,
    Instant time
) {
    
}
