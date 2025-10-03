package Feat.FeatureMe.config;

import Feat.FeatureMe.Service.RateLimitingService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    @Autowired
    private RateLimitingService rateLimitingService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        // Skip rate limiting for certain endpoints
        if (shouldSkipRateLimit(requestURI)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get client identifier (IP address or user ID)
        String identifier = getClientIdentifier(request);
        
        // Check rate limits based on endpoint
        boolean isWithinLimit = true;
        String rateLimitType = "general";

        if (isEmailVerificationEndpoint(requestURI)) {
            isWithinLimit = rateLimitingService.isEmailVerificationWithinLimit(identifier);
            rateLimitType = "email_verification";
        } else if (isFileUploadEndpoint(requestURI)) {
            isWithinLimit = rateLimitingService.isFileUploadWithinLimit(identifier);
            rateLimitType = "file_upload";
        } else if (isLoginEndpoint(requestURI)) {
            isWithinLimit = rateLimitingService.isLoginAttemptWithinLimit(identifier);
            rateLimitType = "login";
        } else {
            // General API rate limiting
            isWithinLimit = rateLimitingService.isWithinRateLimit(identifier, requestURI);
        }

        if (!isWithinLimit) {
            // Rate limit exceeded
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            
            RateLimitingService.RateLimitInfo rateLimitInfo = rateLimitingService.getRateLimitInfo(identifier, requestURI);
            
            String errorResponse = String.format(
                "{\"error\":\"Rate limit exceeded\",\"type\":\"%s\",\"retryAfter\":%d,\"message\":\"Too many requests. Please try again later.\"}",
                rateLimitType,
                rateLimitInfo.getResetTimeSeconds()
            );
            
            response.getWriter().write(errorResponse);
            response.setHeader("Retry-After", String.valueOf(rateLimitInfo.getResetTimeSeconds()));
            response.setHeader("X-RateLimit-Limit", "100");
            response.setHeader("X-RateLimit-Remaining", String.valueOf(rateLimitInfo.getRemainingRequests()));
            response.setHeader("X-RateLimit-Reset", String.valueOf(System.currentTimeMillis() / 1000 + rateLimitInfo.getResetTimeSeconds()));
            
            return;
        }

        // Add rate limit headers to successful responses
        RateLimitingService.RateLimitInfo rateLimitInfo = rateLimitingService.getRateLimitInfo(identifier, requestURI);
        response.setHeader("X-RateLimit-Limit", "100");
        response.setHeader("X-RateLimit-Remaining", String.valueOf(rateLimitInfo.getRemainingRequests()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(System.currentTimeMillis() / 1000 + rateLimitInfo.getResetTimeSeconds()));

        filterChain.doFilter(request, response);
    }

    private boolean shouldSkipRateLimit(String requestURI) {
        // Skip rate limiting for health checks, static resources, and WebSocket connections
        return requestURI.startsWith("/actuator/") ||
               requestURI.startsWith("/static/") ||
               requestURI.startsWith("/css/") ||
               requestURI.startsWith("/js/") ||
               requestURI.startsWith("/auth/login/") ||
               requestURI.startsWith("/images/") ||
               requestURI.startsWith("/ws/") ||
               requestURI.equals("/favicon.ico");
    }

    private boolean isEmailVerificationEndpoint(String requestURI) {
        return requestURI.contains("/auth/email/") && requestURI.contains("verify");
    }

    private boolean isFileUploadEndpoint(String requestURI) {
        return requestURI.contains("/upload") || requestURI.contains("/create");
    }

    private boolean isLoginEndpoint(String requestURI) {
        return requestURI.contains("/auth/login") || requestURI.contains("/auth/signup");
    }

    private String getClientIdentifier(HttpServletRequest request) {
        // Try to get user ID from authentication context first
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                // For authenticated users, we could extract user ID from JWT
                // For now, fall back to IP address
            }
        } catch (Exception e) {
            // Ignore authentication errors
        }

        // Fall back to IP address
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Skip rate limiting for certain paths
        String path = request.getRequestURI();
        return path.startsWith("/actuator/") || 
               path.startsWith("/static/") ||
               path.startsWith("/auth/login/") ||
               path.startsWith("/ws/");
    }
}
