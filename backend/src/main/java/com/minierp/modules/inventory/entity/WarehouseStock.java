package com.minierp.modules.inventory.entity;

import com.minierp.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Depo bazlı varyant stok bakiyesi entity'si.
 * Her bir varyantın hangi depoda kaç adet fiili ve rezerve stoğu olduğunu saklar.
 */
@Entity
@Table(name = "warehouse_stocks", uniqueConstraints = {
        @UniqueConstraint(name = "uk_warehouse_variant", columnNames = {"warehouse_id", "variant_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseStock extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Builder.Default
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 0;

    @Builder.Default
    @Column(name = "reserved_stock", nullable = false)
    private Integer reservedStock = 0;

    @Column(name = "shelf_location", length = 50)
    private String shelfLocation;

    /**
     * O depodan satılabilir (kullanılabilir) serbest stok miktarı.
     */
    public int getAvailableStock() {
        int physical = (quantity != null) ? quantity : 0;
        int reserved = (reservedStock != null) ? reservedStock : 0;
        return Math.max(0, physical - reserved);
    }
}
