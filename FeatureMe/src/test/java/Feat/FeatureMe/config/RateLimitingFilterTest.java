package Feat.FeatureMe.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import Feat.FeatureMe.Service.RateLimitingService;
import jakarta.servlet.http.HttpServletResponse;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("RateLimitingFilter")
class RateLimitingFilterTest {

    private static final String LOGIN = "/api/user/auth/login";

    @Mock
    private RateLimitingService rateLimitingService;

    private RateLimitingFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitingFilter();
        ReflectionTestUtils.setField(filter, "rateLimitingService", rateLimitingService);
        when(rateLimitingService.isLoginAttemptWithinLimit(anyString())).thenReturn(true);
        when(rateLimitingService.isWithinRateLimit(anyString(), anyString())).thenReturn(true);
        when(rateLimitingService.getRateLimitInfo(anyString(), any()))
            .thenReturn(new RateLimitingService.RateLimitInfo(0, 100, 60));
    }

    private MockHttpServletResponse run(MockHttpServletRequest request, int downstreamStatus) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest req, jakarta.servlet.ServletResponse res) {
                ((HttpServletResponse) res).setStatus(downstreamStatus);
            }
        };
        filter.doFilter(request, response, chain);
        return response;
    }

    private static MockHttpServletRequest loginRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", LOGIN);
        request.setRequestURI(LOGIN);
        request.addHeader("X-Real-IP", "203.0.113.7");
        return request;
    }

    @Test
    @DisplayName("login requests are rate limited (no longer exempt)")
    void loginIsRateLimited() throws Exception {
        run(loginRequest(), 401);

        verify(rateLimitingService).isLoginAttemptWithinLimit("203.0.113.7");
    }

    @Test
    @DisplayName("login is blocked with 429 once the limit is reached")
    void loginBlockedWhenOverLimit() throws Exception {
        when(rateLimitingService.isLoginAttemptWithinLimit(anyString())).thenReturn(false);

        MockHttpServletResponse response = run(loginRequest(), 200);

        assertEquals(429, response.getStatus());
    }

    @Test
    @DisplayName("a successful login clears that IP's failed-attempt counter")
    void successfulLoginResetsCounter() throws Exception {
        run(loginRequest(), 200);

        verify(rateLimitingService).resetLoginAttempts("203.0.113.7");
    }

    @Test
    @DisplayName("a failed login keeps counting toward the limit")
    void failedLoginDoesNotReset() throws Exception {
        run(loginRequest(), 401);

        verify(rateLimitingService, never()).resetLoginAttempts(anyString());
    }

    @Test
    @DisplayName("a spoofed X-Forwarded-For can't change the client identity")
    void spoofedForwardedForIsIgnored() throws Exception {
        MockHttpServletRequest request = loginRequest();
        request.addHeader("X-Forwarded-For", "1.2.3.4, 203.0.113.7");

        run(request, 401);

        verify(rateLimitingService).isLoginAttemptWithinLimit("203.0.113.7");
        verify(rateLimitingService, never()).isLoginAttemptWithinLimit("1.2.3.4");
    }

    @Test
    @DisplayName("without X-Real-IP, the proxy-added (last) X-Forwarded-For hop is used")
    void lastForwardedForHopIsUsed() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", LOGIN);
        request.setRequestURI(LOGIN);
        request.addHeader("X-Forwarded-For", "1.2.3.4, 203.0.113.7");

        run(request, 401);

        verify(rateLimitingService).isLoginAttemptWithinLimit("203.0.113.7");
    }

    @Test
    @DisplayName("health checks are not rate limited")
    void actuatorIsSkipped() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/health");
        request.setRequestURI("/actuator/health");

        run(request, 200);

        verifyNoInteractions(rateLimitingService);
    }
}
