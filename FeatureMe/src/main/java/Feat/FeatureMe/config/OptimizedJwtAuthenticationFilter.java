package Feat.FeatureMe.config;

import java.io.IOException;
import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import Feat.FeatureMe.Controller.UserController;
import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Logs the request in from the JWT (Authorization header for mobile, the
 * sessionToken cookie for web).
 *
 * A token that has expired or can't be trusted doesn't block the request: it
 * carries on as a logged-out visitor, so public pages keep working, and the
 * stale cookie is cleared. If the page needed a login, the 401 from
 * SecurityConfig's entry point says why ({"code":"TOKEN_EXPIRED"}, ...),
 * which is the only thing clients treat as "your session ended".
 *
 * Registered only inside the security filter chain (see SecurityConfig), not
 * as a plain servlet filter as well.
 */
public class OptimizedJwtAuthenticationFilter extends OncePerRequestFilter {

    /** Request attribute read by the 401 entry point */
    public static final String AUTH_ERROR = "featureme.authError";
    public static final String TOKEN_EXPIRED = "TOKEN_EXPIRED";
    public static final String TOKEN_INVALID = "TOKEN_INVALID";

    private final JwtService jwtService;
    private final CachedUserDetailsService cachedUserDetailsService;

    public OptimizedJwtAuthenticationFilter(JwtService jwtService, CachedUserDetailsService cachedUserDetailsService) {
        this.jwtService = jwtService;
        this.cachedUserDetailsService = cachedUserDetailsService;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/user/auth/") || path.equals("/api/payment/webhook");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String jwt = null;
        boolean fromCookie = false;
        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        } else if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("sessionToken".equals(cookie.getName())) {
                    jwt = cookie.getValue();
                    fromCookie = true;
                    break;
                }
            }
        }

        if (jwt != null && !jwt.isBlank() && SecurityContextHolder.getContext().getAuthentication() == null) {
            String problem;
            try {
                problem = authenticate(jwt, request);
            } catch (ExpiredJwtException e) {
                problem = TOKEN_EXPIRED;
            } catch (JwtException | IllegalArgumentException | UsernameNotFoundException e) {
                // Malformed, wrong signature, or the account no longer exists
                problem = TOKEN_INVALID;
            } catch (Exception e) {
                // Couldn't check the token right now (e.g. database unreachable).
                // Not the user's fault, so don't end their session.
                response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Couldn't check your login, try again\",\"code\":\"AUTH_UNAVAILABLE\"}");
                return;
            }
            if (problem != null) {
                request.setAttribute(AUTH_ERROR, problem);
                if (fromCookie) {
                    response.addHeader(HttpHeaders.SET_COOKIE, UserController.sessionCookie("", Duration.ZERO).toString());
                }
            }
        }

        // Outside the try: errors from the rest of the request (controllers,
        // services) must not be reported as login failures
        filterChain.doFilter(request, response);
    }

    /** @return null when logged in, otherwise why the token was rejected */
    private String authenticate(String jwt, HttpServletRequest request) {
        String username = jwtService.extractUsername(jwt);
        if (username == null) return TOKEN_INVALID;

        // Build the user from the token's claims when it has them (no database lookup)
        UserDetails userDetails = createUserDetailsFromJwt(jwt, username);
        if (userDetails == null) {
            userDetails = cachedUserDetailsService.loadUserByUsername(username);
        }
        if (!jwtService.validateToken(jwt, userDetails.getUsername())) return TOKEN_INVALID;

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
        return null;
    }

    private UserDetails createUserDetailsFromJwt(String jwt, String username) {
        try {
            String role = jwtService.extractRole(jwt);
            String email = jwtService.extractEmail(jwt);
            if (role != null && email != null) {
                return org.springframework.security.core.userdetails.User.builder()
                    .username(username)
                    .password("") // Not used for JWT logins
                    .authorities(role)
                    .build();
            }
        } catch (Exception e) {
            // Fall back to the database lookup
        }
        return null;
    }
}
