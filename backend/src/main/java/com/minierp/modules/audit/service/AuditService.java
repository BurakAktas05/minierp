package com.minierp.modules.audit.service;

import com.minierp.modules.audit.entity.AuditLog;
import com.minierp.modules.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Denetim günlüğü (Audit Log) yönetim servisi.
 * Tüm önemli iş işlemlerini (CRUD, durum değişikliği, login vb.) kaydeder.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Audit log kaydı oluşturur.
     * REQUIRES_NEW propagation ile ana transaction'dan bağımsız çalışır,
     * böylece ana işlem başarısız olsa bile log kaybedilmez.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityType, Long entityId, String performedBy, Map<String, Object> details) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .performedBy(performedBy)
                .details(details != null ? details : Map.of())
                .performedAt(OffsetDateTime.now())
                .build();

        auditLogRepository.save(auditLog);
        log.debug("Audit log kaydedildi: action={}, entity={}#{}, user={}",
                action, entityType, entityId, performedBy);
    }

    /**
     * Mevcut authenticated kullanıcı bilgisiyle audit log oluşturur.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logWithCurrentUser(String action, String entityType, Long entityId, Map<String, Object> details) {
        String currentUser = getCurrentUsername();
        log(action, entityType, entityId, currentUser, details);
    }

    /**
     * Tüm audit loglarını zaman sırasına göre döner.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByPerformedAtDesc();
    }

    /**
     * Belirli bir entity'nin audit geçmişini döner.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByPerformedAtDesc(entityType, entityId);
    }

    /**
     * Belirli bir kullanıcının tüm işlemlerini döner.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByUser(String username) {
        return auditLogRepository.findByPerformedByOrderByPerformedAtDesc(username);
    }

    /**
     * Tarih aralığına göre audit loglarını döner.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getLogsByDateRange(OffsetDateTime from, OffsetDateTime to) {
        return auditLogRepository.findByPerformedAtBetweenOrderByPerformedAtDesc(from, to);
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "SYSTEM";
    }
}
