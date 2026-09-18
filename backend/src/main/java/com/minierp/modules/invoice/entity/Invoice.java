package com.minierp.modules.invoice.entity;

import com.minierp.core.common.entity.BaseEntity;
import com.minierp.modules.partner.entity.BusinessPartner;
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
 * Kiracı şemasında saklanan Fatura (Invoice) ana entity'si.
 * Satış faturası, alış faturası ve hizmet faturası desteği içerir.
 */
@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice extends BaseEntity {

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false, length = 20)
    private InvoiceType invoiceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private BusinessPartner partner;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "waybill_id")
    private Long waybillId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InvoiceStatus status;

    @Builder.Default
    @Column(name = "invoice_date", nullable = false)
    private OffsetDateTime invoiceDate = OffsetDateTime.now();

    @Column(name = "due_date")
    private OffsetDateTime dueDate;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String currency = "TRY";

    @Builder.Default
    @Column(name = "exchange_rate", nullable = false, precision = 10, scale = 4)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Builder.Default
    @Column(name = "subtotal_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tax_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "paid_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "remaining_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @Builder.Default
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceItem> items = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    private List<Payment> payments = new ArrayList<>();

    public void addItem(InvoiceItem item) {
        items.add(item);
        item.setInvoice(this);
    }

    /**
     * Ödeme sonrası bakiye ve durum güncellemesi.
     */
    public void recalculatePaymentStatus() {
        BigDecimal totalPaid = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.paidAmount = totalPaid;
        this.remainingAmount = this.totalAmount.subtract(totalPaid);

        if (totalPaid.compareTo(BigDecimal.ZERO) == 0) {
            if (this.status != InvoiceStatus.DRAFT && this.status != InvoiceStatus.CANCELLED) {
                // Henüz ödeme yapılmamışsa mevcut durumu koru
            }
        } else if (totalPaid.compareTo(this.totalAmount) >= 0) {
            this.status = InvoiceStatus.PAID;
            this.remainingAmount = BigDecimal.ZERO;
        } else {
            this.status = InvoiceStatus.PARTIALLY_PAID;
        }
    }
}
