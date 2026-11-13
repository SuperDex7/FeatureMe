package Feat.FeatureMe.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import Feat.FeatureMe.Service.CachedUserDetailsService;
import Feat.FeatureMe.Service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;

@DisplayName("OptimizedJwtAuthenticationFilter")
class OptimizedJwtAuthenticationFilterTest {

    private final JwtService jwtService = mock(JwtService.class);
    private final CachedUserDetailsService users = mock(CachedUserDetailsService.class);
    private final OptimizedJwtAuthenticationFilter filter = new OptimizedJwtAuthenticationFilter(jwtService, users);

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

    private MockHttpServletResponse run(MockHttpServletRequest request, FilterChain chain) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        return response;
    }

    @Test
    @DisplayName("an expired token carries on as a visitor, marked TOKEN_EXPIRED, and the cookie is cleared")
    void expiredTokenContinuesAsVisitor() throws Exception {
        when(jwtService.extractUsername("token")).thenThrow(new ExpiredJwtException(null, null, "expired"));
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletRequest request = requestWithToken();

        MockHttpServletResponse response = run(request, chain);

        verify(chain).doFilter(any(), any());
        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(request.getAttribute(OptimizedJwtAuthenticationFilter.AUTH_ERROR)).isEqualTo("TOKEN_EXPIRED");
        assertThat(response.getHeader("Set-Cookie")).startsWith("sessionToken=;").contains("Max-Age=0");
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("a forged or broken token is TOKEN_INVALID")
    void badSignature() throws Exception {
        when(jwtService.extractUsername("token")).thenThrow(new SignatureException("bad signature"));
        MockHttpServletRequest request = requestWithToken();
        run(request, mock(FilterChain.class));
        assertThat(request.getAttribute(OptimizedJwtAuthenticationFilter.AUTH_ERROR)).isEqualTo("TOKEN_INVALID");
    }

    @Test
    @DisplayName("a token for a deleted account is TOKEN_INVALID")
    void deletedAccount() throws Exception {
        when(jwtService.extractUsername("token")).thenReturn("gone@example.com");
        when(users.loadUserByUsername("gone@example.com")).thenThrow(new UsernameNotFoundException("gone"));
        MockHttpServletRequest request = requestWithToken();
        run(request, mock(FilterChain.class));
        assertThat(request.getAttribute(OptimizedJwtAuthenticationFilter.AUTH_ERROR)).isEqualTo("TOKEN_INVALID");
    }

    @Test
    @DisplayName("if the login can't be checked (database down) it's a 503, not a logout")
    void databaseDownIs503() throws Exception {
        when(jwtService.extractUsername("token")).thenReturn("alice@example.com");
        when(users.loadUserByUsername("alice@example.com")).thenThrow(new RuntimeException("timeout"));
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletResponse response = run(requestWithToken(), chain);

        assertThat(response.getStatus()).isEqualTo(503);
        assertThat(response.getContentAsString()).contains("AUTH_UNAVAILABLE");
        assertThat(response.getHeader("Set-Cookie")).isNull();
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("an expired app token (Authorization header) doesn't touch cookies")
    void headerTokenNoCookie() throws Exception {
        when(jwtService.extractUsername("token")).thenThrow(new ExpiredJwtException(null, null, "expired"));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/posts/liked");
        request.addHeader("Authorization", "Bearer token");

        MockHttpServletResponse response = run(request, mock(FilterChain.class));

        assertThat(request.getAttribute(OptimizedJwtAuthenticationFilter.AUTH_ERROR)).isEqualTo("TOKEN_EXPIRED");
        assertThat(response.getHeader("Set-Cookie")).isNull();
    }
}
