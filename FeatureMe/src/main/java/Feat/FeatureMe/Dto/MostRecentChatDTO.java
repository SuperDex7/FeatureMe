package Feat.FeatureMe.Dto;

import java.time.Instant;
import java.util.List;

public record MostRecentChatDTO(
    String ChatId,
    String chatName,
    String chatPhoto,
    List<String> users,
    String message,
    Instant time
) {
    
}
