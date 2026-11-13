package Feat.FeatureMe.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import Feat.FeatureMe.Dto.CommentDTO;
import Feat.FeatureMe.Dto.ViewsDTO;
import Feat.FeatureMe.Dto.LikesDTO;
import Feat.FeatureMe.Dto.NotificationsDTO;
import Feat.FeatureMe.Dto.PostsDTO;
import Feat.FeatureMe.Dto.UserPostsDTO;
import Feat.FeatureMe.Entity.PostComment;
import Feat.FeatureMe.Entity.Posts;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PostsRepository;
import Feat.FeatureMe.Repository.UserRepository;
import Feat.FeatureMe.Service.S3Service;

@Service
public class PostsService {

    private final PostsRepository postsRepository;
    private final UserRepository userRepository;
    private final PostViewService postViewService;
    private final PostCommentService postCommentService;
    private final PostLikeService postLikeService;
    private final S3Service s3Service;
    private final NotificationService notificationService;
    private final AtomicUpdates atomicUpdates;
    
    public PostsService(PostsRepository postsRepository, UserRepository userRepository, PostViewService postViewService, PostCommentService postCommentService, PostLikeService postLikeService, S3Service s3Service, NotificationService notificationService, AtomicUpdates atomicUpdates) {
        this.notificationService = notificationService;
        this.atomicUpdates = atomicUpdates;
        this.postsRepository = postsRepository;
        this.userRepository = userRepository;
        this.postViewService = postViewService;
        this.postCommentService = postCommentService;
        this.postLikeService = postLikeService;
        this.s3Service = s3Service;
    }
    

    // ---------- Post -> PostsDTO, batched ----------
    //
    // Every list of posts used to resolve each post's author separately (lazy
    // @DBRef) and look up the profile picture of every person in each post's
    // recent likes and comments one at a time: ~20+ queries per post. Authors
    // now load in one query per batch, and likes/comments batch their
    // pictures (see PostLikeService / PostCommentService).

    /** The author's id without loading the author (lazy @DBRef proxy) */
    private static String authorIdOf(Posts post) {
        Object author = post.getAuthor();
        if (author == null) return null;
        if (author instanceof org.springframework.data.mongodb.core.convert.LazyLoadingProxy proxy) {
            com.mongodb.DBRef ref = proxy.toDBRef();
            return ref == null ? null : String.valueOf(ref.getId());
        }
        return ((User) author).getId();
    }

    List<PostsDTO> toDTOs(List<Posts> posts) {
        if (posts == null || posts.isEmpty()) return new ArrayList<>();
        List<String> authorIds = posts.stream().map(PostsService::authorIdOf).filter(java.util.Objects::nonNull).distinct().toList();
        java.util.Map<String, User> authors = new java.util.HashMap<>();
        for (User user : userRepository.findAllById(authorIds)) {
            authors.put(user.getId(), user);
        }
        List<PostsDTO> result = new ArrayList<>(posts.size());
        for (Posts p : posts) {
            User u = authors.get(authorIdOf(p));
            if (u == null) u = p.getAuthor(); // not in the batch: resolve the reference
            UserPostsDTO author = u == null ? null : new UserPostsDTO(
                u.getId(), u.getUserName(), u.getProfilePic(), u.getBanner(), u.getBio(), u.getLocation(), u.getRole());
            result.add(new PostsDTO(
                p.getId(),
                author,
                p.getTitle(),
                p.getDescription(),
                p.getFeatures(),
                p.getPendingFeatures(),
                p.getStatus(),
                p.getPrice(),
                p.isFreeDownload(),
                p.getGenre(),
                p.getMusic(),
                getCommentsForPost(p.getId()),
                p.getTime(),
                getLikesForPost(p.getId()),
                getViewsForPost(p.getId()),
                p.getTotalViews(),
                p.getTotalComments(),
                p.getTotalDownloads(),
                p.getTotalLikes()
            ));
        }
        return result;
    }

