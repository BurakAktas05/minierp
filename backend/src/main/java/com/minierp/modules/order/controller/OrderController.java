package com.minierp.modules.order.controller;

import com.minierp.core.common.response.ApiResponse;
import com.minierp.modules.order.dto.CreateOrderRequest;
import com.minierp.modules.order.dto.OrderResponse;
import com.minierp.modules.order.entity.OrderStatus;
import com.minierp.modules.order.entity.OrderType;
import com.minierp.modules.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resmi sipariş taslak olarak oluşturuldu", response));
    }

    @PostMapping("/from-quotation/{quotationId}")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrderFromQuotation(@PathVariable Long quotationId) {
        OrderResponse response = orderService.createOrderFromQuotation(quotationId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Kabul edilen teklif resmi siparişe dönüştürüldü", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderType type) {
        List<OrderResponse> orders = orderService.getAllOrders(type);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.updateOrder(id, request);
        return ResponseEntity.ok(ApiResponse.success("Sipariş başarıyla güncellendi", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        OrderResponse response = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Sipariş durumu güncellendi", response));
    }
}
