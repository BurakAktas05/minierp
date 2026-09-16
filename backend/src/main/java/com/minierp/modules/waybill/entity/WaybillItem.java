package com.minierp.modules.waybill.entity;

import com.minierp.core.common.entity.BaseEntity;
import com.minierp.modules.inventory.entity.ProductVariant;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * İrsaliye kalemi entity'si.
 */
@Entity
@Table(name = "waybill_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaybillItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waybill_id", nullable = false)
    private Waybill waybill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    private String description;

    @Column(nullable = false)
    private Integer quantity;

    @Builder.Default
    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;
}
