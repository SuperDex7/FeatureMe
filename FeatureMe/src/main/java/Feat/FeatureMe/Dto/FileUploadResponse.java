package Feat.FeatureMe.Dto;

public record FileUploadResponse(
    String fileUrl,
    String fileName,
    long fileSize,
    String fileType
) {}
