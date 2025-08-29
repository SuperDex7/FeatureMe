package Feat.FeatureMe.Dto;

import java.time.LocalDateTime;

public record LikesDTO(
    String userName,
    String profilePic,
    LocalDateTime time
) {
    
}
