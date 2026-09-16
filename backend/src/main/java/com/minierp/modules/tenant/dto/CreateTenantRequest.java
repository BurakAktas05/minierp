package com.minierp.modules.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTenantRequest {

    @NotBlank(message = "Tenant ID boş bırakılamaz")
    @Size(min = 3, max = 50, message = "Tenant ID 3 ile 50 karakter arasında olmalıdır")
    @Pattern(regexp = "^[a-z0-9_]+$", message = "Tenant ID sadece küçük harf, rakam ve alt çizgi içerebilir")
    private String tenantId;

    @NotBlank(message = "Firma adı boş bırakılamaz")
    @Size(max = 100, message = "Firma adı en fazla 100 karakter olabilir")
    private String companyName;

    @NotBlank(message = "Şema adı boş bırakılamaz")
    @Size(min = 3, max = 50, message = "Şema adı 3 ile 50 karakter arasında olmalıdır")
    @Pattern(regexp = "^[a-z0-9_]+$", message = "Şema adı sadece küçük harf, rakam ve alt çizgi içerebilir")
    private String schemaName;
}
