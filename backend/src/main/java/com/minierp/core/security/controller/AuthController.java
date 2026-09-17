package com.minierp.core.security.controller;

import com.minierp.core.multitenancy.TenantContext;
import com.minierp.core.security.dto.AuthResponse;
import com.minierp.core.security.dto.LoginRequest;
import com.minierp.core.security.dto.RegisterRequest;
import com.minierp.core.security.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Kimlik doğrulama (Authentication) REST controller'ı.
 * Kayıt, giriş ve mevcut kullanıcı bilgisi endpoint'leri.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Yeni kullanıcı kaydı.
     * X-Tenant-ID header'ı ile hangi kiracıya kayıt olunacağı belirlenir.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        String tenantId = TenantContext.getTenantId();
        AuthResponse response = authService.register(request, tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Kullanıcı girişi.
     * Request body içinde tenantId belirtilir, başarılıysa JWT token döner.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        String targetTenant = request.getTenantId();
        if (targetTenant == null || targetTenant.isBlank()) {
            String u = request.getUsername().toLowerCase();
            if (u.contains("aktas")) {
                targetTenant = "tenant_aktas";
            } else if (u.contains("vogue") || u.contains("moda")) {
                targetTenant = "tenant_moda";
            } else {
                targetTenant = "tenant_tekstil";
            }
            request.setTenantId(targetTenant);
        }

        TenantContext.setTenantId(targetTenant);
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * Mevcut authenticated kullanıcı bilgisi.
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of(
                "username", userDetails.getUsername(),
                "role", userDetails.getAuthorities().iterator().next().getAuthority(),
                "tenantId", TenantContext.getTenantId()
        ));
    }
}
