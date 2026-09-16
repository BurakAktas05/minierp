package com.minierp.modules.inventory.repository;

import com.minierp.modules.inventory.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    Optional<StockMovement> findByMovementNumber(String movementNumber);

    List<StockMovement> findByVariantIdOrderByCreatedAtDesc(Long variantId);

    List<StockMovement> findBySourceWarehouseIdOrTargetWarehouseIdOrderByCreatedAtDesc(Long sourceWarehouseId, Long targetWarehouseId);
}
