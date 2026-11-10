package Feat.FeatureMe.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import Feat.FeatureMe.Service.JwtService;
import Feat.FeatureMe.Service.CachedUserDetailsService;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig /*extends WebSecurityConfigurationAdapter*/ {
     
    private final JwtService jwtService;
    private final RateLimitingFilter rateLimitingFilter;

    public SecurityConfig(JwtService jwtService, RateLimitingFilter rateLimitingFilter) {
        this.jwtService = jwtService;
        this.rateLimitingFilter = rateLimitingFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity, CachedUserDetailsService cachedUserDetailsService)throws Exception{
        return httpSecurity
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(registry ->{
                // Spring's error dispatch must stay reachable, otherwise every error becomes a 401
                registry.requestMatchers("/error").permitAll();
                registry.requestMatchers("/actuator/health").permitAll();

                // Signup, login, password reset, availability checks
                registry.requestMatchers("/api/user/auth/**").permitAll();

                // Payment provider callbacks (no user session; Stripe verifies its signature)
                registry.requestMatchers(HttpMethod.POST, "/api/payment/webhook").permitAll();
                registry.requestMatchers(HttpMethod.POST, "/api/payment/apple-webhook").permitAll();

                // Public post pages (shared /post/:id links work while logged out)
                registry.requestMatchers(HttpMethod.GET, "/api/posts/get/**").permitAll();
                registry.requestMatchers(HttpMethod.GET, "/api/posts/views/**").permitAll();
                registry.requestMatchers(HttpMethod.POST, "/api/posts/view/**").permitAll();
                registry.requestMatchers(HttpMethod.GET, "/api/posts/downloads/**").permitAll();
                registry.requestMatchers(HttpMethod.POST, "/api/posts/download/**").permitAll();
                registry.requestMatchers(HttpMethod.GET, "/api/posts/comments/**").permitAll();
                registry.requestMatchers(HttpMethod.GET, "/api/posts/likes/**").permitAll();

                // SockJS/STOMP handshake
                registry.requestMatchers("/ws/**").permitAll();

                // Everything else (posts writes, chats, demos, s3, payments, users, relations) needs a valid JWT
                registry.anyRequest().authenticated();
            })
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(optimizedJwtAuthenticationFilter(cachedUserDetailsService), UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(exception -> exception
            .authenticationEntryPoint((request, response, authException) -> {
                // Redirect to React login page
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                
                // Get frontend URL from environment or use default
                String frontendUrl = System.getenv("FRONTEND_URL");
                if (frontendUrl == null || frontendUrl.isEmpty()) {
                    frontendUrl = "https://featureme.co"; // Default to production domain
                }
                
                response.getWriter().write("{\"error\":\"Authentication required\",\"redirect\":\"" + frontendUrl + "/login\"}");
            })
        )
        .build();
    }

    /**
     * Origins allowed for REST CORS and the WebSocket handshake.
     * Production sets ALLOWED_ORIGINS (comma-separated); otherwise local dev origins.
     */
    static List<String> allowedOrigins() {
        String allowedOrigins = System.getenv("ALLOWED_ORIGINS");
        if (allowedOrigins != null && !allowedOrigins.isEmpty()) {
            return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        }
        return List.of(
            "http://localhost:3000",  // React frontend (HTTP setup)
            "http://localhost:5173",  // Vite dev server
            "https://localhost",      // HTTPS setup with nginx
            "http://localhost",       // HTTP setup with nginx
            "http://10.0.2.2:8080",  // Android emulator backend
            "http://10.0.0.200:8080", // Your computer's IP for backend
            "http://10.0.2.2:3000",  // Android emulator React dev
            "exp://10.0.0.200:8081", // Expo development server
            "exp://localhost:8081"    // Expo local development
        );
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins());

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        // Note: React Native apps don't send cookies by default, so JWT tokens
        // should be sent in Authorization headers instead of cookies for mobile
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public OptimizedJwtAuthenticationFilter optimizedJwtAuthenticationFilter(CachedUserDetailsService cachedUserDetailsService) {
        return new OptimizedJwtAuthenticationFilter(jwtService, cachedUserDetailsService);
    }
}
