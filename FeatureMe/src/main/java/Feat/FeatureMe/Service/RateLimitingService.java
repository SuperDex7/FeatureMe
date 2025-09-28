package Feat.FeatureMe.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
public class RateLimitingService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String RATE_LIMIT_PREFIX = "rate_limit:";
    private static final String EMAIL_VERIFICATION_PREFIX = "email_verification:";
    
    // Rate limiting configurations
    private static final int GENERAL_API_LIMIT = 100; // requests per minute
    private static final int EMAIL_VERIFICATION_LIMIT = 3; // emails per hour
    private static final int FILE_UPLOAD_LIMIT = 10; // uploads per hour
    private static final int LOGIN_ATTEMPT_LIMIT = 5; // attempts per 15 minutes

    /**
     * Check if request is within rate limit for general API endpoints
     */
    public boolean isWithinRateLimit(String identifier, String endpoint) {
        String key = RATE_LIMIT_PREFIX + endpoint + ":" + identifier;
        return checkRateLimit(key, GENERAL_API_LIMIT, Duration.ofMinutes(1));
    }

    /**
     * Check if email verification request is within rate limit
     */
    public boolean isEmailVerificationWithinLimit(String email) {
        String key = EMAIL_VERIFICATION_PREFIX + email;
        return checkRateLimit(key, EMAIL_VERIFICATION_LIMIT, Duration.ofHours(1));
    }

    /**
     * Check if file upload is within rate limit
     */
    public boolean isFileUploadWithinLimit(String userId) {
        String key = RATE_LIMIT_PREFIX + "file_upload:" + userId;
        return checkRateLimit(key, FILE_UPLOAD_LIMIT, Duration.ofHours(1));
    }

    /**
     * Check if login attempt is within rate limit
     */
    public boolean isLoginAttemptWithinLimit(String identifier) {
        String key = RATE_LIMIT_PREFIX + "login:" + identifier;
        return checkRateLimit(key, LOGIN_ATTEMPT_LIMIT, Duration.ofMinutes(15));
    }

    /**
     * Generic rate limiting check using sliding window algorithm
     */
    private boolean checkRateLimit(String key, int limit, Duration window) {
        try {
            // Get current timestamp
            long now = System.currentTimeMillis();
            long windowStart = now - window.toMillis();

            // Remove expired entries
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);

            // Count current requests in window
            Long currentCount = redisTemplate.opsForZSet().count(key, windowStart, now);

            if (currentCount != null && currentCount >= limit) {
                return false; // Rate limit exceeded
            }

            // Add current request
            redisTemplate.opsForZSet().add(key, now, now);
            redisTemplate.expire(key, window);

            return true;
        } catch (Exception e) {
            // If Redis is unavailable, allow the request (fail open)
            System.err.println("Rate limiting error: " + e.getMessage());
            return true;
        }
    }

    /**
     * Get remaining requests for an identifier
     */
    public int getRemainingRequests(String identifier, String endpoint) {
        String key = RATE_LIMIT_PREFIX + endpoint + ":" + identifier;
        try {
            long now = System.currentTimeMillis();
            long windowStart = now - Duration.ofMinutes(1).toMillis();
            
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);
            Long currentCount = redisTemplate.opsForZSet().count(key, windowStart, now);
            
            return Math.max(0, GENERAL_API_LIMIT - (currentCount != null ? currentCount.intValue() : 0));
        } catch (Exception e) {
            return GENERAL_API_LIMIT; // Return full limit if error
        }
    }

    /**
     * Reset rate limit for an identifier (for testing or admin purposes)
     */
    public void resetRateLimit(String identifier, String endpoint) {
        String key = RATE_LIMIT_PREFIX + endpoint + ":" + identifier;
        redisTemplate.delete(key);
    }

    /**
     * Get rate limit info for monitoring
     */
    public RateLimitInfo getRateLimitInfo(String identifier, String endpoint) {
        String key = RATE_LIMIT_PREFIX + endpoint + ":" + identifier;
        try {
            long now = System.currentTimeMillis();
            long windowStart = now - Duration.ofMinutes(1).toMillis();
            
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);
            Long currentCount = redisTemplate.opsForZSet().count(key, windowStart, now);
            
            int remaining = Math.max(0, GENERAL_API_LIMIT - (currentCount != null ? currentCount.intValue() : 0));
            long resetTime = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            
            return new RateLimitInfo(
                currentCount != null ? currentCount.intValue() : 0,
                remaining,
                resetTime > 0 ? resetTime : 60
            );
        } catch (Exception e) {
            return new RateLimitInfo(0, GENERAL_API_LIMIT, 60);
        }
    }

    /**
     * Rate limit info class
     */
    public static class RateLimitInfo {
        private final int currentRequests;
        private final int remainingRequests;
        private final long resetTimeSeconds;

        public RateLimitInfo(int currentRequests, int remainingRequests, long resetTimeSeconds) {
            this.currentRequests = currentRequests;
            this.remainingRequests = remainingRequests;
            this.resetTimeSeconds = resetTimeSeconds;
        }

        public int getCurrentRequests() { return currentRequests; }
        public int getRemainingRequests() { return remainingRequests; }
        public long getResetTimeSeconds() { return resetTimeSeconds; }
    }
}
