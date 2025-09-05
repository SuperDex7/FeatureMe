package Feat.FeatureMe.Dto;

import java.util.List;

public record UserRelationSummaryDTO(
    long followersCount,
    long followingCount,
    boolean isFollowing,        // Does current user follow this profile?
    boolean isFollowedBy,       // Does this profile follow current user?
    List<String> mutualFollowers, // Mutual connections (usernames only for performance)
    List<UserRelationDTO> recentFollowers  // Recent followers with full info
) {
}