    /**
     * A user's liked posts in the order they liked them (newest first), read
     * from post_likes, so it can't drift from the real likes.
     */
    public PagedModel<PostsDTO> getLikedPosts(String userName, int page, int size) {
        Page<Feat.FeatureMe.Entity.PostLike> likes = postLikeService.getLikesByUser(userName, page, size);
        List<String> ids = likes.getContent().stream().map(Feat.FeatureMe.Entity.PostLike::getPostId).toList();
        java.util.Map<String, Posts> byId = new java.util.HashMap<>();
        for (Posts p : postsRepository.findAllById(ids)) byId.put(p.getId(), p);
        List<Posts> ordered = ids.stream().map(byId::get).filter(java.util.Objects::nonNull).toList();
        return new PagedModel<>(new PageImpl<>(toDTOs(ordered), likes.getPageable(), likes.getTotalElements()));
    }

    private Page<PostsDTO> toDTOPage(Page<Posts> page) {
        return new PageImpl<>(toDTOs(page.getContent()), page.getPageable(), page.getTotalElements());
    }

    private List<LikesDTO> getLikesForPost(String postId) {
        try {
            // Get recent likes from the separate collection (limit to 10 for post DTOs)
            return postLikeService.getRecentLikes(postId, 10);
        } catch (Exception e) {
            return List.of(); // Return empty list on error
        }
    }
    
    
    private List<CommentDTO> getCommentsForPost(String postId) {
        try {
            // Get recent comments from the separate collection (limit to 10 for post DTOs)
            return postCommentService.getRecentComments(postId, 10);
        } catch (Exception e) {
            return List.of(); // Return empty list on error
        }
    }
    
    
    /**
     * Post responses are public, so they no longer list who listened (that's
     * the author's analytics, see /posts/views/{id}/paginated). Kept as an
     * empty list so the response shape doesn't change for clients.
     */
    private List<ViewsDTO> getViewsForPost(String postId) {
        return List.of();
    }
    
        
    public Posts createPost(String authorId, Posts posts) {
        User author = userRepository.findById(authorId)
                     .orElseThrow(() -> new IllegalArgumentException("User not found"));

                     
        
        // Determine post status based on whether features are requested
        List<String> requestedFeatures = posts.getFeatures();
        String postStatus = (requestedFeatures != null && !requestedFeatures.isEmpty()) ? "DRAFT" : "PUBLISHED";
        
        Posts post = new Posts(
            null,
            author,
            posts.getTitle(),
            posts.getDescription(),
            new ArrayList<>(), // Start with empty approved features
            posts.getPrice(),
            posts.getGenre(),
            posts.getMusic(),
            Instant.now(),
            0, // Initial totalViews
            posts.isFreeDownload()
        );
        
        // Set the new fields
        post.setPendingFeatures(requestedFeatures != null ? new ArrayList<>(requestedFeatures) : new ArrayList<>());
        post.setStatus(postStatus);
        
        Posts savedPost = postsRepository.insert(post);
        PostsDTO postDto = new PostsDTO(
            savedPost.getId(),
            new UserPostsDTO(
                author.getId(),
                author.getUserName(),
                author.getProfilePic(),
                author.getBanner(),
                author.getBio(),
                author.getLocation(),
                author.getRole()
                        
            ),
            savedPost.getTitle(),
            savedPost.getDescription(),
            savedPost.getFeatures(),
            savedPost.getPendingFeatures(),
            savedPost.getStatus(),
            savedPost.getPrice(),
            savedPost.isFreeDownload(),
            savedPost.getGenre(),
            savedPost.getMusic(),
            getCommentsForPost(savedPost.getId()),
            savedPost.getTime(),
            getLikesForPost(savedPost.getId()),
            getViewsForPost(savedPost.getId()),
            savedPost.getTotalViews(),
            savedPost.getTotalComments(),
            savedPost.getTotalDownloads()
            
        );

        // Update user's posts list
        if (author.getPosts() == null) {
            author.setPosts(new ArrayList<>());
        }
        author.getPosts().add(savedPost.getId());
        
        atomicUpdates.addToUserList(author.getUserName(), "posts", savedPost.getId());

        // Send approval requests to featured users instead of auto-adding
        if (requestedFeatures != null && !requestedFeatures.isEmpty()) {
            List<User> featuredUsers = userRepository.findByUserNameIn(requestedFeatures);
            
            for(User featuredUser : featuredUsers) {
                // Send approval request notification instead of confirmation
                notificationService.notify(featuredUser.getUserName(),
                    postDto.id(),
                    author.getUserName(),
                    "Wants to feature you in their post '" + posts.getTitle() + "'. Approve or reject this feature request.",
                    NotificationsDTO.NotiType.POST);

            }
        }
        
        return savedPost;
        
    }
    
