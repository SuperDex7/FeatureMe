package Feat.FeatureMe.config;

import java.util.TimeZone;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.cfg.DateTimeFeature;

@Configuration
public class TimezoneConfig {

    @PostConstruct
    public void init() {
        // Set the default timezone to UTC for the entire JVM
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    /**
     * JSON settings for API requests/responses (Spring Boot 4 uses Jackson 3 here):
     * dates as ISO-8601 text in UTC rather than numeric timestamps.
     *
     * Request bodies with unknown fields are rejected (400), matching the behavior of
     * the custom ObjectMapper this app used before Spring Boot 4. Boot's own default
     * would silently ignore them.
     */
    @Bean
    public JsonMapperBuilderCustomizer utcDateCustomizer() {
        return builder -> builder
            .disable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS)
            .disable(DateTimeFeature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE)
            .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .defaultTimeZone(TimeZone.getTimeZone("UTC"));
    }
}
