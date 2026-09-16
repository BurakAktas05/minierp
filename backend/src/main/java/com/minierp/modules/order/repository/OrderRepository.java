package com.minierp.modules.order.repository;

import com.minierp.modules.order.entity.Order;
import com.minierp.modules.order.entity.OrderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByOrderType(OrderType orderType);

    List<Order> findByPartnerId(Long partnerId);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.variant LEFT JOIN FETCH o.partner WHERE o.id = :id")
    Optional<Order> findByIdWithDetails(@Param("id") Long id);
}
