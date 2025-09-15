package Feat.FeatureMe.Dto;

import java.time.LocalDateTime;

public record MostRecentChatDTO(
    String message,
    LocalDateTime time
) {
    
}
