package com.minierp.modules.manufacturing.repository;

import com.minierp.modules.manufacturing.entity.WorkOrder;
import com.minierp.modules.manufacturing.entity.WorkOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    Optional<WorkOrder> findByOrderNumber(String orderNumber);

    List<WorkOrder> findByStatus(WorkOrderStatus status);

    List<WorkOrder> findByBomId(Long bomId);

    @Query("SELECT w FROM WorkOrder w LEFT JOIN FETCH w.items i LEFT JOIN FETCH i.componentVariant LEFT JOIN FETCH w.bom b LEFT JOIN FETCH b.variant LEFT JOIN FETCH w.sourceWarehouse LEFT JOIN FETCH w.targetWarehouse WHERE w.id = :id")
    Optional<WorkOrder> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT w FROM WorkOrder w LEFT JOIN FETCH w.items i LEFT JOIN FETCH i.componentVariant LEFT JOIN FETCH w.bom b LEFT JOIN FETCH b.variant LEFT JOIN FETCH w.sourceWarehouse LEFT JOIN FETCH w.targetWarehouse ORDER BY w.id DESC")
    List<WorkOrder> findAllWithDetails();
}
