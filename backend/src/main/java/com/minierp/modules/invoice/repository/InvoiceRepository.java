package com.minierp.modules.invoice.repository;

import com.minierp.modules.invoice.entity.Invoice;
import com.minierp.modules.invoice.entity.InvoiceStatus;
import com.minierp.modules.invoice.entity.InvoiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByInvoiceType(InvoiceType invoiceType);

    List<Invoice> findByStatus(InvoiceStatus status);

    List<Invoice> findByPartnerId(Long partnerId);

    List<Invoice> findByWaybillId(Long waybillId);

    List<Invoice> findByOrderId(Long orderId);

    @Query("SELECT i FROM Invoice i LEFT JOIN FETCH i.items it LEFT JOIN FETCH it.variant LEFT JOIN FETCH i.partner WHERE i.id = :id")
    Optional<Invoice> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT i.partner.id, SUM(i.totalAmount) FROM Invoice i WHERE i.invoiceType = :invoiceType AND i.status IN :statuses AND i.partner IS NOT NULL GROUP BY i.partner.id")
    List<Object[]> sumTotalAmountByInvoiceTypeGroupedByPartner(
            @Param("invoiceType") InvoiceType invoiceType,
            @Param("statuses") List<InvoiceStatus> statuses
    );

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.partner.id = :partnerId AND i.invoiceType = :invoiceType AND i.status IN :statuses")
    java.math.BigDecimal sumTotalAmountByPartnerAndInvoiceType(
            @Param("partnerId") Long partnerId,
            @Param("invoiceType") InvoiceType invoiceType,
            @Param("statuses") List<InvoiceStatus> statuses
    );
}
