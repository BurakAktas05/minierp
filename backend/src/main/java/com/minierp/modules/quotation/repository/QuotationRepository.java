package com.minierp.modules.quotation.repository;

import com.minierp.modules.quotation.entity.Quotation;
import com.minierp.modules.quotation.entity.QuotationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {

    Optional<Quotation> findByQuotationNumber(String quotationNumber);

    List<Quotation> findByType(QuotationType type);

    List<Quotation> findByPartnerId(Long partnerId);

    @Query("SELECT q FROM Quotation q LEFT JOIN FETCH q.items i LEFT JOIN FETCH i.variant LEFT JOIN FETCH q.partner WHERE q.id = :id")
    Optional<Quotation> findByIdWithDetails(@Param("id") Long id);
}
