package Feat.FeatureMe.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3AsyncClient;

@Configuration
public class AwsConfig {
    @Value("${spring.cloud.aws.credentials.access-key}")
    private String accessKeyId;

    @Value("${spring.cloud.aws.credentials.secret-key}")
    private String secretKey;

    @Value("${spring.cloud.aws.region.static}")
    private String region;


    @Bean
    S3Client s3Client(){
		AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKeyId, secretKey);
		return S3Client.builder().region(Region.of(region))
				.credentialsProvider(StaticCredentialsProvider.create(awsCreds)).build();
	}
	
	@Bean
	S3AsyncClient s3AsyncClient(){
		AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKeyId, secretKey);
		return S3AsyncClient.builder().region(Region.of(region))
				.credentialsProvider(StaticCredentialsProvider.create(awsCreds)).build();
	}
}