package Feat.FeatureMe.Dto;

import java.time.Instant;

public record ViewsDTO(
    String userName,
    String profilePic,
    Instant firstView,
    Instant lastView,
    int viewCount
) {
}
