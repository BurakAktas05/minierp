package com.minierp.core.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kullanıcı giriş isteği DTO'su.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Kullanıcı adı boş olamaz")
    private String username;

    @NotBlank(message = "Şifre boş olamaz")
    private String password;

    /**
     * Login sırasında hangi kiracıya giriş yapıldığını belirtir.
     * JWT üretiminde tenantId claim'i olarak kullanılır.
     */
    @NotBlank(message = "Kiracı kimliği (tenantId) boş olamaz")
    private String tenantId;
}
