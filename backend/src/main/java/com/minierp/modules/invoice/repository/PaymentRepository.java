package com.minierp.modules.invoice.repository;

import com.minierp.modules.invoice.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByInvoiceId(Long invoiceId);

    List<Payment> findByPartnerId(Long partnerId);

    @Query("SELECT p FROM Payment p LEFT JOIN FETCH p.invoice LEFT JOIN FETCH p.partner WHERE p.id = :id")
    Optional<Payment> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT p FROM Payment p LEFT JOIN FETCH p.invoice LEFT JOIN FETCH p.partner ORDER BY p.paymentDate DESC")
    List<Payment> findAllWithDetails();

    @Query("SELECT p.partner.id, SUM(p.amount) FROM Payment p WHERE p.paymentType = :paymentType AND p.status = :status AND p.partner IS NOT NULL GROUP BY p.partner.id")
    List<Object[]> sumAmountByPaymentTypeGroupedByPartner(
            @Param("paymentType") com.minierp.modules.invoice.entity.PaymentType paymentType,
            @Param("status") com.minierp.modules.invoice.entity.PaymentStatus status
    );

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.partner.id = :partnerId AND p.paymentType = :paymentType AND p.status = :status")
    java.math.BigDecimal sumAmountByPartnerAndPaymentType(
            @Param("partnerId") Long partnerId,
            @Param("paymentType") com.minierp.modules.invoice.entity.PaymentType paymentType,
            @Param("status") com.minierp.modules.invoice.entity.PaymentStatus status
    );
}
