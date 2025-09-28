package Feat.FeatureMe.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.UserRepository;

import java.util.concurrent.TimeUnit;

@Service
public class CachedUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String USER_CACHE_PREFIX = "user_details:";
    private static final long CACHE_EXPIRY_MINUTES = 15; // Cache user details for 15 minutes

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try to get from cache first
        String cacheKey = USER_CACHE_PREFIX + username;
        UserDetails cachedUserDetails = (UserDetails) redisTemplate.opsForValue().get(cacheKey);
        
        if (cachedUserDetails != null) {
            return cachedUserDetails;
        }

        // If not in cache, fetch from database
        User user = userRepository.findByUserName(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // Create UserDetails object
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
            .username(user.getUserName())
            .password(user.getPassword())
            .authorities(user.getRole())
            .build();

        // Cache the user details
        redisTemplate.opsForValue().set(cacheKey, userDetails, CACHE_EXPIRY_MINUTES, TimeUnit.MINUTES);

        return userDetails;
    }

    /**
     * Invalidate user cache when user data changes
     */
    public void invalidateUserCache(String username) {
        String cacheKey = USER_CACHE_PREFIX + username;
        redisTemplate.delete(cacheKey);
    }

    /**
     * Invalidate all user caches (for admin purposes)
     */
    public void invalidateAllUserCaches() {
        redisTemplate.delete(redisTemplate.keys(USER_CACHE_PREFIX + "*"));
    }

    /**
     * Preload user details into cache
     */
    public void preloadUserDetails(String username) {
        try {
            loadUserByUsername(username);
        } catch (UsernameNotFoundException e) {
            // User doesn't exist, don't cache
        }
    }
}
