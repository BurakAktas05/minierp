package com.minierp.core.multitenancy;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Gelen her HTTP isteğini dinler ve kiracı (tenant) bağlamını belirler.
 *
 * Öncelik sırası:
 * 1. JWT token içindeki tenantId (JwtAuthenticationFilter tarafından set edilir)
 * 2. X-Tenant-ID HTTP header'ı (public/auth endpoint'leri için)
 * 3. Varsayılan kiracı (public)
 *
 * NOT: Bu filter Ordered.HIGHEST_PRECEDENCE ile çalışır. JwtAuthenticationFilter
 * daha sonra çalışacağı için, eğer JWT varsa TenantContext'i override edecektir.
 * Bu filter sadece JWT olmayan (public) istekler için header-based fallback sağlar.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TenantFilter extends OncePerRequestFilter {

    @Value("${minierp.multitenancy.header-name:X-Tenant-ID}")
    private String tenantHeader;

    @Value("${minierp.multitenancy.default-tenant:public}")
    private String defaultTenant;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String tenantId = request.getHeader(tenantHeader);

        if (tenantId != null && !tenantId.isBlank()) {
            TenantContext.setTenantId(tenantId.trim());
        } else if (TenantContext.getTenantId() == null) {
            TenantContext.setTenantId(defaultTenant);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}

