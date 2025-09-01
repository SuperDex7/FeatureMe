package Feat.FeatureMe.Dto;

import java.util.List;

public record UserDTO(
        String id,
        String userName,
        String profilePic,
        String banner,
        String bio,
        String about,
        String demo,
        String location,
        List<String> socialMedia,
        List<String> badges,
        List<String> friends,
        List<String> followers,
        List<String> following,
        List<String> featuredOn,
        List<String> posts,
        List<String> likedPosts,
        List<CommentedOnDTO> comments,
        List<NotificationsDTO> notifications
        
) {

}
