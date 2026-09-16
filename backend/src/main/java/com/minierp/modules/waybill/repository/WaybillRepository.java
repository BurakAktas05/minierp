package com.minierp.modules.waybill.repository;

import com.minierp.modules.waybill.entity.Waybill;
import com.minierp.modules.waybill.entity.WaybillType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaybillRepository extends JpaRepository<Waybill, Long> {

    Optional<Waybill> findByWaybillNumber(String waybillNumber);

    List<Waybill> findByType(WaybillType type);

    List<Waybill> findByOrderId(Long orderId);

    List<Waybill> findByPartnerId(Long partnerId);

    @Query("SELECT w FROM Waybill w LEFT JOIN FETCH w.items i LEFT JOIN FETCH i.variant LEFT JOIN FETCH w.partner WHERE w.id = :id")
    Optional<Waybill> findByIdWithDetails(@Param("id") Long id);
}
