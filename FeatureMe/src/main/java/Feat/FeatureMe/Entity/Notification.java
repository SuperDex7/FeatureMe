package Feat.FeatureMe.Entity;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import Feat.FeatureMe.Dto.NotificationsDTO;

/**
 * One notification for one user. Used to live in a list inside the User
 * document; a collection lets it be paged, deleted one at a time and written
 * without rewriting (and racing on) the whole user.
 */
@Document(collection = "notifications")
@CompoundIndex(name = "recipient_time_idx", def = "{'recipient': 1, 'time': -1}")
public class Notification {

    @Id
    private String id;

    /** userName of the person who receives it */
    private String recipient;

    /** What it's about: a post id, chat room id, or null */
    private String refId;

    /** userName of who caused it, or "System" */
    private String actor;

    private String text;
    private Instant time;
    private NotificationsDTO.NotiType type;

    public Notification() { }

    public Notification(String recipient, String refId, String actor, String text, Instant time, NotificationsDTO.NotiType type) {
        this.recipient = recipient;
        this.refId = refId;
        this.actor = actor;
        this.text = text;
        this.time = time;
        this.type = type;
    }

    public NotificationsDTO toDTO() {
        return new NotificationsDTO(refId, actor, text, time, type, id);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public String getRefId() { return refId; }
    public void setRefId(String refId) { this.refId = refId; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public Instant getTime() { return time; }
    public void setTime(Instant time) { this.time = time; }
    public NotificationsDTO.NotiType getType() { return type; }
    public void setType(NotificationsDTO.NotiType type) { this.type = type; }
}
