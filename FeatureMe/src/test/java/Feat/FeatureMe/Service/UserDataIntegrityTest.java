package Feat.FeatureMe.Service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Entity.UserRelation;
import Feat.FeatureMe.Repository.ChatsRepository;
import Feat.FeatureMe.Repository.DemoRepository;
import Feat.FeatureMe.Repository.PostCommentRepository;
import Feat.FeatureMe.Repository.PostDownloadRepository;
import Feat.FeatureMe.Repository.PostLikeRepository;
import Feat.FeatureMe.Repository.PostViewRepository;
import Feat.FeatureMe.Repository.PostsRepository;
import Feat.FeatureMe.Repository.UserRelationRepository;
import Feat.FeatureMe.Repository.UserRepository;

@DisplayName("User data integrity")
class UserDataIntegrityTest {

    private final UserRepository userRepository = mock(UserRepository.class);

    private UserService userService() {
        return new UserService(userRepository, mock(UserRelationService.class), mock(PostsRepository.class),
            mock(DemoRepository.class), mock(PostLikeRepository.class), mock(PostCommentRepository.class),
            mock(PostViewRepository.class), mock(PostDownloadRepository.class), mock(UserRelationRepository.class),
            mock(ChatsRepository.class), mock(PasswordEncoder.class), mock(S3Service.class), mock(NotificationService.class));
    }

    @Test
    @DisplayName("a profile edit can't change role, email, name, password, lists or counts, and keeps Stripe ids")
    void profileUpdateIsWhitelisted() {
        User stored = new User();
        stored.setId("u1");
        stored.setUserName("alice");
        stored.setEmail("alice@example.com");
        stored.setPassword("hash");
        stored.setRole("USER");
        stored.setBio("old bio");
        stored.setStripeCustomerId("cus_123");
        stored.setSubscriptionStatus("active");
        stored.setFollowersCount(42);
        when(userRepository.findById("u1")).thenReturn(Optional.of(stored));

        User request = new User();
        request.setRole("USERPLUS");
        request.setEmail("evil@example.com");
        request.setUserName("admin");
        request.setPassword("new");
        request.setBadges(List.of("Verified"));
        request.setLikedPosts(List.of("x"));
        request.setBio("  new bio  ");
        request.setAbout("");
        request.setSocialMedia(List.of("https://instagram.com/alice", " "));

        userService().updateUser("u1", request);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        User user = saved.getValue();
        assertThat(user.getRole()).isEqualTo("USER");
        assertThat(user.getEmail()).isEqualTo("alice@example.com");
        assertThat(user.getUserName()).isEqualTo("alice");
        assertThat(user.getPassword()).isEqualTo("hash");
        assertThat(user.getBadges()).isNull();
        assertThat(user.getLikedPosts()).isNull();
        assertThat(user.getStripeCustomerId()).isEqualTo("cus_123");
        assertThat(user.getSubscriptionStatus()).isEqualTo("active");
        assertThat(user.getFollowersCount()).isEqualTo(42);
        assertThat(user.getBio()).isEqualTo("new bio");
        assertThat(user.getAbout()).isEmpty();
        assertThat(user.getSocialMedia()).containsExactly("https://instagram.com/alice");
    }

    @Test
    @DisplayName("following updates both counters atomically without saving whole users")
    void followIsAtomic() {
        UserRelationRepository relations = mock(UserRelationRepository.class);
        AtomicUpdates atomic = mock(AtomicUpdates.class);
        UserRelationService service = new UserRelationService(relations, userRepository, mock(NotificationService.class), atomic);
        User alice = new User();
        alice.setUserName("alice");
        User bob = new User();
        bob.setUserName("bob");
        when(userRepository.findByUserName("alice")).thenReturn(Optional.of(alice));
        when(userRepository.findByUserName("bob")).thenReturn(Optional.of(bob));
        when(relations.findByFollowerUserNameAndFollowingUserNameAndStatus("alice", "bob", UserRelation.RelationStatus.ACTIVE))
            .thenReturn(Optional.empty());

        assertThat(service.toggleFollow("alice", "bob")).isEqualTo("Followed");

        verify(atomic).incUser("bob", "followersCount", 1);
        verify(atomic).incUser("alice", "followingCount", 1);
        verify(userRepository, never()).save(any());
    }
}
