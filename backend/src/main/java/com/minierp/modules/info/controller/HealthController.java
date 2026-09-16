package com.minierp.modules.info.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Railway, Docker ve Kubernetes sağlık denetimi (Health Check) uç noktası.
 * Uç Noktalar:
 * - GET /health
 * - GET /api/v1/health
 */
@RestController
public class HealthController {

    @GetMapping(value = {"/health", "/api/v1/health"})
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "mini-erp-backend",
                "timestamp", OffsetDateTime.now().toString()
        ));
    }
}
