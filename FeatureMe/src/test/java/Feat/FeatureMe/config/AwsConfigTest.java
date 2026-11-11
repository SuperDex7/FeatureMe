package Feat.FeatureMe.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import io.awspring.cloud.autoconfigure.core.AwsAutoConfiguration;
import io.awspring.cloud.autoconfigure.core.CredentialsProviderAutoConfiguration;
import io.awspring.cloud.autoconfigure.core.RegionProviderAutoConfiguration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * Starts AwsConfig together with Spring Cloud AWS's core auto-configuration, as the app
 * does at boot, and builds the S3 clients. No AWS calls are made.
 *
 * Guards dependency upgrades: a mismatch between the AWS SDK and Spring Cloud AWS
 * versions shows up here instead of when the server starts in production.
 */
@DisplayName("AWS configuration")
class AwsConfigTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
        .withConfiguration(AutoConfigurations.of(
            AwsAutoConfiguration.class,
            CredentialsProviderAutoConfiguration.class,
            RegionProviderAutoConfiguration.class))
        .withUserConfiguration(AwsConfig.class)
        .withPropertyValues(
            "spring.cloud.aws.credentials.access-key=test-access-key",
            "spring.cloud.aws.credentials.secret-key=test-secret-key",
            "spring.cloud.aws.region.static=us-east-1");

    @Test
    @DisplayName("builds sync and async S3 clients for the configured region")
    void buildsS3Clients() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(S3Client.class);
            assertThat(context).hasSingleBean(S3AsyncClient.class);
            assertThat(context.getBean(S3Client.class).serviceClientConfiguration().region())
                .isEqualTo(Region.US_EAST_1);
        });
    }
}
