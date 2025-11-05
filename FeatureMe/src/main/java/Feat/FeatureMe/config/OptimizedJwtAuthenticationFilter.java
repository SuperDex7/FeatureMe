package Feat.FeatureMe.config;

import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.CachedUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;

@Component
public class OptimizedJwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CachedUserDetailsService cachedUserDetailsService;

    public OptimizedJwtAuthenticationFilter(JwtService jwtService, CachedUserDetailsService cachedUserDetailsService) {
        this.jwtService = jwtService;
        this.cachedUserDetailsService = cachedUserDetailsService;
    }
    
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        // Skip JWT filtering for these endpoints
        return path.startsWith("/api/user/auth/") || 
               path.startsWith("/api/user/auth/create") ||
               path.equals("/api/user/auth/login") ||
               path.equals("/api/user/auth/logout") ||
               path.equals("/api/payment/webhook");
    }
    
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        String jwt = null;

        // Try to get JWT from Authorization header first, then from cookies
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        } else {
            // Try to get JWT from cookies
            jakarta.servlet.http.Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (jakarta.servlet.http.Cookie cookie : cookies) {
                    if ("sessionToken".equals(cookie.getName())) {
                        jwt = cookie.getValue();
                        break;
                    }
                }
            }
        }
        
        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String username = jwtService.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // Try to create UserDetails from JWT claims first (optimization)
                UserDetails userDetails = createUserDetailsFromJwt(jwt, username);
                
                // If JWT doesn't contain role/email, fall back to database lookup with caching
                if (userDetails == null) {
                    userDetails = cachedUserDetailsService.loadUserByUsername(username);
                }
                
                if (jwtService.validateToken(jwt, userDetails.getUsername())) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException e) {
            // JWT token has expired
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("JWT token expired");
            return;
        } catch (MalformedJwtException | UnsupportedJwtException | SignatureException e) {
            // JWT token is malformed or invalid
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid JWT token");
            return;
        } catch (Exception e) {
            // Other JWT-related errors
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("JWT authentication failed");
            return;
        }
    }
    
    /**
     * Create UserDetails from JWT claims to avoid database lookup
     */
    private UserDetails createUserDetailsFromJwt(String jwt, String username) {
        try {
            String role = jwtService.extractRole(jwt);
            String email = jwtService.extractEmail(jwt);
            
            // If JWT contains role and email, create UserDetails from claims
            if (role != null && email != null) {
                return org.springframework.security.core.userdetails.User.builder()
                    .username(username)
                    .password("") // Password not needed for JWT validation
                    .authorities(role)
                    .build();
            }
        } catch (Exception e) {
            // If we can't extract claims, return null to fall back to database lookup
        }
        
        return null;
    }
}
