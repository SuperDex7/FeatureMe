package Feat.FeatureMe.Service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import Feat.FeatureMe.Entity.EmailVerification;
import Feat.FeatureMe.Repository.EmailVerificationRepository;

@DisplayName("EmailVerificationService")
class EmailVerificationServiceTest {

    private final Map<String, EmailVerification> store = new HashMap<>();
    private Instant now = Instant.parse("2026-11-13T12:00:00Z");
    private EmailVerificationService service;

    @BeforeEach
    void setUp() {
        EmailVerificationRepository repository = mock(EmailVerificationRepository.class);
        when(repository.findByEmail(anyString())).thenAnswer(inv -> Optional.ofNullable(store.get(inv.<String>getArgument(0))));
        when(repository.save(any())).thenAnswer(inv -> {
            EmailVerification record = inv.getArgument(0);
            store.put(record.getEmail(), record);
            return record;
        });
        doAnswer(inv -> store.remove(inv.<String>getArgument(0))).when(repository).deleteByEmail(anyString());

        service = new EmailVerificationService(repository, new BCryptPasswordEncoder(4));
        tick(Duration.ZERO);
    }

    private void tick(Duration by) {
        now = now.plus(by);
        service.setClock(Clock.fixed(now, ZoneOffset.UTC));
    }

    private static String wrong(String code) {
        return code.equals("000000") ? "111111" : "000000";
    }

    @Test
    @DisplayName("issues a 6-digit code and stores only its hash")
    void storesOnlyHash() {
        String code = service.issueCode("New@Example.com ");

        assertThat(code).matches("\\d{6}");
        EmailVerification record = store.get("new@example.com");
        assertThat(record).isNotNull();
        assertThat(record.getCodeHash()).isNotBlank().doesNotContain(code);
        assertThat(record.getTokenHash()).isNull();
    }

    @Test
    @DisplayName("the right code gives a token that proves the email, whatever its case")
    void rightCodeGivesToken() {
        String code = service.issueCode("new@example.com");
        String token = service.verifyCode("NEW@example.com", code);

        assertThat(token).hasSizeGreaterThan(30);
        assertThat(store.get("new@example.com").getTokenHash()).doesNotContain(token);
        assertThat(service.isVerified("New@Example.com", token)).isTrue();
        assertThat(service.isVerified("new@example.com", token + "x")).isFalse();
        assertThat(service.isVerified("other@example.com", token)).isFalse();
        assertThat(service.isVerified("new@example.com", null)).isFalse();
    }

    @Test
    @DisplayName("a code can't be used twice")
    void codeIsSingleUse() {
        String code = service.issueCode("new@example.com");
        service.verifyCode("new@example.com", code);

        assertThatThrownBy(() -> service.verifyCode("new@example.com", code))
            .isInstanceOf(EmailVerificationException.class);
    }

    @Test
    @DisplayName("five wrong guesses lock the code, even against the right one")
    void wrongGuessesLockCode() {
        String code = service.issueCode("new@example.com");

        for (int i = 1; i <= 4; i++) {
            assertThatThrownBy(() -> service.verifyCode("new@example.com", wrong(code)))
                .isInstanceOfSatisfying(EmailVerificationException.class,
                    e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        }
        assertThatThrownBy(() -> service.verifyCode("new@example.com", wrong(code)))
            .isInstanceOfSatisfying(EmailVerificationException.class,
                e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        assertThatThrownBy(() -> service.verifyCode("new@example.com", code))
            .isInstanceOfSatisfying(EmailVerificationException.class,
                e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
    }

    @Test
    @DisplayName("codes expire after 15 minutes")
    void codeExpires() {
        String code = service.issueCode("new@example.com");
        tick(Duration.ofMinutes(15).plusSeconds(1));

        assertThatThrownBy(() -> service.verifyCode("new@example.com", code))
            .isInstanceOf(EmailVerificationException.class)
            .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("resending waits 30 seconds and replaces the old code")
    void resendCooldownAndReplace() {
        String first = service.issueCode("new@example.com");
        assertThatThrownBy(() -> service.issueCode("new@example.com"))
            .isInstanceOfSatisfying(EmailVerificationException.class,
                e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));

        tick(Duration.ofSeconds(31));
        String second = service.issueCode("new@example.com");

        if (!first.equals(second)) {
            assertThatThrownBy(() -> service.verifyCode("new@example.com", first))
                .isInstanceOf(EmailVerificationException.class);
        }
        assertThat(service.verifyCode("new@example.com", second)).isNotBlank();
    }

    @Test
    @DisplayName("at most five codes an hour per email")
    void sendLimit() {
        for (int i = 0; i < 5; i++) {
            service.issueCode("new@example.com");
            tick(Duration.ofSeconds(31));
        }
        assertThatThrownBy(() -> service.issueCode("new@example.com"))
            .isInstanceOfSatisfying(EmailVerificationException.class,
                e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));

        tick(Duration.ofHours(1));
        assertThat(service.issueCode("new@example.com")).matches("\\d{6}");
    }

    @Test
    @DisplayName("the token expires after 30 minutes and is gone once used")
    void tokenExpiresAndIsConsumed() {
        String token = service.verifyCode("new@example.com", service.issueCode("new@example.com"));
        tick(Duration.ofMinutes(29));
        assertThat(service.isVerified("new@example.com", token)).isTrue();

        service.consume("NEW@example.com");
        assertThat(service.isVerified("new@example.com", token)).isFalse();

        String token2;
        tick(Duration.ofSeconds(31));
        token2 = service.verifyCode("new@example.com", service.issueCode("new@example.com"));
        tick(Duration.ofMinutes(31));
        assertThat(service.isVerified("new@example.com", token2)).isFalse();
    }
}
