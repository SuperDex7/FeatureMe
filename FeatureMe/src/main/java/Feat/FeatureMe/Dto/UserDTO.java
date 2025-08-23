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
        List<String> friends,
        List<String> followers,
        List<String> following,
        List<PostsDTO> posts
) {

}
