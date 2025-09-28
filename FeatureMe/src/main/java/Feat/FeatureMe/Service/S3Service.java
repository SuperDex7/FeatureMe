package Feat.FeatureMe.Service;

import org.springframework.stereotype.Service;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.nio.file.Path;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.async.AsyncRequestBody;
import software.amazon.awssdk.services.s3.S3AsyncClient;


@Service
public class S3Service
{

	@Autowired
	private S3Client s3Client;
	
	@Autowired
	private S3AsyncClient s3AsyncClient;

	private final String bucketName = "featuremellc";
    private final String region = "us-east-2";
	/**
	 * Uploads a file to the S3 bucket synchronously (for backward compatibility).
	 * @deprecated Use uploadFileAsync for better performance
	 */
	@Deprecated
	public String uploadFile(String keyName, String filePath)
	{
		// Detect content type from file extension
		String contentType = getContentType(keyName);
		
		PutObjectRequest putObjectRequest = PutObjectRequest.builder()
			.bucket(bucketName)
			.key(keyName)
			.contentType(contentType)
			.build();
			
		s3Client.putObject(putObjectRequest, RequestBody.fromFile(Path.of(filePath)));
        String encodedKeyName = keyName.replace(" ", "+");
        String s3Url = "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + encodedKeyName;
        return s3Url;
	}
	
	/**
	 * Uploads a file to the S3 bucket asynchronously to prevent thread pool exhaustion.
	 * Returns a CompletableFuture with the S3 URL.
	 */
	@Async
	public CompletableFuture<String> uploadFileAsync(String keyName, String filePath)
	{
		try {
			// Detect content type from file extension
			String contentType = getContentType(keyName);
			
			PutObjectRequest putObjectRequest = PutObjectRequest.builder()
				.bucket(bucketName)
				.key(keyName)
				.contentType(contentType)
				.build();
				
			// Use async client for non-blocking operation
			return s3AsyncClient.putObject(putObjectRequest, AsyncRequestBody.fromFile(Path.of(filePath)))
				.thenApply(response -> {
					String encodedKeyName = keyName.replace(" ", "+");
					return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + encodedKeyName;
				})
				.exceptionally(throwable -> {
					throw new RuntimeException("Failed to upload file to S3: " + throwable.getMessage(), throwable);
				});
		} catch (Exception e) {
			return CompletableFuture.failedFuture(new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e));
		}
	}
	
	/**
	 * Uploads file content asynchronously from byte array.
	 */
	@Async
	public CompletableFuture<String> uploadFileAsync(String keyName, byte[] fileContent)
	{
		try {
			// Detect content type from file extension
			String contentType = getContentType(keyName);
			
			PutObjectRequest putObjectRequest = PutObjectRequest.builder()
				.bucket(bucketName)
				.key(keyName)
				.contentType(contentType)
				.build();
				
			// Use async client for non-blocking operation
			return s3AsyncClient.putObject(putObjectRequest, AsyncRequestBody.fromBytes(fileContent))
				.thenApply(response -> {
					String encodedKeyName = keyName.replace(" ", "+");
					return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + encodedKeyName;
				})
				.exceptionally(throwable -> {
					throw new RuntimeException("Failed to upload file to S3: " + throwable.getMessage(), throwable);
				});
		} catch (Exception e) {
			return CompletableFuture.failedFuture(new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e));
		}
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