package Feat.FeatureMe.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import Feat.FeatureMe.Entity.EmailVerification;
import Feat.FeatureMe.Repository.EmailVerificationRepository;

/**
 * Proves a new user owns their email before /auth/create will make the account.
 *
 * 1. issueCode: a 6-digit code is emailed; only its hash is stored.
 * 2. verifyCode: the right code (within 5 tries and 15 minutes) is swapped for
 *    a random one-time token, again stored only as a hash.
 * 3. isVerified / consume: /auth/create checks the token, then deletes the record.
 */
@Service
public class EmailVerificationService {

    static final Duration CODE_TTL = Duration.ofMinutes(15);
    static final Duration TOKEN_TTL = Duration.ofMinutes(30);
    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(30);
    static final Duration SEND_WINDOW = Duration.ofHours(1);
    static final int MAX_SENDS_PER_WINDOW = 5;
    static final int MAX_FAILED_ATTEMPTS = 5;

    private final EmailVerificationRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();
    private Clock clock = Clock.systemUTC();

    public EmailVerificationService(EmailVerificationRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    /** For tests. */
    void setClock(Clock clock) {
        this.clock = clock;
    }

    public static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    /** Makes a new code for this address and returns it so it can be emailed. Earlier codes stop working. */
    public String issueCode(String rawEmail) {
        String email = normalize(rawEmail);
        Instant now = clock.instant();
        EmailVerification record = repository.findByEmail(email).orElseGet(() -> new EmailVerification(email));

        if (record.getLastSentAt() != null && record.getLastSentAt().plus(RESEND_COOLDOWN).isAfter(now)) {
            throw new EmailVerificationException(HttpStatus.TOO_MANY_REQUESTS, "Wait a few seconds before asking for another code.");
        }
        if (record.getSendWindowStart() == null || !record.getSendWindowStart().plus(SEND_WINDOW).isAfter(now)) {
            record.setSendWindowStart(now);
            record.setSendsInWindow(0);
        }
        if (record.getSendsInWindow() >= MAX_SENDS_PER_WINDOW) {
            throw new EmailVerificationException(HttpStatus.TOO_MANY_REQUESTS, "Too many codes requested for this email. Try again in an hour.");
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        record.setCodeHash(passwordEncoder.encode(code));
        record.setCodeExpiresAt(now.plus(CODE_TTL));
        record.setFailedAttempts(0);
        record.setLastSentAt(now);
        record.setSendsInWindow(record.getSendsInWindow() + 1);
        record.setTokenHash(null);
        record.setTokenExpiresAt(null);
        record.setDeleteAt(now.plus(SEND_WINDOW).plus(CODE_TTL));
        repository.save(record);
        return code;
    }

    /** Checks the emailed code and, if it's right, returns the token that account creation needs. */
    public String verifyCode(String rawEmail, String rawCode) {
        String email = normalize(rawEmail);
        Instant now = clock.instant();
        EmailVerification record = repository.findByEmail(email)
            .filter(r -> r.getCodeHash() != null)
            .orElseThrow(() -> new EmailVerificationException(HttpStatus.BAD_REQUEST, "That code is wrong or has expired. Ask for a new one."));

        if (record.getCodeExpiresAt() == null || !record.getCodeExpiresAt().isAfter(now)) {
            throw new EmailVerificationException(HttpStatus.BAD_REQUEST, "That code has expired. Ask for a new one.");
        }
        if (record.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
            throw new EmailVerificationException(HttpStatus.TOO_MANY_REQUESTS, "Too many wrong tries. Ask for a new code.");
        }

        String code = rawCode == null ? "" : rawCode.replaceAll("\\s", "");
        if (!passwordEncoder.matches(code, record.getCodeHash())) {
            record.setFailedAttempts(record.getFailedAttempts() + 1);
            repository.save(record);
            int left = MAX_FAILED_ATTEMPTS - record.getFailedAttempts();
            if (left <= 0) {
                throw new EmailVerificationException(HttpStatus.TOO_MANY_REQUESTS, "Too many wrong tries. Ask for a new code.");
            }
            throw new EmailVerificationException(HttpStatus.BAD_REQUEST,
                "That code doesn't match. " + left + (left == 1 ? " try" : " tries") + " left.");
        }

        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        record.setCodeHash(null);
        record.setCodeExpiresAt(null);
        record.setTokenHash(sha256(token));
        record.setTokenExpiresAt(now.plus(TOKEN_TTL));
        record.setDeleteAt(now.plus(TOKEN_TTL));
        repository.save(record);
        return token;
    }

    /** True if this token proves the address was verified recently. */
    public boolean isVerified(String rawEmail, String token) {
        if (token == null || token.isBlank()) return false;
        Instant now = clock.instant();
        return repository.findByEmail(normalize(rawEmail))
            .filter(r -> r.getTokenHash() != null && r.getTokenExpiresAt() != null && r.getTokenExpiresAt().isAfter(now))
            .map(r -> MessageDigest.isEqual(
                r.getTokenHash().getBytes(StandardCharsets.UTF_8),
                sha256(token).getBytes(StandardCharsets.UTF_8)))
            .orElse(false);
    }

    /** Uses up the verification once the account exists. */
    public void consume(String rawEmail) {
        repository.deleteByEmail(normalize(rawEmail));
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
