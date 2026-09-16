package com.minierp.modules.inventory.repository;

import com.minierp.modules.inventory.entity.WarehouseStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, Long> {

    Optional<WarehouseStock> findByWarehouseIdAndVariantId(Long warehouseId, Long variantId);

    List<WarehouseStock> findByVariantId(Long variantId);

    List<WarehouseStock> findByWarehouseId(Long warehouseId);

    @Query("SELECT COALESCE(SUM(ws.quantity), 0) FROM WarehouseStock ws WHERE ws.variant.id = :variantId")
    Integer calculateTotalPhysicalStock(@Param("variantId") Long variantId);

    @Query("SELECT COALESCE(SUM(ws.reservedStock), 0) FROM WarehouseStock ws WHERE ws.variant.id = :variantId")
    Integer calculateTotalReservedStock(@Param("variantId") Long variantId);
}
