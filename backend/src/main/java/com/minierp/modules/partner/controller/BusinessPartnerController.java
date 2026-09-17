package com.minierp.modules.partner.controller;

import com.minierp.core.common.response.ApiResponse;
import com.minierp.modules.partner.dto.BusinessPartnerDto;
import com.minierp.modules.partner.dto.PartnerStatementResponse;
import com.minierp.modules.partner.entity.PartnerType;
import com.minierp.modules.partner.service.BusinessPartnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/partners")
@RequiredArgsConstructor
public class BusinessPartnerController {

    private final BusinessPartnerService businessPartnerService;

    @PostMapping
    public ResponseEntity<ApiResponse<BusinessPartnerDto>> createPartner(@Valid @RequestBody BusinessPartnerDto dto) {
        BusinessPartnerDto response = businessPartnerService.createPartner(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cari hesap başarıyla oluşturuldu", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BusinessPartnerDto>>> getAllPartners(
            @RequestParam(required = false) PartnerType type) {
        List<BusinessPartnerDto> partners = businessPartnerService.getAllPartners(type);
        return ResponseEntity.ok(ApiResponse.success(partners));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BusinessPartnerDto>> getPartnerById(@PathVariable Long id) {
        BusinessPartnerDto partner = businessPartnerService.getPartnerById(id);
        return ResponseEntity.ok(ApiResponse.success(partner));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BusinessPartnerDto>> updatePartner(
            @PathVariable Long id,
            @Valid @RequestBody BusinessPartnerDto dto) {
        BusinessPartnerDto updated = businessPartnerService.updatePartner(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cari hesap başarıyla güncellendi", updated));
    }

    @GetMapping("/{id}/statement")
    public ResponseEntity<ApiResponse<PartnerStatementResponse>> getPartnerStatement(@PathVariable Long id) {
        PartnerStatementResponse statement = businessPartnerService.getPartnerStatement(id);
        return ResponseEntity.ok(ApiResponse.success(statement));
    }
}
