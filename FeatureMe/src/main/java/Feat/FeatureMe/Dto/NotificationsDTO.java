package Feat.FeatureMe.Dto;

import java.time.Instant;

public record NotificationsDTO(
    String id,
    String userName,
    String noti,
    Instant time,
    NotiType notiType
) {
    public enum NotiType{
        POST,
        CHAT,
        PROFILE
    }
    
}
