package Feat.FeatureMe.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import Feat.FeatureMe.Dto.NotificationsDTO;
import Feat.FeatureMe.Entity.Notification;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.NotificationRepository;
import Feat.FeatureMe.Repository.UserRepository;

/**
 * All notifications go through here. They're stored in their own collection
 * (see Notification) instead of a list inside each User, which capped them at
 * 30 and rewrote the whole user document for every like or comment.
 */
@Service
public class NotificationService implements ApplicationRunner {

    /** How many the old user-embedded endpoints and /user/me still return */
    public static final int RECENT_LIMIT = 30;
    public static final int MAX_PAGE_SIZE = 50;

    private final NotificationRepository repository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    public NotificationService(NotificationRepository repository, UserRepository userRepository, MongoTemplate mongoTemplate) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public void notify(String recipient, String refId, String actor, String text, NotificationsDTO.NotiType type) {
        if (recipient == null || recipient.isBlank()) return;
        repository.save(new Notification(recipient, refId, actor, text, Instant.now(), type));
    }

    /**
     * The next notifications older than {@code before}. Paging by time rather
     * than page number means deleting one doesn't shift later pages and skip
     * a notification.
     */
    public Page<NotificationsDTO> olderThan(String recipient, Instant before, int size) {
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        return repository.findByRecipientAndTimeBeforeOrderByTimeDesc(recipient, before, PageRequest.of(0, safeSize))
            .map(Notification::toDTO);
    }

    public Page<NotificationsDTO> page(String recipient, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        return repository.findByRecipientOrderByTimeDesc(recipient, PageRequest.of(Math.max(0, page), safeSize))
            .map(Notification::toDTO);
    }

    /** Newest first, for /user/me and the old notifications endpoint */
    public List<NotificationsDTO> recent(String recipient) {
        return repository.findTop30ByRecipientOrderByTimeDesc(recipient).stream().map(Notification::toDTO).toList();
    }

    public long count(String recipient) {
        return repository.countByRecipient(recipient);
    }

    /** Deletes one of the recipient's notifications; false if it isn't theirs or doesn't exist */
    public boolean delete(String recipient, String notificationId) {
        return repository.deleteByIdAndRecipient(notificationId, recipient) > 0;
    }

    public void clear(String recipient) {
        repository.deleteByRecipient(recipient);
    }

    /** Undoing an action (unlike, deleted comment) removes the notification it created */
    public void removeMatching(String recipient, String refId, String actor, String text) {
        repository.deleteByRecipientAndRefIdAndActorAndText(recipient, refId, actor, text);
    }

    public void removeComment(String recipient, String postId, String commenter) {
        removeMatching(recipient, postId, commenter, "Commented on Your Post!");
    }

    /** Removes everything a user was notified about one post or chat */
    public void removeAbout(String recipient, String refId) {
        repository.deleteByRecipientAndRefId(recipient, refId);
    }

    /** Unfollowing removes the "Started following you" notification */
    public void removeFollow(String recipient, String follower) {
        repository.deleteByRecipientAndActorAndType(recipient, follower, NotificationsDTO.NotiType.PROFILE);
    }

    /**
     * One-time move of notifications still stored inside user documents into
     * the collection. Runs at startup; users without embedded ones are skipped.
     */
    @Override
    public void run(ApplicationArguments args) {
        try {
            Query withEmbedded = new Query(Criteria.where("notifications.0").exists(true));
            List<User> users = mongoTemplate.find(withEmbedded, User.class);
            int moved = 0;
            for (User user : users) {
                moved += migrate(user);
            }
            if (moved > 0) {
                System.out.println("Moved " + moved + " notifications from " + users.size() + " users into the notifications collection");
            }
        } catch (Exception e) {
            System.err.println("Notification migration failed (will retry next start): " + e.getMessage());
        }
    }

    int migrate(User user) {
        List<NotificationsDTO> embedded = user.getNotifications();
        if (embedded == null || embedded.isEmpty()) return 0;
        List<Notification> docs = new ArrayList<>();
        for (NotificationsDTO n : embedded) {
            docs.add(new Notification(user.getUserName(), n.id(), n.userName(), n.noti(),
                n.time() != null ? n.time() : Instant.now(), n.notiType()));
        }
        repository.saveAll(docs);
        // Clear only this field, so nothing else on the user is overwritten
        mongoTemplate.updateFirst(
            new Query(Criteria.where("_id").is(user.getId())),
            new org.springframework.data.mongodb.core.query.Update().set("notifications", new ArrayList<>()),
            User.class);
        user.setNotifications(new ArrayList<>());
        return docs.size();
    }
}
