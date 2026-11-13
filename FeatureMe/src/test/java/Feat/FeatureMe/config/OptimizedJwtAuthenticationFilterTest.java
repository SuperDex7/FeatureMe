package Feat.FeatureMe.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;

@DisplayName("OptimizedJwtAuthenticationFilter")
class OptimizedJwtAuthenticationFilterTest {

    private final JwtService jwtService = mock(JwtService.class);
    private final OptimizedJwtAuthenticationFilter filter =
        new OptimizedJwtAuthenticationFilter(jwtService, mock(CachedUserDetailsService.class));

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequest requestWithToken() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/posts/downloads/p1/paginated");
        request.setCookies(new Cookie("sessionToken", "token"));
        return request;
    }

    private void validToken() {
        when(jwtService.extractUsername("token")).thenReturn("alice@example.com");
        when(jwtService.extractRole("token")).thenReturn("USER");
        when(jwtService.extractEmail("token")).thenReturn("alice@example.com");
        when(jwtService.validateToken("token", "alice@example.com")).thenReturn(true);
    }

    @Test
    @DisplayName("an error later in the request is not turned into a 401 'JWT authentication failed'")
    void downstreamErrorsPropagate() throws Exception {
        validToken();
        FilterChain chain = mock(FilterChain.class);
        doThrow(new IllegalArgumentException("The given id must not be null")).when(chain).doFilter(any(), any());
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertThatThrownBy(() -> filter.doFilter(requestWithToken(), response, chain))
            .isInstanceOf(IllegalArgumentException.class);
        assertThat(response.getContentAsString()).doesNotContain("JWT");
    }

    @Test
    @DisplayName("a valid token logs the user in and continues")
    void validTokenAuthenticates() throws Exception {
        validToken();
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletRequest request = requestWithToken();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("alice@example.com");
    }

    @Test
    @DisplayName("an expired token is still a 401")
    void expiredTokenIs401() throws Exception {
        when(jwtService.extractUsername("token")).thenThrow(new ExpiredJwtException(null, null, "expired"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(requestWithToken(), response, mock(FilterChain.class));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).isEqualTo("JWT token expired");
    }
}
