package Feat.FeatureMe.Dto;

import java.util.List;

/**
 * A user's profile as other people see it.
 *
 * Deliberately leaves out private fields that UserDTO carries for the owner's own
 * /api/user/me response: chats, notifications, liked posts, purchases and comment history.
 */
public record PublicUserDTO(
    String id,
    String userName,
    String profilePic,
    String banner,
    String role,
    String bio,
    String about,
    List<String> demo,
    String location,
    List<String> socialMedia,
    List<String> badges,
    List<String> featuredOn,
    List<String> posts,
    int followersCount,
    int followingCount
) {

    public static PublicUserDTO from(UserDTO user) {
        if (user == null) {
            return null;
        }
        return new PublicUserDTO(
            user.id(),
            user.userName(),
            user.profilePic(),
            user.banner(),
            user.role(),
            user.bio(),
            user.about(),
            user.demo(),
            user.location(),
            user.socialMedia(),
            user.badges(),
            user.featuredOn(),
            user.posts(),
            user.followersCount(),
            user.followingCount()
        );
    }
}