    public boolean approveFeature(String postId, String approverUserName) {
        Posts post = postsRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found or has been deleted"));
        
        User approver = userRepository.findByUserName(approverUserName)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Check if user is in pending features
        if (post.getPendingFeatures() == null || !post.getPendingFeatures().contains(approverUserName)) {
            return false; // User not in pending features
        }
        
        // Move from pending to approved features
        post.getPendingFeatures().remove(approverUserName);
        if (post.getFeatures() == null) {
            post.setFeatures(new ArrayList<>());
        }
        post.getFeatures().add(approverUserName);
        
        // Add post to user's featuredOn list
        if (approver.getFeaturedOn() == null) {
            approver.setFeaturedOn(new ArrayList<>());
        }
        approver.getFeaturedOn().add(postId);
        
        // Check if all features are approved
        if (post.getPendingFeatures().isEmpty()) {
            post.setStatus("PUBLISHED");
            
            // Notify post author that post is now published
            User author = post.getAuthor();
            notificationService.notify(author.getUserName(), postId, "System",
                "Your post '" + post.getTitle() + "' is now published! All featured users have approved.",
                NotificationsDTO.NotiType.POST);
        } else {
            post.setStatus("PARTIALLY_APPROVED");
        }
        
        // Notify approver
        notificationService.notify(approver.getUserName(), postId, post.getAuthor().getUserName(),
            "You approved the feature request for '" + post.getTitle() + "'",
            NotificationsDTO.NotiType.POST);
        
        postsRepository.save(post);
        atomicUpdates.addToUserList(approver.getUserName(), "featuredOn", postId);
        
        return true;
    }
    
    public boolean rejectFeature(String postId, String rejecterUserName) {
        Posts post = postsRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found or has been deleted"));
        
        User rejecter = userRepository.findByUserName(rejecterUserName)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Check if user is in pending features
        if (post.getPendingFeatures() == null || !post.getPendingFeatures().contains(rejecterUserName)) {
            return false; // User not in pending features
        }
        
        // Remove from pending features
        post.getPendingFeatures().remove(rejecterUserName);
        
        // Check if there are remaining pending features
        if (post.getPendingFeatures().isEmpty()) {
            // If no pending features remain, publish with approved features only
            post.setStatus("PUBLISHED");
            
            // Notify post author
            User author = post.getAuthor();
            notificationService.notify(author.getUserName(), postId, "System",
                "Your post '" + post.getTitle() + "' is now published with approved features only.",
                NotificationsDTO.NotiType.POST);
        } else if (!post.getFeatures().isEmpty()) {
            post.setStatus("PARTIALLY_APPROVED");
        }
        
        // Notify rejecter
        notificationService.notify(rejecter.getUserName(), postId, post.getAuthor().getUserName(),
            "You rejected the feature request for '" + post.getTitle() + "'",
            NotificationsDTO.NotiType.POST);
        
        // Notify post author about rejection
        User author = post.getAuthor();
        notificationService.notify(author.getUserName(), postId, rejecterUserName,
            rejecterUserName + " rejected the feature request for '" + post.getTitle() + "'",
            NotificationsDTO.NotiType.POST);
        
        postsRepository.save(post);


        
        return true;
    }
    
