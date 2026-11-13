package Feat.FeatureMe.Service;

import Feat.FeatureMe.Entity.PasswordResetCode;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PasswordResetCodeRepository;
import Feat.FeatureMe.Repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Locale;
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
    private static final int MAX_ATTEMPT_COUNT = 5; // wrong guesses per code
    
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
        return checkCode(email, code).isPresent();
    }

    /**
     * Finds the email's current code and checks the guess against it. Every
     * wrong guess counts; after MAX_ATTEMPT_COUNT the code is deleted, so codes
     * can't be guessed by trying many values.
     */
    private Optional<PasswordResetCode> checkCode(String email, String code) {
        if (email == null || code == null) {
            return Optional.empty();
        }
        Optional<PasswordResetCode> current = passwordResetCodeRepository
            .findByEmailAndUsedFalseOrderByCreatedAtDesc(email).stream().findFirst();
        if (current.isEmpty()) {
            return Optional.empty();
        }

        PasswordResetCode resetCode = current.get();
        if (resetCode.isExpired() || resetCode.getAttemptCount() >= MAX_ATTEMPT_COUNT) {
            passwordResetCodeRepository.delete(resetCode);
            return Optional.empty();
        }

        boolean matches = MessageDigest.isEqual(
            resetCode.getCode().getBytes(StandardCharsets.UTF_8),
            code.trim().toUpperCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8));
        if (!matches) {
            resetCode.incrementAttemptCount();
            if (resetCode.getAttemptCount() >= MAX_ATTEMPT_COUNT) {
                passwordResetCodeRepository.delete(resetCode);
            } else {
                passwordResetCodeRepository.save(resetCode);
            }
            return Optional.empty();
        }
        return Optional.of(resetCode);
    }
    
    /**
     * Reset password with code
     */
    public boolean resetPassword(String email, String code, String newPassword) {
        Optional<PasswordResetCode> resetCodeOpt = checkCode(email, code);
        if (resetCodeOpt.isEmpty()) {
            return false;
        }
        PasswordResetCode resetCode = resetCodeOpt.get();
        
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
