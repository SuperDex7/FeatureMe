package Feat.FeatureMe.Service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;

import Feat.FeatureMe.Dto.PostDownloadDTO;
import Feat.FeatureMe.Entity.PostDownload;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PostDownloadRepository;
import Feat.FeatureMe.Repository.UserRepository;

@DisplayName("PostDownloadService")
class PostDownloadServiceTest {

    @Test
    @DisplayName("lists old downloads saved without a user id instead of failing")
    void handlesMissingUserIds() {
        PostDownloadRepository downloads = mock(PostDownloadRepository.class);
        UserRepository users = mock(UserRepository.class);
        Instant now = Instant.now();
        List<PostDownload> records = List.of(
            new PostDownload("d1", "p1", "bob-id", "bob", now),
            new PostDownload("d2", "p1", null, "carol", now),        // old: saved from a client-sent name
            new PostDownload("d3", "p1", "unknown", "unknown", now)  // logged-out download
        );
        when(downloads.findByPostIdOrderByDownloadTimeDesc(eq("p1"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(records, PageRequest.of(0, 10), 3));
        User bob = new User();
        bob.setProfilePic("bob.jpg");
        User carol = new User();
        carol.setProfilePic("carol.jpg");
        when(users.findById("bob-id")).thenReturn(Optional.of(bob));
        when(users.findByUserName("carol")).thenReturn(Optional.of(carol));

        PostDownloadService service = new PostDownloadService(downloads, users);
        PagedModel<PostDownloadDTO> page = service.getDownloadsForPostPaginated("p1", 0, 10);

        assertThat(page.getContent()).extracting(PostDownloadDTO::userName).containsExactly("bob", "carol", "unknown");
        assertThat(page.getContent()).extracting(PostDownloadDTO::profilePic).containsExactly("bob.jpg", "carol.jpg", null);
        verify(users, never()).findById(null);
        verify(users, never()).findById("unknown");
    }
}
