package com.minierp.modules.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponse {

    private Long id;
    private String tenantId;
    private String companyName;
    private String schemaName;
    private boolean active;
    private OffsetDateTime createdAt;
}
