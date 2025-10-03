package Feat.FeatureMe.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
                registry.requestMatchers("/api/user/auth/**").permitAll();
                registry.requestMatchers("/api/user/me").authenticated();
                registry.requestMatchers("/api/user/**").authenticated();
                
                // SPECIFIC posts endpoints that should be public (must come BEFORE general rule)
                registry.requestMatchers("GET", "/api/posts/get/**").permitAll();
                registry.requestMatchers("GET", "/api/posts/views/**").permitAll();
                registry.requestMatchers("POST", "/api/posts/view/**").permitAll();
                registry.requestMatchers("GET", "/api/posts/downloads/**").permitAll();
                registry.requestMatchers("POST", "/api/posts/download/**").permitAll();
                registry.requestMatchers("GET", "/api/posts/comments/**").permitAll();
                registry.requestMatchers("GET", "/api/posts/likes/**").permitAll();
                
                // All other posts endpoints require authentication
                registry.requestMatchers("/api/posts/**").authenticated();
                
                //registry.requestMatchers("/api/chats/**").authenticated();
                registry.requestMatchers("/ws/**").permitAll(); // Allow WebSocket connections
                registry.anyRequest().permitAll();
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

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Get allowed origins from environment or use defaults
        String allowedOrigins = System.getenv("ALLOWED_ORIGINS");
        if (allowedOrigins != null && !allowedOrigins.isEmpty()) {
            // Production: use environment variable
            configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        } else {
            // Development: use localhost origins
            configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",  // React frontend (HTTP setup)
                "http://localhost:5173",  // Vite dev server
                "https://localhost",      // HTTPS setup with nginx
                "http://localhost"        // HTTP setup with nginx
            ));
        }
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public UserDetailsService userDetailsService(CachedUserDetailsService cachedUserDetailsService) {
        return cachedUserDetailsService;
    }
    
    @Bean
    public OptimizedJwtAuthenticationFilter optimizedJwtAuthenticationFilter(CachedUserDetailsService cachedUserDetailsService) {
        return new OptimizedJwtAuthenticationFilter(jwtService, cachedUserDetailsService);
    }
}
