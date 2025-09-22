package Feat.FeatureMe.config;

import Feat.FeatureMe.Service.PasswordResetService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTasks {
    
    private final PasswordResetService passwordResetService;
    
    public ScheduledTasks(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }
    
    /**
     * Clean up expired password reset codes every hour
     * Runs at the top of every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void cleanupExpiredPasswordResetCodes() {
        try {
            passwordResetService.cleanupExpiredCodes();
            System.out.println("Cleaned up expired password reset codes");
        } catch (Exception e) {
            System.err.println("Error cleaning up expired password reset codes: " + e.getMessage());
        }
    }
}
