package com.minierp.modules.audit.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Kiracı şemasında saklanan denetim günlüğü (audit log) kaydı.
 * Kim, ne zaman, hangi entity üzerinde ne işlem yaptığını takip eder.
 */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Yapılan işlem türü: CREATE, UPDATE, DELETE, LOGIN, STATUS_CHANGE
     */
    @Column(nullable = false, length = 30)
    private String action;

    /**
     * İşlem yapılan entity türü: Product, Order, Quotation, Waybill, User vb.
     */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /**
     * İşlem yapılan entity ID'si (opsiyonel – login gibi durumlarda null olabilir).
     */
    @Column(name = "entity_id")
    private Long entityId;

    /**
     * İşlemi yapan kullanıcı adı.
     */
    @Column(name = "performed_by", nullable = false, length = 50)
    private String performedBy;

    /**
     * Ek detaylar – eski/yeni değer, açıklama vs. (JSONB)
     */
    @Builder.Default
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "details", columnDefinition = "jsonb")
    private Map<String, Object> details = new HashMap<>();

    /**
     * İşlem zamanı.
     */
    @Builder.Default
    @Column(name = "performed_at", nullable = false)
    private OffsetDateTime performedAt = OffsetDateTime.now();

    @JsonProperty("username")
    public String getUsername() {
        return performedBy;
    }

    @JsonProperty("timestamp")
    public OffsetDateTime getTimestamp() {
        return performedAt;
    }
}

