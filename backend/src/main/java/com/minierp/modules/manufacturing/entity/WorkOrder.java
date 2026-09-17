package com.minierp.modules.manufacturing.entity;

import com.minierp.core.common.entity.BaseEntity;
import com.minierp.modules.inventory.entity.Warehouse;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Üretim İş Emri (Work Order).
 * Reçeteye istinaden üretim planlama, hammadde sarfiyatı ve mamul üretimi.
 */
@Entity
@Table(name = "work_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrder extends BaseEntity {

    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bom_id", nullable = false)
    private BillOfMaterials bom;

    @Column(name = "sales_order_id")
    private Long salesOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_warehouse_id")
    private Warehouse sourceWarehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_warehouse_id")
    private Warehouse targetWarehouse;

    @Column(name = "planned_quantity", nullable = false, precision = 15, scale = 3)
    private BigDecimal plannedQuantity;

    @Builder.Default
    @Column(name = "produced_quantity", nullable = false, precision = 15, scale = 3)
    private BigDecimal producedQuantity = BigDecimal.ZERO;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WorkOrderStatus status = WorkOrderStatus.DRAFT;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String priority = "NORMAL";

    @Column(name = "start_date")
    private OffsetDateTime startDate;

    @Column(name = "due_date")
    private OffsetDateTime dueDate;

    @Column(name = "completion_date")
    private OffsetDateTime completionDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @Builder.Default
    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkOrderItem> items = new ArrayList<>();

    public void addItem(WorkOrderItem item) {
        items.add(item);
        item.setWorkOrder(this);
    }
}
