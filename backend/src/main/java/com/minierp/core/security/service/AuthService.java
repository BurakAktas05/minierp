package com.minierp.core.security.service;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.security.dto.AuthResponse;
import com.minierp.core.security.dto.LoginRequest;
import com.minierp.core.security.dto.RegisterRequest;
import com.minierp.core.security.entity.User;
import com.minierp.core.security.entity.UserRole;
import com.minierp.core.security.jwt.JwtTokenProvider;
import com.minierp.core.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Kimlik doğrulama ve kullanıcı kayıt işlemlerini yürüten servis.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Yeni kullanıcı kaydı oluşturur.
     * Şifre BCrypt ile hash'lenir, varsayılan rol ROLE_USER'dır.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request, String tenantId) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Bu kullanıcı adı zaten kullanılıyor: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Bu e-posta adresi zaten kayıtlı: " + request.getEmail());
        }

        UserRole role = (request.getRole() != null) ? request.getRole() : UserRole.ROLE_USER;

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(role)
                .active(true)
                .build();

        userRepository.save(user);
        log.info("Yeni kullanıcı kaydedildi: username={}, role={}, tenant={}", user.getUsername(), role, tenantId);

        // Kayıt sonrası otomatik token üret
        String token = jwtTokenProvider.generateToken(user.getUsername(), tenantId, role.name());

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(role.name())
                .tenantId(tenantId)
                .build();
    }

    /**
     * Kullanıcı girişi yapar, başarılıysa JWT token döner.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("Kullanıcı bulunamadı"));

        String token = jwtTokenProvider.generateToken(
                authentication,
                request.getTenantId(),
                user.getRole().name()
        );

        log.info("Kullanıcı giriş yaptı: username={}, tenant={}", user.getUsername(), request.getTenantId());

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .tenantId(request.getTenantId())
                .build();
    }
}
