package com.minierp.modules.inventory.repository;

import com.minierp.modules.inventory.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByCode(String code);

    boolean existsByCode(String code);

    List<Product> findByCategoryId(Long categoryId);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.variants LEFT JOIN FETCH p.category LEFT JOIN FETCH p.partner WHERE p.id = :id")
    Optional<Product> findByIdWithVariants(@Param("id") Long id);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.variants LEFT JOIN FETCH p.category LEFT JOIN FETCH p.partner ORDER BY p.id DESC")
    List<Product> findAllWithVariants();

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.variants LEFT JOIN FETCH p.category LEFT JOIN FETCH p.partner WHERE p.productType IN :types ORDER BY p.id DESC")
    List<Product> findByProductTypeInWithVariants(@Param("types") List<com.minierp.modules.inventory.entity.ProductType> types);
}
