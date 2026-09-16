package com.minierp.modules.audit.repository;

import com.minierp.modules.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityTypeAndEntityIdOrderByPerformedAtDesc(String entityType, Long entityId);

    List<AuditLog> findByPerformedByOrderByPerformedAtDesc(String performedBy);

    List<AuditLog> findByPerformedAtBetweenOrderByPerformedAtDesc(OffsetDateTime from, OffsetDateTime to);

    List<AuditLog> findAllByOrderByPerformedAtDesc();
}
