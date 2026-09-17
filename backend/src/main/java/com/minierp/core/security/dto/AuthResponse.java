package com.minierp.core.security.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Başarılı kimlik doğrulama sonrası dönen JWT token yanıtı.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;

    @JsonProperty("token")
    public String getToken() {
        return accessToken;
    }

    @Builder.Default
    private String tokenType = "Bearer";

    private String username;
    private String fullName;
    private String role;
    private String tenantId;
}
