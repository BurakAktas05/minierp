package com.minierp.modules.audit.controller;

import com.minierp.modules.audit.entity.AuditLog;
import com.minierp.modules.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Denetim günlüğü (Audit Log) REST controller'ı.
 * Yalnızca ROLE_ADMIN yetkisine sahip kullanıcılar erişebilir (SecurityConfig'de tanımlı).
 */
@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    /**
     * Tüm audit loglarını listele (en yeniden eskiye).
     */
    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditService.getAllLogs());
    }

    /**
     * Belirli bir entity'nin audit geçmişini getir.
     * Örn: GET /api/v1/audit-logs/entity?type=Order&id=5
     */
    @GetMapping("/entity")
    public ResponseEntity<List<AuditLog>> getLogsByEntity(
            @RequestParam String type,
            @RequestParam Long id) {
        return ResponseEntity.ok(auditService.getLogsByEntity(type, id));
    }

    /**
     * Belirli bir kullanıcının tüm işlemlerini getir.
     * Örn: GET /api/v1/audit-logs/user?username=admin
     */
    @GetMapping("/user")
    public ResponseEntity<List<AuditLog>> getLogsByUser(@RequestParam String username) {
        return ResponseEntity.ok(auditService.getLogsByUser(username));
    }

    /**
     * Tarih aralığına göre audit loglarını getir.
     * Örn: GET /api/v1/audit-logs/date-range?from=2026-01-01T00:00:00Z&to=2026-12-31T23:59:59Z
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<AuditLog>> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        return ResponseEntity.ok(auditService.getLogsByDateRange(from, to));
    }
}
