package Feat.FeatureMe.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;

import java.nio.file.Paths;

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
		PutObjectRequest putObjectRequest = PutObjectRequest.builder().bucket(bucketName).key(keyName).build();
		s3Client.putObject(putObjectRequest, RequestBody.fromFile(Paths.get(filePath)));
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
		s3Client.getObject(getObjectRequest, Paths.get(downloadPath));
	}
}