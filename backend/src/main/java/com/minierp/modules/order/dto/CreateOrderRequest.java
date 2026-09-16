package com.minierp.modules.order.dto;

import com.minierp.modules.order.entity.OrderType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotNull(message = "Sipariş türü (SALES_ORDER, PURCHASE_ORDER) seçilmelidir")
    private OrderType orderType;

    @NotNull(message = "Cari hesap ID boş bırakılamaz")
    private Long partnerId;

    private Long quotationId;

    private OffsetDateTime deliveryDate;

    @Builder.Default
    private String currency = "TRY";

    private String notes;

    private Map<String, Object> metadata;

    @NotEmpty(message = "Sipariş en az bir ürün kalemi içermelidir")
    @Valid
    private List<OrderItemRequest> items;
}
