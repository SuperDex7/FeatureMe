package Feat.FeatureMe.Controller;

import Feat.FeatureMe.Dto.UserRelationDTO;
import Feat.FeatureMe.Dto.UserRelationSummaryDTO;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Service.UserRelationService;
import Feat.FeatureMe.Service.UserService;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-relations")
public class UserRelationController {
    
    private final UserRelationService userRelationService;
    private final UserService userService;
    
    public UserRelationController(UserRelationService userRelationService, UserService userService) {
        this.userRelationService = userRelationService;
        this.userService = userService;
    }
    
    /**
     * Follow/Unfollow a user (new enhanced version)
     */
    @PostMapping("/follow/{targetUserName}")
    public ResponseEntity<String> followUser(@PathVariable String targetUserName) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("User not authenticated");
            }
            
            String email = authentication.getName();
            User currentUser = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            String result = userRelationService.toggleFollow(currentUser.getUserName(), targetUserName);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    /**
     * Check if current user follows target user
     */
    @GetMapping("/is-following/{targetUserName}")
    public ResponseEntity<Boolean> isFollowing(@PathVariable String targetUserName) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(false);
            }
            
            String email = authentication.getName();
            User currentUser = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            boolean isFollowing = userRelationService.isFollowing(currentUser.getUserName(), targetUserName);
            return ResponseEntity.ok(isFollowing);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(false);
        }
    }
    
    /**
     * Get paginated followers of a user
     */
    @GetMapping("/{userName}/followers")
    public ResponseEntity<PagedModel<UserRelationDTO>> getFollowers(
            @PathVariable String userName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            PagedModel<UserRelationDTO> followers = userRelationService.getFollowers(userName, page, size);
            return ResponseEntity.ok(followers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get paginated following of a user
     */
    @GetMapping("/{userName}/following")
    public ResponseEntity<PagedModel<UserRelationDTO>> getFollowing(
            @PathVariable String userName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            PagedModel<UserRelationDTO> following = userRelationService.getFollowing(userName, page, size);
            return ResponseEntity.ok(following);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get relationship summary for a user
     */
    @GetMapping("/{userName}/summary")
    public ResponseEntity<UserRelationSummaryDTO> getRelationshipSummary(@PathVariable String userName) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserName = null;
            
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                User currentUser = userService.findByUsernameOrEmail(email).orElse(null);
                if (currentUser != null) {
                    currentUserName = currentUser.getUserName();
                }
            }
            
            UserRelationSummaryDTO summary = userRelationService.getRelationshipSummary(userName, currentUserName);
            return ResponseEntity.ok(summary);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get friend suggestions for current user
     */
    @GetMapping("/suggestions")
    public ResponseEntity<List<UserRelationDTO>> getFriendSuggestions(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).build();
            }
            
            String email = authentication.getName();
            User currentUser = userService.findByUsernameOrEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            List<UserRelationDTO> suggestions = userRelationService.getFriendSuggestions(currentUser.getUserName(), limit);
            return ResponseEntity.ok(suggestions);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get follower usernames (for backward compatibility)
     */
    @GetMapping("/{userName}/followers/usernames")
    public ResponseEntity<List<String>> getFollowerUserNames(@PathVariable String userName) {
        try {
            List<String> followers = userRelationService.getFollowerUserNames(userName);
            return ResponseEntity.ok(followers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get following usernames (for backward compatibility)
     */
    @GetMapping("/{userName}/following/usernames")
    public ResponseEntity<List<String>> getFollowingUserNames(@PathVariable String userName) {
        try {
            List<String> following = userRelationService.getFollowingUserNames(userName);
            return ResponseEntity.ok(following);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
