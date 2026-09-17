package com.minierp.modules.manufacturing.entity;

import com.minierp.core.common.entity.BaseEntity;
import com.minierp.modules.inventory.entity.ProductVariant;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * İş emri sarfiyat ve gerçekleşme satırı.
 */
@Entity
@Table(name = "work_order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_variant_id", nullable = false)
    private ProductVariant componentVariant;

    @Column(name = "planned_quantity", nullable = false, precision = 15, scale = 3)
    private BigDecimal plannedQuantity;

    @Builder.Default
    @Column(name = "consumed_quantity", nullable = false, precision = 15, scale = 3)
    private BigDecimal consumedQuantity = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String unit = "ADET";
}