    public List<PostsDTO> getPendingFeatureRequests(String userName) {
        // Find all posts where user is in pendingFeatures
        List<Posts> posts = postsRepository.findAll().stream()
            .filter(post -> post.getPendingFeatures() != null && post.getPendingFeatures().contains(userName))
            .collect(java.util.stream.Collectors.toList());
        
        return toDTOs(posts);
    }
    
    
    public Posts updatePost(String id, Posts updatedPosts){
        Posts posts = postsRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("posts not found"));
        posts = new Posts(
            posts.getId(),
            posts.getAuthor(),
            updatedPosts.getTitle() != null && !updatedPosts.getTitle().isBlank() ? updatedPosts.getTitle() : posts.getTitle(),
            updatedPosts.getDescription() != null && !updatedPosts.getDescription().isBlank() ? updatedPosts.getDescription() : posts.getDescription(),
            updatedPosts.getFeatures() != null && !updatedPosts.getFeatures().isEmpty() ? updatedPosts.getFeatures() : posts.getFeatures(),
            updatedPosts.getPrice() != 0 ? updatedPosts.getPrice() : posts.getPrice(),
            updatedPosts.getGenre() != null && !updatedPosts.getGenre().isEmpty() ? updatedPosts.getGenre() : posts.getGenre(),
            updatedPosts.getMusic() != null && !updatedPosts.getMusic().isBlank() ? updatedPosts.getMusic() : posts.getMusic(),
            updatedPosts.getTime() != null ? updatedPosts.getTime() : posts.getTime(),
            posts.getTotalViews(), // Preserve existing totalViews
            posts.isFreeDownload()
        );
        return postsRepository.save(posts);
    }
    
    

    public PostsDTO getPostById(String id) {
        Posts post = postsRepository.findById(id)
                   .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return toDTOs(List.of(post)).get(0);
    }
    
    
    public List<PostsDTO> getPostsbyTitle(String getTitle){
        return postsRepository.findByTitleStartingWithIgnoreCase(getTitle);
    }
    
    
    
    
    
    public void deletePost(String id) {
        if (!postsRepository.existsById(id)) {
            throw new IllegalArgumentException("Post with id " + id + " does not exist.");
        }
        
        Posts post = postsRepository.findById(id).get();
        List<String> approvedFeatures = post.getFeatures();
        List<String> pendingFeatures = post.getPendingFeatures();
        User author = userRepository.findById(post.getAuthor().getId()).get();
        
        // Remove post from author's posts list
        if (author.getPosts() != null) {
            author.getPosts().remove(id);
        }
        atomicUpdates.removeFromUserList(author.getUserName(), "posts", id);

        // Clean up APPROVED features (remove from their featuredOn lists)
        if (approvedFeatures != null && !approvedFeatures.isEmpty()) {
            List<User> approvedUsers = userRepository.findByUserNameIn(approvedFeatures);
            
            for (User featuredUser : approvedUsers) {
                if (featuredUser != null && featuredUser.getFeaturedOn() != null) {
                    featuredUser.getFeaturedOn().remove(id);
                    atomicUpdates.removeFromUserList(featuredUser.getUserName(), "featuredOn", id);
                }
            }
        }
        
        // Clean up PENDING features (notify them that post was deleted)
        if (pendingFeatures != null && !pendingFeatures.isEmpty()) {
            List<User> pendingUsers = userRepository.findByUserNameIn(pendingFeatures);
            
            for (User pendingUser : pendingUsers) {
                if (pendingUser != null) {
                    // Remove any existing notifications related to this post
                    notificationService.removeAbout(pendingUser.getUserName(), id);
                    
                    // Add deletion notification
                    notificationService.notify(pendingUser.getUserName(),
                        null, // No post ID since it's deleted
                        author.getUserName(),
                        "Deleted their post '" + post.getTitle() + "' before you could approve/reject the feature request.",
                        NotificationsDTO.NotiType.POST);

                }
            }
        }
        
        // Delete the associated S3 file before deleting the post
        if (post.getMusic() != null && !post.getMusic().isEmpty()) {
            try {
                String s3Key = s3Service.extractKeyFromUrl(post.getMusic());
                
                boolean deleted = s3Service.deleteFile(s3Key);
                if (deleted) {
                    System.out.println("Successfully deleted S3 file: " + s3Key);
                } else {
                    System.err.println("Failed to delete S3 file: " + s3Key);
                }
            } catch (Exception e) {
                System.err.println("Error deleting S3 file for post " + id + ": " + e.getMessage());
            }
        }
        
        // Delete all comments for this post from the PostComment collection
        postCommentService.deleteCommentsForPost(id);
        
        // Delete all likes for this post from the PostLike collection
        postLikeService.deleteLikesForPost(id);
        
        // Delete all views for this post from the PostView collection
        postViewService.deleteViewsForPost(id);
        
        // Finally, delete the post from database
        postsRepository.deleteById(id);
    }

    public List<PostsDTO> getFeaturedOn(String userName){
        return postsRepository.findByFeatures(userName).stream()
            .filter(p -> "PUBLISHED".equals(p.getStatus()))
            .collect(Collectors.collectingAndThen(Collectors.toList(), this::toDTOs)).stream().toList();
    
    }




    public PagedModel<PostsDTO> getAllById(List<String> ids, int page, int size ) {
        // Fetch all posts matching the IDs to preserve order
        // We need to fetch all to preserve order, then paginate manually
        List<Posts> allPosts = postsRepository.findAllByIdIn(ids, PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        
        // Create a map for quick lookup
        Map<String, Posts> postMap = new HashMap<>();
        for (Posts post : allPosts) {
            postMap.put(post.getId(), post);
        }
        
        // Sort posts according to ID order (preserving the order of IDs list)
        List<Posts> sortedPosts = new ArrayList<>();
        for (String id : ids) {
            Posts post = postMap.get(id);
            if (post != null) {
                sortedPosts.add(post);
            }
        }
        
        // Manual pagination
        int totalElements = sortedPosts.size();
        int start = page * size;
        int end = Math.min(start + size, totalElements);
        List<Posts> pagedPosts = start < totalElements ? sortedPosts.subList(start, end) : new ArrayList<>();
        
        // Convert to DTOs
        List<PostsDTO> postsDTOList = toDTOs(pagedPosts);
        
        // Create Page object manually
        Page<PostsDTO> postsDTOPage = new org.springframework.data.domain.PageImpl<PostsDTO>(
            postsDTOList,
            PageRequest.of(page, size),
            totalElements
        );
        
        return new PagedModel<PostsDTO>(postsDTOPage);
    }

    public PagedModel<PostsDTO> getAllByIdSortedByTime(List<String> ids, int page, int size ) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "time"));
        Page<Posts> posts = postsRepository.findAllByIdInOrderByTimeDesc(ids, pageable);
        
        Page<PostsDTO> postsDTOPage = toDTOPage(posts);
        
        return new PagedModel<PostsDTO>(postsDTOPage);
    }

    public Optional<Posts> addLike(String id, String userName){
        Optional<Posts> post = postsRepository.findById(id);
        if (post.isEmpty()) return post;
        Posts foundPost = post.get();
        User author = foundPost.getAuthor();
        userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isLiked = postLikeService.toggleLike(id, userName);

        // Count straight from post_likes and write just that field (no whole-post save)
        int totalLikes = (int) postLikeService.getTotalLikes(id);
        atomicUpdates.setPost(id, "totalLikes", totalLikes);
        foundPost.setTotalLikes(totalLikes);

        if (isLiked) {
            atomicUpdates.addToUserList(userName, "likedPosts", id);
            if (author != null && !author.getUserName().equals(userName)) {
                notificationService.notify(author.getUserName(), id, userName, "Liked Your Post!", NotificationsDTO.NotiType.POST);
            }
        } else {
            atomicUpdates.removeFromUserList(userName, "likedPosts", id);
            if (author != null) {
                notificationService.removeMatching(author.getUserName(), id, userName, "Liked Your Post!");
            }
        }
        return Optional.of(foundPost);
    }

    public Optional<Posts> addComment(String id, String userName, String comment){
        Optional<Posts> post = postsRepository.findById(id);
        if (post.isEmpty()) return post;
        Posts foundPost = post.get();
        User author = foundPost.getAuthor();
        userRepository.findByUserName(userName).orElseThrow(() -> new IllegalArgumentException("User not found"));

        postCommentService.addComment(id, userName, comment);
        atomicUpdates.incPost(id, "totalComments", 1);
        foundPost.setTotalComments(foundPost.getTotalComments() + 1);

        if (author != null && !author.getUserName().equals(userName)) {
            notificationService.notify(author.getUserName(), id, userName, "Commented on Your Post!", NotificationsDTO.NotiType.POST);
        }
        // (No copy on the user anymore: comments live in post_comments)
        return Optional.of(foundPost);
    }


    public boolean deleteCommentById(String commentId, String userName) {
        // Use PostCommentService to delete the comment by ID
        PostComment deletedComment = postCommentService.deleteCommentById(commentId, userName);
        if (deletedComment == null) {
            // Comment not found or user not authorized
            return false;
        }

        String postId = deletedComment.getPostId();
        atomicUpdates.incPost(postId, "totalComments", -1);

        postsRepository.findById(postId).map(Posts::getAuthor).ifPresent(author ->
            // The notification was created for the commenter, who may not be
            // the one deleting (post authors can delete comments too)
            notificationService.removeComment(author.getUserName(), postId, deletedComment.getUserName()));
        return true;
    }

    public PagedModel<PostsDTO> getAllPagedPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        // Only show published posts in public feed
        Page<Posts> postsPage = postsRepository.findByStatusOrderByTimeDesc("PUBLISHED", pageable);
        
        // Convert Page<Posts> to Page<PostsDTO>
        Page<PostsDTO> postsDTOPage = toDTOPage(postsPage);
        
        return new PagedModel<PostsDTO>(postsDTOPage);
    }


    public PagedModel<PostsDTO> findByLikesDesc(int page, int size){
        // NOW FAST: Use database-level sorting with cached totalLikes field! - ONLY PUBLISHED
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("totalLikes").descending().and(org.springframework.data.domain.Sort.by("time").descending()));
        Page<Posts> postsPage = postsRepository.findByStatusOrderByTotalLikesDescTimeDesc("PUBLISHED", pageable);
        
        // Convert to DTOs (much simpler now)
        Page<PostsDTO> postsDTOPage = toDTOPage(postsPage);
        
        return new PagedModel<PostsDTO>(postsDTOPage);
    }


    public PagedModel<PostsDTO> getSearchedPost(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Only search published posts
        Page<Posts> postsSearchedPage = postsRepository.findByTitleOrDescriptionContainingIgnoreCaseAndStatus(search, "PUBLISHED", pageable);
        
        Page<PostsDTO> postsDTOSearchedPage = toDTOPage(postsSearchedPage);
        
        return new PagedModel<PostsDTO>(postsDTOSearchedPage);
    }
    
    // Comprehensive search method with multiple filters and sorting options
    public PagedModel<PostsDTO> searchPosts(String searchTerm, List<String> genres, String sortBy, int page, int size) {
        Pageable pageable;
        
        // Set up sorting - now we can use database-level sorting for likes too!
        if ("likes".equalsIgnoreCase(sortBy)) {
            pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("totalLikes").descending().and(org.springframework.data.domain.Sort.by("time").descending()));
        } else {
            pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("time").descending());
        }
        
        Page<Posts> postsPage;
        
        // Get posts based on search criteria with proper sorting - ONLY PUBLISHED POSTS
        if (searchTerm != null && !searchTerm.trim().isEmpty() && genres != null && !genres.isEmpty()) {
            // Both search term and genres provided - use AND logic (both must match)
            postsPage = postsRepository.findByTitleOrDescriptionAndGenreInAndStatus(searchTerm.trim(), genres, "PUBLISHED", pageable);
        } else if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            // Only search term provided
            postsPage = postsRepository.findByTitleOrDescriptionContainingIgnoreCaseAndStatus(searchTerm.trim(), "PUBLISHED", pageable);
        } else if (genres != null && !genres.isEmpty()) {
            // Only genres provided - filter by status
            postsPage = postsRepository.findByGenreInAndStatus(genres, "PUBLISHED", pageable);
        } else {
            // No filters provided - only published posts
            postsPage = postsRepository.findByStatusOrderByTimeDesc("PUBLISHED", pageable);
        }
        
        // Convert to DTOs (much simpler now with database sorting)
        Page<PostsDTO> postsDTOPage = toDTOPage(postsPage);
        
        return new PagedModel<PostsDTO>(postsDTOPage);
    }


    public void addView(String id, String userName) {
        postsRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        postViewService.addView(id, userName);
        // Count the play on the post (atomic; incremented, not recounted from
        // post_views, whose older records were deleted by a since-removed TTL)
        atomicUpdates.incPost(id, "totalViews", 1);
    }
    
    public List<ViewsDTO> getPostViews(String postId) {
        // Verify post exists
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        
        // Get recent views from the separate collection (limit to 50 for performance)
        return postViewService.getRecentViews(postId, 50);
    }
    
    // New methods for the separate views system
    public PostViewService.PostViewSummary getPostViewSummary(String postId) {
        Posts post = postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        PostViewService.PostViewSummary fromRecords = postViewService.getViewSummary(postId);
        // Some per-listener records were deleted by an old TTL index, so the
        // post's own play counter can be higher; never report fewer plays than it
        long totalViews = Math.max(fromRecords.getTotalViews(), post.getTotalViews());
        long listeners = fromRecords.getUniqueViewers();
        return new PostViewService.PostViewSummary(totalViews, listeners, listeners > 0 ? (double) totalViews / listeners : 0);
    }
    
    public PagedModel<ViewsDTO> getPostViewsPaginated(String postId, int page, int size) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        Page<ViewsDTO> viewsPage = postViewService.getPostViews(postId, page, size);
        return new PagedModel<>(viewsPage);
    }
    
    // New methods for the separate comments system
    
    public PagedModel<CommentDTO> getPostCommentsPaginated(String postId, int page, int size) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        Page<CommentDTO> commentsPage = postCommentService.getPostComments(postId, page, size);
        return new PagedModel<>(commentsPage);
    }
    
    // New methods for the separate likes system
    public PostLikeService.PostLikeSummary getPostLikeSummary(String postId) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return postLikeService.getLikeSummary(postId);
    }
    
    public PagedModel<LikesDTO> getPostLikesPaginated(String postId, int page, int size) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        Page<LikesDTO> likesPage = postLikeService.getPostLikes(postId, page, size);
        return new PagedModel<>(likesPage);
    }
    
    public boolean hasUserLikedPost(String postId, String userName) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        return postLikeService.hasUserLiked(postId, userName);
    }
    
    public PagedModel<PostsDTO> findByUserRoleOrderByLikesDesc(String role, int page, int size) {
        // Since @DBRef fields can be tricky to query directly in MongoDB, 
        // we'll fetch all published posts and filter by role in the service layer
        
        // Get a larger page size to account for filtering
        int fetchSize = size * 3; // Fetch 3x more to account for filtering
        Pageable pageable = PageRequest.of(0, Math.max(fetchSize, 50), org.springframework.data.domain.Sort.by("totalLikes").descending().and(org.springframework.data.domain.Sort.by("time").descending()));
        Page<Posts> allPostsPage = postsRepository.findByStatusOrderByTotalLikesDescTimeDesc("PUBLISHED", pageable);
        
        // Filter by user role and convert to DTOs
        List<PostsDTO> filteredPosts = allPostsPage.getContent().stream()
            .filter(p -> p.getAuthor() != null && role.equals(p.getAuthor().getRole()))
            .skip((long) page * size)
            .limit(size)
            .collect(Collectors.collectingAndThen(Collectors.toList(), this::toDTOs)).stream()
            .toList();
        
        // Calculate total elements for pagination (this is an approximation)
        long totalFilteredElements = allPostsPage.getContent().stream()
            .filter(p -> p.getAuthor() != null && role.equals(p.getAuthor().getRole()))
            .count();
        
        // Create a manual page implementation
        Page<PostsDTO> postsDTOPage = new org.springframework.data.domain.PageImpl<>(
            filteredPosts, 
            PageRequest.of(page, size), 
            totalFilteredElements
        );
        
        return new PagedModel<PostsDTO>(postsDTOPage);
    }


    public void notifyDownload(String id, String userName) {
        Posts post = postsRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User author = post.getAuthor();
        if (author == null || author.getUserName().equals(userName)) return;
        notificationService.notify(author.getUserName(), id, userName,
            "Downloaded Your Post '" + post.getTitle() + "'", NotificationsDTO.NotiType.POST);
    }
    
    public void incrementTotalDownloads(String postId) {
        postsRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        atomicUpdates.incPost(postId, "totalDownloads", 1);
    }
   
    }


