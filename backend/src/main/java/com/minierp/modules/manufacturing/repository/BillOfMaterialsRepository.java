package com.minierp.modules.manufacturing.repository;

import com.minierp.modules.manufacturing.entity.BillOfMaterials;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillOfMaterialsRepository extends JpaRepository<BillOfMaterials, Long> {

    Optional<BillOfMaterials> findByBomCode(String bomCode);

    boolean existsByBomCode(String bomCode);

    List<BillOfMaterials> findByIndustryType(String industryType);

    List<BillOfMaterials> findByVariantId(Long variantId);

    @Query("SELECT b FROM BillOfMaterials b LEFT JOIN FETCH b.items i LEFT JOIN FETCH i.componentVariant LEFT JOIN FETCH b.variant WHERE b.id = :id")
    Optional<BillOfMaterials> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT b FROM BillOfMaterials b LEFT JOIN FETCH b.items i LEFT JOIN FETCH i.componentVariant LEFT JOIN FETCH b.variant ORDER BY b.id DESC")
    List<BillOfMaterials> findAllWithDetails();
}
