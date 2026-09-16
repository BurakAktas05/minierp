package com.minierp.modules.waybill.service;

import com.minierp.modules.waybill.dto.CreateWaybillRequest;
import com.minierp.modules.waybill.dto.WaybillResponse;
import com.minierp.modules.waybill.entity.WaybillStatus;
import com.minierp.modules.waybill.entity.WaybillType;

import java.util.List;

public interface WaybillService {

    WaybillResponse createWaybill(CreateWaybillRequest request);

    WaybillResponse createWaybillFromOrder(Long orderId);

    List<WaybillResponse> getAllWaybills(WaybillType type);

    WaybillResponse getWaybillById(Long id);

    WaybillResponse updateWaybillStatus(Long id, WaybillStatus newStatus);
}
