package com.minierp.modules.waybill.entity;

import com.minierp.core.common.entity.BaseEntity;
import com.minierp.modules.partner.entity.BusinessPartner;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Kiracı şemasında saklanan İrsaliye (Waybill) ana entity'si.
 */
@Entity
@Table(name = "waybills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Waybill extends BaseEntity {

    @Column(name = "waybill_number", nullable = false, unique = true, length = 50)
    private String waybillNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WaybillType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private BusinessPartner partner;

    @Column(name = "order_id")
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WaybillStatus status;

    @Builder.Default
    @Column(name = "dispatch_date", nullable = false)
    private OffsetDateTime dispatchDate = OffsetDateTime.now();

    @Column(name = "delivery_date")
    private OffsetDateTime deliveryDate;

    @Column(name = "carrier_company", length = 100)
    private String carrierCompany;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "vehicle_plate", length = 30)
    private String vehiclePlate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @Builder.Default
    @OneToMany(mappedBy = "waybill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WaybillItem> items = new ArrayList<>();

    public void addItem(WaybillItem item) {
        items.add(item);
        item.setWaybill(this);
    }
}
