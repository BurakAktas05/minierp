package com.minierp.modules.manufacturing.entity;

import com.minierp.core.common.entity.BaseEntity;
import com.minierp.modules.inventory.entity.ProductVariant;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Reçete sarfiyat kalemi (Hammadde, yarı mamul, montaj parçası).
 */
@Entity
@Table(name = "bom_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BomItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bom_id", nullable = false)
    private BillOfMaterials bom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_variant_id", nullable = false)
    private ProductVariant componentVariant;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal quantity;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String unit = "ADET";

    @Builder.Default
    @Column(name = "scrap_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal scrapRate = BigDecimal.ZERO;

    @Column(length = 255)
    private String description;
}
