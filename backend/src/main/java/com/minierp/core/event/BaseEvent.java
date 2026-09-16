package com.minierp.core.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Tüm asenkron Domain Event'ler için temel ata sınıf.
 * Multi-tenancy desteği için kiracı bilgisini (tenantId) zorunlu olarak taşır.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class BaseEvent implements Serializable {

    @Builder.Default
    private String eventId = UUID.randomUUID().toString();

    private String tenantId;

    @Builder.Default
    private OffsetDateTime occurredAt = OffsetDateTime.now();

    public BaseEvent(String tenantId) {
        this.eventId = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.occurredAt = OffsetDateTime.now();
    }
}
