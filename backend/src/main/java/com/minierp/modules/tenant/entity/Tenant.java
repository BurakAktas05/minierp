package com.minierp.modules.tenant.entity;

import com.minierp.core.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

/**
 * Master (public) şemada saklanan kiracı (Tenant) entity'si.
 */
@Entity
@Table(name = "tenants", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant extends BaseEntity {

    @Column(name = "tenant_id", nullable = false, unique = true, length = 50)
    private String tenantId;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(name = "schema_name", nullable = false, unique = true, length = 50)
    private String schemaName;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
