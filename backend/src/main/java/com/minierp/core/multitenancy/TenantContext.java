package com.minierp.core.multitenancy;

import lombok.extern.slf4j.Slf4j;

/**
 * ThreadLocal tabanlı kiracı (tenant) bağlamı saklayıcısı.
 * Her HTTP isteği iş parçacığında (thread) aktif kiracı kimliğini (şema adını) tutar.
 */
@Slf4j
public final class TenantContext {

    public static final String DEFAULT_TENANT = "public";
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
        // Yardımcı statik sınıf
    }

    public static void setTenantId(String tenantId) {
        log.debug("TenantContext güncellendi: {}", tenantId);
        CURRENT_TENANT.set(tenantId);
    }

    public static String getTenantId() {
        String tenantId = CURRENT_TENANT.get();
        return (tenantId != null && !tenantId.isBlank()) ? tenantId : DEFAULT_TENANT;
    }

    public static void clear() {
        log.debug("TenantContext temizlendi");
        CURRENT_TENANT.remove();
    }
}
