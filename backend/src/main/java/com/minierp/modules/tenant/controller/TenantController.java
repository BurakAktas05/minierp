package com.minierp.modules.tenant.controller;

import com.minierp.core.common.response.ApiResponse;
import com.minierp.modules.tenant.dto.CreateTenantRequest;
import com.minierp.modules.tenant.dto.TenantResponse;
import com.minierp.modules.tenant.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    public ResponseEntity<ApiResponse<TenantResponse>> createTenant(@Valid @RequestBody CreateTenantRequest request) {
        TenantResponse response = tenantService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Kiracı ve veritabanı şeması başarıyla oluşturuldu", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TenantResponse>>> getAllTenants() {
        List<TenantResponse> tenants = tenantService.getAllTenants();
        return ResponseEntity.ok(ApiResponse.success(tenants));
    }

    @GetMapping("/{tenantId}")
    public ResponseEntity<ApiResponse<TenantResponse>> getTenantById(@PathVariable String tenantId) {
        TenantResponse tenant = tenantService.getTenantById(tenantId);
        return ResponseEntity.ok(ApiResponse.success(tenant));
    }
}
