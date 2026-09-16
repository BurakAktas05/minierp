package com.minierp.modules.inventory.entity;

import com.minierp.core.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

/**
 * Kiracı şemasında saklanan Depo (Warehouse) entity'si.
 * Çoklu depo lokasyon yönetimi sağlar.
 */
@Entity
@Table(name = "warehouses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Warehouse extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 150)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
