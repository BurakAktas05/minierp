package com.minierp.core.multitenancy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Yeni kiracılar sisteme eklendiğinde PostgreSQL şemasını oluşturan ve Flyway ile
 * kiracı tablolarını ilgili şemaya kuran altyapı servisi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantProvisioningService {

    private final DataSource dataSource;

    public void initTenant(String schemaName) {
        log.info("Yeni kiracı şeması oluşturuluyor ve taşınıyor: {}", schemaName);

        // 1. Şemayı veritabanında oluştur
        createSchema(schemaName);

        // 2. Flyway ile şablon tabloları kur
        migrateTenantSchema(schemaName);

        log.info("Kiracı şeması '{}' başarıyla hazırlandı.", schemaName);
    }

    private void createSchema(String schemaName) {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA IF NOT EXISTS \"" + schemaName + "\"");
        } catch (SQLException e) {
            throw new RuntimeException("Şema oluşturulamadı: " + schemaName, e);
        }
    }

    private void migrateTenantSchema(String schemaName) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(schemaName)
                .locations("classpath:db/migration/tenants")
                .baselineOnMigrate(true)
                .validateOnMigrate(false)
                .load();

        try {
            flyway.repair();
        } catch (Exception e) {
            log.warn("Flyway repair uyarısı: {}", e.getMessage());
        }

        flyway.migrate();
    }
}
