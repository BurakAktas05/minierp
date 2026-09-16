package com.minierp.modules.inventory.controller;

import com.minierp.core.common.response.ApiResponse;
import com.minierp.modules.inventory.dto.ProductVariantResponse;
import com.minierp.modules.inventory.dto.VariantStockUpdateRequest;
import com.minierp.modules.inventory.service.ProductVariantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory/variants")
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantService productVariantService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> getVariantById(@PathVariable Long id) {
        ProductVariantResponse response = productVariantService.getVariantById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> getVariantBySku(@PathVariable String sku) {
        ProductVariantResponse response = productVariantService.getVariantBySku(sku);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<ProductVariantResponse>>> getVariantsByProduct(@PathVariable Long productId) {
        List<ProductVariantResponse> responses = productVariantService.getVariantsByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> updateStock(
            @PathVariable Long id,
            @Valid @RequestBody VariantStockUpdateRequest request) {
        ProductVariantResponse response = productVariantService.updateStock(id, request.getAmount());
        return ResponseEntity.ok(ApiResponse.success("Varyant fiili stoğu güncellendi", response));
    }

    @PostMapping("/{id}/reserve")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> reserveStock(
            @PathVariable Long id,
            @RequestParam int quantity) {
        ProductVariantResponse response = productVariantService.reserveStock(id, quantity);
        return ResponseEntity.ok(ApiResponse.success("Stok başarıyla rezerve edildi", response));
    }

    @PostMapping("/{id}/release-reserve")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> releaseReservedStock(
            @PathVariable Long id,
            @RequestParam int quantity) {
        ProductVariantResponse response = productVariantService.releaseReservedStock(id, quantity);
        return ResponseEntity.ok(ApiResponse.success("Rezerve stok başarıyla serbest bırakıldı", response));
    }

    @PostMapping("/{id}/fulfill")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> fulfillStock(
            @PathVariable Long id,
            @RequestParam int quantity) {
        ProductVariantResponse response = productVariantService.fulfillStock(id, quantity);
        return ResponseEntity.ok(ApiResponse.success("Sevkiyat gerçekleştirildi (fiili ve rezerve stok düşüldü)", response));
    }
}
