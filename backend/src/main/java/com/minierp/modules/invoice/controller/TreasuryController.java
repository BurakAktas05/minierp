package com.minierp.modules.invoice.controller;

import com.minierp.core.common.response.ApiResponse;
import com.minierp.modules.invoice.dto.CreateTreasuryAccountRequest;
import com.minierp.modules.invoice.dto.TreasuryAccountDto;
import com.minierp.modules.invoice.service.TreasuryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/treasury/accounts")
@RequiredArgsConstructor
public class TreasuryController {

    private final TreasuryService treasuryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TreasuryAccountDto>>> getAllAccounts() {
        List<TreasuryAccountDto> accounts = treasuryService.getAllAccounts();
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TreasuryAccountDto>> getAccountById(@PathVariable Long id) {
        TreasuryAccountDto account = treasuryService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.success(account));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TreasuryAccountDto>> createAccount(@Valid @RequestBody CreateTreasuryAccountRequest request) {
        TreasuryAccountDto created = treasuryService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Kasa/Banka hesabı başarıyla oluşturuldu", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TreasuryAccountDto>> updateAccount(@PathVariable Long id,
                                                                         @Valid @RequestBody CreateTreasuryAccountRequest request) {
        TreasuryAccountDto updated = treasuryService.updateAccount(id, request);
        return ResponseEntity.ok(ApiResponse.success("Kasa/Banka hesabı güncellendi", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable Long id) {
        treasuryService.deleteAccount(id);
        return ResponseEntity.ok(ApiResponse.success("Kasa/Banka hesabı silindi (pasife alındı)", null));
    }
}
