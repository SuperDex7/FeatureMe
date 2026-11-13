package Feat.FeatureMe.Dto;

import java.time.Instant;

/**
 * A notification as sent to clients. {@code id} is what it's about (post or
 * chat id); {@code notificationId} identifies the notification itself, for
 * deleting it. Old notifications stored inside user documents have no
 * notificationId until they're moved to the notifications collection.
 */
public record NotificationsDTO(
    String id,
    String userName,
    String noti,
    Instant time,
    NotiType notiType,
    String notificationId
) {
    public NotificationsDTO(String id, String userName, String noti, Instant time, NotiType notiType) {
        this(id, userName, noti, time, notiType, null);
    }

    public enum NotiType{
        POST,
        CHAT,
        PROFILE
    }
}
