package Feat.FeatureMe.Service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import Feat.FeatureMe.Entity.PasswordResetCode;
import Feat.FeatureMe.Entity.User;
import Feat.FeatureMe.Repository.PasswordResetCodeRepository;
import Feat.FeatureMe.Repository.UserRepository;

@DisplayName("PasswordResetService")
class PasswordResetServiceTest {

    private static final String EMAIL = "alice@example.com";

    private final List<PasswordResetCode> codes = new ArrayList<>();
    private final User alice = new User();
    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        PasswordResetCodeRepository codeRepository = mock(PasswordResetCodeRepository.class);
        when(codeRepository.findByEmailAndUsedFalseOrderByCreatedAtDesc(anyString()))
            .thenAnswer(inv -> codes.stream().filter(c -> c.getEmail().equals(inv.getArgument(0)) && !c.isUsed()).toList());
        when(codeRepository.save(any())).thenAnswer(inv -> {
            PasswordResetCode code = inv.getArgument(0);
            if (!codes.contains(code)) codes.add(code);
            return code;
        });
        doAnswer(inv -> codes.remove(inv.<PasswordResetCode>getArgument(0))).when(codeRepository).delete(any());
        doAnswer(inv -> codes.removeIf(c -> c.getEmail().equals(inv.getArgument(0)))).when(codeRepository).deleteByEmail(anyString());

        UserRepository userRepository = mock(UserRepository.class);
        alice.setEmail(EMAIL);
        alice.setPassword("old-hash");
        when(userRepository.existsByEmail(EMAIL)).thenReturn(true);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(alice));

        service = new PasswordResetService(codeRepository, userRepository, new BCryptPasswordEncoder(4));
    }

    private static String wrong(String code) {
        return code.equals("AAAAAAAA") ? "BBBBBBBB" : "AAAAAAAA";
    }

    @Test
    @DisplayName("the right code works, typed in any case")
    void rightCodeWorks() {
        String code = service.generateResetCode(EMAIL);

        assertThat(service.verifyResetCode(EMAIL, code.toLowerCase())).isTrue();
        assertThat(service.resetPassword(EMAIL, code, "newpass1")).isTrue();
        assertThat(alice.getPassword()).isNotEqualTo("old-hash");
        assertThat(codes).isEmpty();
    }

    @Test
    @DisplayName("wrong guesses count, and five of them kill the code")
    void wrongGuessesKillCode() {
        String code = service.generateResetCode(EMAIL);

        for (int i = 0; i < 4; i++) {
            assertThat(service.verifyResetCode(EMAIL, wrong(code))).isFalse();
        }
        assertThat(service.verifyResetCode(EMAIL, code)).as("still usable after 4 misses").isTrue();

        for (int i = 0; i < 5; i++) {
            service.verifyResetCode(EMAIL, wrong(code));
        }
        assertThat(service.verifyResetCode(EMAIL, code)).isFalse();
        assertThat(service.resetPassword(EMAIL, code, "newpass1")).isFalse();
        assertThat(alice.getPassword()).isEqualTo("old-hash");
    }

    @Test
    @DisplayName("a code only works for the email it was sent to")
    void codeTiedToEmail() {
        String code = service.generateResetCode(EMAIL);
        assertThat(service.verifyResetCode("mallory@example.com", code)).isFalse();
        assertThat(service.verifyResetCode(EMAIL, null)).isFalse();
    }
}
