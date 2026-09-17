package com.minierp.modules.manufacturing.controller;

import com.minierp.core.common.response.ApiResponse;
import com.minierp.modules.manufacturing.dto.*;
import com.minierp.modules.manufacturing.entity.WorkOrderStatus;
import com.minierp.modules.manufacturing.service.ManufacturingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/manufacturing")
@RequiredArgsConstructor
public class ManufacturingController {

    private final ManufacturingService manufacturingService;

    // ==========================================
    // 1. Üretim Reçeteleri (BOM)
    // ==========================================

    @PostMapping("/boms")
    public ResponseEntity<ApiResponse<BomDto>> createBom(@Valid @RequestBody CreateBomRequest request) {
        BomDto response = manufacturingService.createBom(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Üretim reçetesi başarıyla oluşturuldu", response));
    }

    @GetMapping("/boms")
    public ResponseEntity<ApiResponse<List<BomDto>>> getAllBoms(
            @RequestParam(required = false) String industryType) {
        List<BomDto> boms = manufacturingService.getAllBoms(industryType);
        return ResponseEntity.ok(ApiResponse.success(boms));
    }

    @GetMapping("/boms/{id}")
    public ResponseEntity<ApiResponse<BomDto>> getBomById(@PathVariable Long id) {
        BomDto bom = manufacturingService.getBomById(id);
        return ResponseEntity.ok(ApiResponse.success(bom));
    }

    // ==========================================
    // 2. Üretim İş Emirleri (Work Orders)
    // ==========================================

    @PostMapping("/work-orders")
    public ResponseEntity<ApiResponse<WorkOrderDto>> createWorkOrder(@Valid @RequestBody CreateWorkOrderRequest request) {
        WorkOrderDto response = manufacturingService.createWorkOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Üretim iş emri başarıyla açıldı", response));
    }

    @GetMapping("/work-orders")
    public ResponseEntity<ApiResponse<List<WorkOrderDto>>> getAllWorkOrders(
            @RequestParam(required = false) WorkOrderStatus status) {
        List<WorkOrderDto> orders = manufacturingService.getAllWorkOrders(status);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/work-orders/{id}")
    public ResponseEntity<ApiResponse<WorkOrderDto>> getWorkOrderById(@PathVariable Long id) {
        WorkOrderDto order = manufacturingService.getWorkOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PatchMapping("/work-orders/{id}/status")
    public ResponseEntity<ApiResponse<WorkOrderDto>> updateWorkOrderStatus(
            @PathVariable Long id,
            @RequestParam WorkOrderStatus status) {
        WorkOrderDto updated = manufacturingService.updateWorkOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("İş emri durumu güncellendi", updated));
    }

    // ==========================================
    // 3. 10 Sektör Şablonları & Parametreleri
    // ==========================================

    @GetMapping("/sectors")
    public ResponseEntity<ApiResponse<List<SectorTemplateDto>>> getSectorTemplates() {
        List<SectorTemplateDto> templates = manufacturingService.getSectorTemplates();
        return ResponseEntity.ok(ApiResponse.success(templates));
    }
}
