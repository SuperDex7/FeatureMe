package Feat.FeatureMe.Dto;

import java.time.LocalDateTime;
import java.util.List;

public record MostRecentChatDTO(
    String ChatId,
    String chatName,
    String chatPhoto,
    List<String> users,
    String message,
    LocalDateTime time
) {
    
}
