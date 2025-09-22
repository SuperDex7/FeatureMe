package Feat.FeatureMe.Entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "password_reset_codes")
public class PasswordResetCode {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String code;
    
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean used;
    private int attemptCount;

    public PasswordResetCode() {}

    public PasswordResetCode(String code, String email, LocalDateTime expiresAt) {
        this.code = code;
        this.email = email;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = expiresAt;
        this.used = false;
        this.attemptCount = 0;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }

    public int getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(int attemptCount) {
        this.attemptCount = attemptCount;
    }

    public void incrementAttemptCount() {
        this.attemptCount++;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
