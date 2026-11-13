package Feat.FeatureMe.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.stereotype.Service;

import Feat.FeatureMe.Dto.PostDownloadDTO;
import Feat.FeatureMe.Entity.PostDownload;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PostDownloadRepository;
import Feat.FeatureMe.Repository.UserRepository;

@Service
public class PostDownloadService {

    private final PostDownloadRepository postDownloadRepository;
    private final UserRepository userRepository;

    public PostDownloadService(PostDownloadRepository postDownloadRepository, UserRepository userRepository) {
        this.postDownloadRepository = postDownloadRepository;
        this.userRepository = userRepository;
    }

    public PostDownload createDownload(String postId, String userId, String userName) {
        // Handle unknown/anonymous users
        if ("unknown".equals(userName)) {
            userId = "unknown";
        }
        
        PostDownload download = new PostDownload(
            UUID.randomUUID().toString(),
            postId,
            userId,
            userName,
            Instant.now()
        );
        return postDownloadRepository.save(download);
    }

    public List<PostDownloadDTO> getDownloadsForPost(String postId) {
        List<PostDownload> downloads = postDownloadRepository.findByPostIdOrderByDownloadTimeDesc(postId);
        
        return downloads.stream().map(download -> {
            // Get current user profile pic
            String profilePic = profilePicFor(download);
            
            return new PostDownloadDTO(
                download.getId(),
                download.getPostId(),
                download.getUserId(),
                download.getUserName(),
                profilePic,
                download.getDownloadTime()
            );
        }).toList();
    }

    public long getDownloadCountForPost(String postId) {
        return postDownloadRepository.countByPostId(postId);
    }

    public PagedModel<PostDownloadDTO> getDownloadsForPostPaginated(String postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostDownload> downloadPage = postDownloadRepository.findByPostIdOrderByDownloadTimeDesc(postId, pageable);
        
        List<PostDownloadDTO> downloads = downloadPage.getContent().stream().map(download -> {
            // Get current user profile pic
            String profilePic = profilePicFor(download);
            
            return new PostDownloadDTO(
                download.getId(),
                download.getPostId(),
                download.getUserId(),
                download.getUserName(),
                profilePic,
                download.getDownloadTime()
            );
        }).toList();
        
        // Create a new Page with the DTOs
        Page<PostDownloadDTO> downloadDTOPage = new PageImpl<>(downloads, pageable, downloadPage.getTotalElements());
        return new PagedModel<>(downloadDTOPage);
    }

    public boolean hasUserDownloadedPost(String postId, String userId) {
        return postDownloadRepository.existsByPostIdAndUserId(postId, userId);
    }

    public List<PostDownloadDTO> getDownloadsByUser(String userId) {
        List<PostDownload> downloads = postDownloadRepository.findByUserId(userId);
        
        return downloads.stream().map(download -> {
            // Get current user profile pic
            String profilePic = profilePicFor(download);
                
            
            return new PostDownloadDTO(
                download.getId(),
                download.getPostId(),
                download.getUserId(),
                download.getUserName(),
                profilePic,
                download.getDownloadTime()
            );
        }).toList();
    }

    /**
     * The downloader's current profile picture, or null for the default.
     * Older records can have a null or "unknown" userId (they were saved from
     * a client-supplied userName), so fall back to the name, and never pass
     * null to findById, which throws.
     */
    private String profilePicFor(PostDownload download) {
        String userId = download.getUserId();
        if (userId != null && !userId.isBlank() && !"unknown".equals(userId)) {
            return userRepository.findById(userId).map(User::getProfilePic).orElse(null);
        }
        String userName = download.getUserName();
        if (userName != null && !userName.isBlank() && !"unknown".equals(userName)) {
            return userRepository.findByUserName(userName).map(User::getProfilePic).orElse(null);
        }
        return null;
    }
}
