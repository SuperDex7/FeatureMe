package Feat.FeatureMe.Entity;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Signup email check for one address. Holds a hash of the emailed code until
 * it's entered, then a hash of the one-time token that /auth/create requires.
 * Plain codes and tokens are never stored.
 */
@Document(collection = "email_verifications")
public class EmailVerification {

    @Id
    private String id;

    /** Lowercased, trimmed address. */
    @Indexed(unique = true)
    private String email;

    private String codeHash;
    private Instant codeExpiresAt;
    private int failedAttempts;

    private Instant lastSentAt;
    private Instant sendWindowStart;
    private int sendsInWindow;

    private String tokenHash;
    private Instant tokenExpiresAt;

    /** Mongo removes the record after this time (TTL index). */
    @Indexed(expireAfter = "0s")
    private Instant deleteAt;

    public EmailVerification() { }

    public EmailVerification(String email) {
        this.email = email;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String codeHash) { this.codeHash = codeHash; }

    public Instant getCodeExpiresAt() { return codeExpiresAt; }
    public void setCodeExpiresAt(Instant codeExpiresAt) { this.codeExpiresAt = codeExpiresAt; }

    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }

    public Instant getLastSentAt() { return lastSentAt; }
    public void setLastSentAt(Instant lastSentAt) { this.lastSentAt = lastSentAt; }

    public Instant getSendWindowStart() { return sendWindowStart; }
    public void setSendWindowStart(Instant sendWindowStart) { this.sendWindowStart = sendWindowStart; }

    public int getSendsInWindow() { return sendsInWindow; }
    public void setSendsInWindow(int sendsInWindow) { this.sendsInWindow = sendsInWindow; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public Instant getTokenExpiresAt() { return tokenExpiresAt; }
    public void setTokenExpiresAt(Instant tokenExpiresAt) { this.tokenExpiresAt = tokenExpiresAt; }

    public Instant getDeleteAt() { return deleteAt; }
    public void setDeleteAt(Instant deleteAt) { this.deleteAt = deleteAt; }
}
