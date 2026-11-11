package Feat.FeatureMe.config;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;

public final class AuthUtils {

    private AuthUtils() { }

    /**
     * True only for a real, logged-in user.
     *
     * Spring Security puts an AnonymousAuthenticationToken ("anonymousUser") in the
     * context for logged-out requests, and that token's isAuthenticated() returns
     * true, so a plain isAuthenticated() check treats guests as logged in.
     */
    public static boolean isLoggedIn(Authentication authentication) {
        return authentication != null
            && authentication.isAuthenticated()
            && !(authentication instanceof AnonymousAuthenticationToken);
    }
}
