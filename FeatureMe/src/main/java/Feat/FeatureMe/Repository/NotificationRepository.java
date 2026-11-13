package Feat.FeatureMe.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import Feat.FeatureMe.Dto.NotificationsDTO;
import Feat.FeatureMe.Entity.Notification;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByRecipientOrderByTimeDesc(String recipient, Pageable pageable);

    Page<Notification> findByRecipientAndTimeBeforeOrderByTimeDesc(String recipient, java.time.Instant before, Pageable pageable);

    List<Notification> findTop30ByRecipientOrderByTimeDesc(String recipient);

    long countByRecipient(String recipient);

    long deleteByIdAndRecipient(String id, String recipient);

    long deleteByRecipient(String recipient);

    long deleteByRecipientAndRefIdAndActorAndText(String recipient, String refId, String actor, String text);

    long deleteByRecipientAndRefId(String recipient, String refId);

    long deleteByRecipientAndActorAndType(String recipient, String actor, NotificationsDTO.NotiType type);
}
