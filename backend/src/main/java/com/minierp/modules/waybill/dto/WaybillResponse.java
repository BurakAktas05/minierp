package com.minierp.modules.waybill.dto;

import com.minierp.modules.partner.dto.BusinessPartnerDto;
import com.minierp.modules.waybill.entity.WaybillStatus;
import com.minierp.modules.waybill.entity.WaybillType;
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
public class WaybillResponse {

    private Long id;
    private String waybillNumber;
    private WaybillType type;
    private BusinessPartnerDto partner;
    private Long orderId;
    private WaybillStatus status;
    private OffsetDateTime dispatchDate;
    private OffsetDateTime deliveryDate;
    private String carrierCompany;
    private String trackingNumber;
    private String vehiclePlate;
    private String notes;
    private Map<String, Object> metadata;
    private List<WaybillItemResponse> items;
    private OffsetDateTime createdAt;
}
