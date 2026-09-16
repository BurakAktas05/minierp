package com.minierp.modules.waybill.dto;

import com.minierp.modules.waybill.entity.WaybillType;
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
public class CreateWaybillRequest {

    @NotNull(message = "İrsaliye türü (DISPATCH, RECEIPT) seçilmelidir")
    private WaybillType type;

    @NotNull(message = "Cari hesap ID boş bırakılamaz")
    private Long partnerId;

    private Long orderId;

    private OffsetDateTime dispatchDate;
    private OffsetDateTime deliveryDate;
    private String carrierCompany;
    private String trackingNumber;
    private String vehiclePlate;
    private String notes;

    private Map<String, Object> metadata;

    @NotEmpty(message = "İrsaliye en az bir kalem içermelidir")
    @Valid
    private List<WaybillItemRequest> items;
}
