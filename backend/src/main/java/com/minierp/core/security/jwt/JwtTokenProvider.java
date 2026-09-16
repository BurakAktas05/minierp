package com.minierp.core.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * JWT token oluşturma, doğrulama ve claim çıkarma işlemlerini yürüten bileşen.
 * Token içinde kullanıcı adı (subject), kiracı kimliği (tenantId) ve rol (role) taşınır.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long jwtExpirationMs;

    public JwtTokenProvider(
            @Value("${minierp.security.jwt.secret}") String jwtSecret,
            @Value("${minierp.security.jwt.expiration-ms}") long jwtExpirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        this.jwtExpirationMs = jwtExpirationMs;
    }

    /**
     * Authentication nesnesinden JWT token üretir.
     */
    public String generateToken(Authentication authentication, String tenantId, String role) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return generateToken(userDetails.getUsername(), tenantId, role);
    }

    /**
     * Kullanıcı adı, kiracı ve rol bilgileriyle JWT token üretir.
     */
    public String generateToken(String username, String tenantId, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(username)
                .claim("tenantId", tenantId)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Token'dan kullanıcı adını (subject) çıkarır.
     */
    public String getUsernameFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Token'dan kiracı kimliğini (tenantId claim) çıkarır.
     */
    public String getTenantIdFromToken(String token) {
        return parseClaims(token).get("tenantId", String.class);
    }

    /**
     * Token'dan kullanıcı rolünü çıkarır.
     */
    public String getRoleFromToken(String token) {
        return parseClaims(token).get("role", String.class);
    }

    /**
     * Token'ın geçerli olup olmadığını kontrol eder.
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Geçersiz JWT imzası: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token süresi dolmuş: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Desteklenmeyen JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string boş: {}", e.getMessage());
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
