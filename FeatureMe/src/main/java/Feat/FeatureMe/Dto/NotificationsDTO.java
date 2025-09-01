package Feat.FeatureMe.Dto;

import java.time.LocalDateTime;

public record NotificationsDTO(
    String id,
    String userName,
    String noti,
    LocalDateTime time
) {
    
}
