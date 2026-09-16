package com.minierp.modules.inventory.entity;

import com.minierp.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Kiracı şemasında saklanan ürün varyantı entity'si.
 * Fiili stok (stockQuantity), Rezerve stok (reservedStock) ve Satılabilir stok ayrımı içerir.
 */
@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(length = 50)
    private String barcode;

    @Column(name = "variant_name", nullable = false, length = 150)
    private String variantName;

    @Builder.Default
    @Column(name = "purchase_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "sale_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal salePrice = BigDecimal.ZERO;

    /**
     * Depoda fiziksel olarak bulunan fiili stok miktarı.
     */
    @Builder.Default
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    /**
     * Onaylanan satış teklifleri veya bekleyen siparişler için ayrılmış rezerve stok miktarı.
     */
    @Builder.Default
    @Column(name = "reserved_stock", nullable = false)
    private Integer reservedStock = 0;

    /**
     * PostgreSQL JSONB sütununa eşlenen dinamik varyant özellikleri.
     * Örn: {"renk": "Kırmızı", "beden": "M", "kumas": "Pamuk"}
     */
    @Builder.Default
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes", columnDefinition = "jsonb")
    private Map<String, Object> attributes = new HashMap<>();

    /**
     * Kullanılabilir / Satılabilir Stok = Fiili Stok - Rezerve Stok
     */
    @Transient
    public Integer getAvailableStock() {
        int physical = (stockQuantity != null) ? stockQuantity : 0;
        int reserved = (reservedStock != null) ? reservedStock : 0;
        return physical - reserved;
    }
}
