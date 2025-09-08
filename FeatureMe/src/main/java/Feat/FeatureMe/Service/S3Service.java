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
	
	/**
	 * Deletes a file from the S3 bucket
	 * @param keyName The S3 object key to delete
	 * @return true if deletion was successful, false otherwise
	 */
	public boolean deleteFile(String keyName) {
		try {
			software.amazon.awssdk.services.s3.model.DeleteObjectRequest deleteObjectRequest = 
				software.amazon.awssdk.services.s3.model.DeleteObjectRequest.builder()
					.bucket(bucketName)
					.key(keyName)
					.build();
					
			s3Client.deleteObject(deleteObjectRequest);
			return true;
		} catch (Exception e) {
			System.err.println("Error deleting file from S3: " + e.getMessage());
			return false;
		}
	}
	
	/**
	 * Extracts the S3 key from a full S3 URL and decodes it properly
	 * @param s3Url Full S3 URL
	 * @return S3 key (filename) with proper decoding
	 */
	public String extractKeyFromUrl(String s3Url) {
		if (s3Url == null || !s3Url.contains(bucketName)) {
			return s3Url; // Return as-is if not an S3 URL
		}
		
		String baseUrl = "https://" + bucketName + ".s3." + region + ".amazonaws.com/";
		if (s3Url.startsWith(baseUrl)) {
			String encodedKey = s3Url.substring(baseUrl.length());
			// Decode the URL-encoded key back to the original filename
			// Replace + with spaces and handle other URL encoding
			String decodedKey = encodedKey.replace("+", " ");
			try {
				// Use URLDecoder for proper URL decoding
				decodedKey = java.net.URLDecoder.decode(encodedKey, "UTF-8");
			} catch (Exception e) {
				// Fallback to simple replacement if URLDecoder fails
				decodedKey = encodedKey.replace("+", " ");
			}
			return decodedKey;
		}
		return s3Url;
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