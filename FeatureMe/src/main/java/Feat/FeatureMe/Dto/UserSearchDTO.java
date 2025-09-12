package Feat.FeatureMe.Dto;

import java.util.List;

public record UserSearchDTO(
    String id,
    String userName,
    String profilePic,
    String banner,
    String bio,
    String location,
    String role,
    List<String> badges,
    List<String> demo,
    List<String> socialMedia,
    int followersCount,
    int followingCount,
    int postsCount
) {
    
}
