package com.minierp.modules.waybill.controller;

import com.minierp.core.common.response.ApiResponse;
import com.minierp.modules.waybill.dto.CreateWaybillRequest;
import com.minierp.modules.waybill.dto.WaybillResponse;
import com.minierp.modules.waybill.entity.WaybillStatus;
import com.minierp.modules.waybill.entity.WaybillType;
import com.minierp.modules.waybill.service.WaybillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/waybills")
@RequiredArgsConstructor
public class WaybillController {

    private final WaybillService waybillService;

    @PostMapping
    public ResponseEntity<ApiResponse<WaybillResponse>> createWaybill(@Valid @RequestBody CreateWaybillRequest request) {
        WaybillResponse response = waybillService.createWaybill(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("İrsaliye taslak olarak oluşturuldu", response));
    }

    @PostMapping("/from-order/{orderId}")
    public ResponseEntity<ApiResponse<WaybillResponse>> createWaybillFromOrder(@PathVariable Long orderId) {
        WaybillResponse response = waybillService.createWaybillFromOrder(orderId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Siparişten irsaliye başarıyla oluşturuldu", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WaybillResponse>>> getAllWaybills(
            @RequestParam(required = false) WaybillType type) {
        List<WaybillResponse> waybills = waybillService.getAllWaybills(type);
        return ResponseEntity.ok(ApiResponse.success(waybills));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WaybillResponse>> getWaybillById(@PathVariable Long id) {
        WaybillResponse waybill = waybillService.getWaybillById(id);
        return ResponseEntity.ok(ApiResponse.success(waybill));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<WaybillResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam WaybillStatus status) {
        WaybillResponse response = waybillService.updateWaybillStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("İrsaliye durumu güncellendi", response));
    }
}
