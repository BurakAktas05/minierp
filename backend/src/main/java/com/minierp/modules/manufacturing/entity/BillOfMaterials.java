package com.minierp.modules.manufacturing.entity;

import com.minierp.core.common.entity.BaseEntity;
import com.minierp.modules.inventory.entity.ProductVariant;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Üretim Reçetesi (BOM - Bill of Materials).
 * 10 farklı sektörün üretim, montaj veya harmanlama kurgusuna uygun mamul reçetesi.
 */
@Entity
@Table(name = "bill_of_materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillOfMaterials extends BaseEntity {

    @Column(name = "bom_code", nullable = false, unique = true, length = 50)
    private String bomCode;

    @Column(nullable = false, length = 150)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Builder.Default
    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal quantity = BigDecimal.ONE;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String unit = "ADET";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(name = "industry_type", length = 50)
    private String industryType = "GENERIC";

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @Builder.Default
    @OneToMany(mappedBy = "bom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BomItem> items = new ArrayList<>();

    public void addItem(BomItem item) {
        items.add(item);
        item.setBom(this);
    }
}
