package Feat.FeatureMe.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@DisplayName("AuthUtils.isLoggedIn")
class AuthUtilsTest {

    @Test
    @DisplayName("null authentication is not logged in")
    void nullIsNotLoggedIn() {
        assertFalse(AuthUtils.isLoggedIn(null));
    }

    @Test
    @DisplayName("Spring's anonymous token is not logged in, even though isAuthenticated() is true")
    void anonymousIsNotLoggedIn() {
        AnonymousAuthenticationToken anonymous = new AnonymousAuthenticationToken(
            "key", "anonymousUser", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS")));

        assertTrue(anonymous.isAuthenticated(), "precondition: this is the trap the helper exists for");
        assertFalse(AuthUtils.isLoggedIn(anonymous));
    }

    @Test
    @DisplayName("an unauthenticated token is not logged in")
    void unauthenticatedTokenIsNotLoggedIn() {
        assertFalse(AuthUtils.isLoggedIn(new UsernamePasswordAuthenticationToken("user", "pw")));
    }

    @Test
    @DisplayName("a JWT-authenticated user is logged in")
    void realUserIsLoggedIn() {
        UsernamePasswordAuthenticationToken user = new UsernamePasswordAuthenticationToken(
            "artist@example.com", null, List.of(new SimpleGrantedAuthority("USER")));

        assertTrue(AuthUtils.isLoggedIn(user));
    }
}
