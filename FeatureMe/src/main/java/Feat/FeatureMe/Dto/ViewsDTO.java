package Feat.FeatureMe.Dto;

import java.time.LocalDateTime;

public record ViewsDTO(
    String userName,
    String profilePic,
    LocalDateTime firstView,
    LocalDateTime lastView,
    int viewCount
) {
}
