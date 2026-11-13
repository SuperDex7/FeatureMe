package Feat.FeatureMe.Service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import Feat.FeatureMe.Dto.NotificationsDTO;
import Feat.FeatureMe.Entity.Notification;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.NotificationRepository;
import Feat.FeatureMe.Repository.UserRepository;

@DisplayName("NotificationService")
class NotificationServiceTest {

    private NotificationRepository repository;
    private MongoTemplate mongoTemplate;
    private NotificationService service;

    @BeforeEach
    void setUp() {
        repository = mock(NotificationRepository.class);
        mongoTemplate = mock(MongoTemplate.class);
        service = new NotificationService(repository, mock(UserRepository.class), mongoTemplate);
    }

    @Test
    @DisplayName("notify stores one document per notification")
    void notifySaves() {
        service.notify("alice", "p1", "bob", "Liked Your Post!", NotificationsDTO.NotiType.POST);

        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getRecipient()).isEqualTo("alice");
        assertThat(saved.getValue().getActor()).isEqualTo("bob");
        assertThat(saved.getValue().getTime()).isNotNull();
    }

    @Test
    @DisplayName("pages are newest first and capped at 50")
    void pageSizeCapped() {
        when(repository.findByRecipientOrderByTimeDesc(eq("alice"), any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

        service.page("alice", -3, 10_000);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findByRecipientOrderByTimeDesc(eq("alice"), pageable.capture());
        assertThat(pageable.getValue().getPageSize()).isEqualTo(50);
        assertThat(pageable.getValue().getPageNumber()).isZero();
    }

    @Test
    @DisplayName("you can only delete your own notifications")
    void deleteOwnOnly() {
        when(repository.deleteByIdAndRecipient("n1", "alice")).thenReturn(1L);
        when(repository.deleteByIdAndRecipient("n1", "mallory")).thenReturn(0L);

        assertThat(service.delete("alice", "n1")).isTrue();
        assertThat(service.delete("mallory", "n1")).isFalse();
    }

    @Test
    @DisplayName("DTOs carry the notification's own id for deleting")
    void dtoHasNotificationId() {
        Notification n = new Notification("alice", "p1", "bob", "Liked Your Post!", Instant.now(), NotificationsDTO.NotiType.POST);
        n.setId("n1");
        NotificationsDTO dto = n.toDTO();
        assertThat(dto.notificationId()).isEqualTo("n1");
        assertThat(dto.id()).isEqualTo("p1");
        assertThat(dto.userName()).isEqualTo("bob");
    }

    @Test
    @DisplayName("notifications stored inside a user are moved to the collection and cleared from the user")
    void migratesEmbedded() {
        User alice = new User();
        alice.setId("alice-id");
        alice.setUserName("alice");
        List<NotificationsDTO> embedded = new ArrayList<>(List.of(
            new NotificationsDTO("p1", "bob", "Liked Your Post!", Instant.parse("2026-01-01T00:00:00Z"), NotificationsDTO.NotiType.POST),
            new NotificationsDTO(null, "carol", "Started Following You!", null, NotificationsDTO.NotiType.PROFILE)));
        alice.setNotifications(embedded);

        int moved = service.migrate(alice);

        assertThat(moved).isEqualTo(2);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Notification>> saved = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(saved.capture());
        assertThat(saved.getValue()).extracting(Notification::getRecipient).containsOnly("alice");
        assertThat(saved.getValue()).extracting(Notification::getTime).doesNotContainNull();
        // Only the notifications field is cleared, not the whole user rewritten
        verify(mongoTemplate).updateFirst(any(Query.class), any(Update.class), eq(User.class));
        verify(mongoTemplate, never()).save(any());
        assertThat(alice.getNotifications()).isEmpty();
    }

    @Test
    @DisplayName("users with nothing embedded are left alone")
    void nothingToMigrate() {
        User bob = new User();
        bob.setUserName("bob");
        assertThat(service.migrate(bob)).isZero();
        verify(repository, never()).saveAll(any());
        verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));
        verify(repository, never()).deleteByRecipient(anyString());
    }
}
