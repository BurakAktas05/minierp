package com.minierp.core.security.jwt;

import com.minierp.core.multitenancy.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Her HTTP isteğinde Authorization header'ından Bearer token'ı çıkarır,
 * JWT doğrulaması yapar ve SecurityContext'e authentication yerleştirir.
 * Aynı zamanda token içindeki tenantId bilgisini TenantContext'e set eder.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractTokenFromRequest(request);

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            String username = jwtTokenProvider.getUsernameFromToken(token);
            String tenantId = jwtTokenProvider.getTenantIdFromToken(token);
            String role = jwtTokenProvider.getRoleFromToken(token);

            // 1. TenantContext'i ayarla:
            // Eğer istek başlığında X-Tenant-ID varsa ve kullanıcı yetkili ise header'a öncelik ver
            String headerTenant = request.getHeader("X-Tenant-ID");
            if (StringUtils.hasText(headerTenant) && ("ROLE_ADMIN".equals(role) || "ROLE_MANAGER".equals(role))) {
                TenantContext.setTenantId(headerTenant.trim());
            } else if (StringUtils.hasText(tenantId)) {
                TenantContext.setTenantId(tenantId);
            }

            // 2. SecurityContext'e authentication koy
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            List.of(new SimpleGrantedAuthority(role))
                    );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("JWT ile kimlik doğrulandı: user={}, tenant={}, role={}", username, tenantId, role);
        }

        filterChain.doFilter(request, response);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
