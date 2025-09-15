package Feat.FeatureMe.Dto;

import java.util.List;

public record CreateChatRequest(
    String chatname,
    List<String> users
) {}


