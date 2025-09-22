package Feat.FeatureMe.Service;

import Feat.FeatureMe.Entity.PasswordResetCode;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PasswordResetCodeRepository;
import Feat.FeatureMe.Repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {
    
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    // Rate limiting: max 3 attempts per email per hour
    private static final int MAX_ATTEMPTS_PER_HOUR = 3;
    private static final int CODE_EXPIRY_MINUTES = 15;
    private static final int MAX_ATTEMPT_COUNT = 3;
    
    public PasswordResetService(PasswordResetCodeRepository passwordResetCodeRepository, 
                              UserRepository userRepository, 
                              PasswordEncoder passwordEncoder) {
        this.passwordResetCodeRepository = passwordResetCodeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    /**
     * Generate and send password reset code
     */
    public String generateResetCode(String email) {
        // Check if user exists
        if (!userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("No account found with this email address");
        }
        
        // Check rate limiting
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentAttempts = passwordResetCodeRepository.countByEmailAndCreatedAtAfter(email, oneHourAgo);
        
        if (recentAttempts >= MAX_ATTEMPTS_PER_HOUR) {
            throw new IllegalArgumentException("Too many reset attempts. Please try again in an hour.");
        }
        
        // Invalidate any existing unused codes for this email
        passwordResetCodeRepository.deleteByEmail(email);
        
        // Generate new code
        String code = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 8).toUpperCase();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES);
        
        // Save reset code
        PasswordResetCode resetCode = new PasswordResetCode(code, email, expiresAt);
        passwordResetCodeRepository.save(resetCode);
        
        return code;
    }
    
    /**
     * Verify reset code
     */
    public boolean verifyResetCode(String email, String code) {
        Optional<PasswordResetCode> resetCodeOpt = passwordResetCodeRepository
            .findByCodeAndEmailAndUsedFalse(code, email);
        
        if (resetCodeOpt.isEmpty()) {
            return false;
        }
        
        PasswordResetCode resetCode = resetCodeOpt.get();
        
        // Check if code is expired
        if (resetCode.isExpired()) {
            passwordResetCodeRepository.delete(resetCode);
            return false;
        }
        
        // Increment attempt count
        resetCode.incrementAttemptCount();
        
        // Check if too many attempts
        if (resetCode.getAttemptCount() > MAX_ATTEMPT_COUNT) {
            passwordResetCodeRepository.delete(resetCode);
            return false;
        }
        
        passwordResetCodeRepository.save(resetCode);
        return true;
    }
    
    /**
     * Reset password with code
     */
    public boolean resetPassword(String email, String code, String newPassword) {
        Optional<PasswordResetCode> resetCodeOpt = passwordResetCodeRepository
            .findByCodeAndEmailAndUsedFalse(code, email);
        
        if (resetCodeOpt.isEmpty()) {
            return false;
        }
        
        PasswordResetCode resetCode = resetCodeOpt.get();
        
        // Check if code is expired
        if (resetCode.isExpired()) {
            passwordResetCodeRepository.delete(resetCode);
            return false;
        }
        
        // Check if too many attempts
        if (resetCode.getAttemptCount() > MAX_ATTEMPT_COUNT) {
            passwordResetCodeRepository.delete(resetCode);
            return false;
        }
        
        // Validate new password
        if (newPassword == null || newPassword.length() < 6) {
            return false;
        }
        
        // Find user and update password
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }
        
        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Mark code as used and delete it
        resetCode.setUsed(true);
        passwordResetCodeRepository.delete(resetCode);
        
        return true;
    }
    
    /**
     * Clean up expired codes (can be called by a scheduled task)
     */
    public void cleanupExpiredCodes() {
        passwordResetCodeRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}
