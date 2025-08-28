package Feat.FeatureMe.Service;

import org.springframework.stereotype.Service;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.nio.file.Path;


import org.springframework.beans.factory.annotation.Autowired;

import software.amazon.awssdk.core.sync.RequestBody;


@Service
public class S3Service
{

	@Autowired
	private S3Client s3Client;

	private final String bucketName = "featuremellc";
    private final String region = "us-east-2";
	/**
	 * Uploads a file to the S3 bucket.
	 */
	public String uploadFile(String keyName, String filePath)
	{
		// Detect content type from file extension
		String contentType = getContentType(keyName);
		
		PutObjectRequest putObjectRequest = PutObjectRequest.builder()
			.bucket(bucketName)
			.key(keyName)
			.contentType(contentType)  // This is the only new line!
			.build();
			
		s3Client.putObject(putObjectRequest, RequestBody.fromFile(Path.of(filePath)));
        String encodedKeyName = keyName.replace(" ", "+");
        String s3Url = "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + encodedKeyName;
        return s3Url;
	}

	/**
	 * Downloads a file from the S3 bucket
	 */
	public void downloadFile(String keyName, String downloadPath)
	{
		GetObjectRequest getObjectRequest = GetObjectRequest.builder().bucket(bucketName).key(keyName).build();
		s3Client.getObject(getObjectRequest, Path.of(downloadPath));
	}
	
	// Simple helper method to detect content type
	private String getContentType(String fileName) {
		if (fileName == null) return "application/octet-stream";
		
		String extension = fileName.toLowerCase();
		if (extension.endsWith(".mp3")) return "audio/mpeg";
		if (extension.endsWith(".wav")) return "audio/wav";
		if (extension.endsWith(".ogg")) return "audio/ogg";
		if (extension.endsWith(".m4a")) return "audio/mp4";
		if (extension.endsWith(".flac")) return "audio/flac";
		if (extension.endsWith(".aac")) return "audio/aac";
		if (extension.endsWith(".jpg") || extension.endsWith(".jpeg")) return "image/jpeg";
		if (extension.endsWith(".png")) return "image/png";
		if (extension.endsWith(".gif")) return "image/gif";
		if (extension.endsWith(".pdf")) return "application/pdf";
		
		return "application/octet-stream";
	}
}