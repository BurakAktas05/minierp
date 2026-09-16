package com.minierp.core.multitenancy;

import lombok.extern.slf4j.Slf4j;
import org.hibernate.HibernateException;
import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.hibernate.service.UnknownUnwrapTypeException;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.regex.Pattern;

/**
 * Hibernate için kiracı bazlı veritabanı bağlantısı sağlayan sınıf.
 * PostgreSQL'de şemayı (search_path) güvenli bir şekilde değiştirir.
 */
@Slf4j
@Component
public class MultiTenantConnectionProviderImpl implements MultiTenantConnectionProvider<String> {

    private final DataSource dataSource;
    private static final Pattern VALID_SCHEMA_PATTERN = Pattern.compile("^[a-zA-Z0-9_]+$");

    public MultiTenantConnectionProviderImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Connection getAnyConnection() throws SQLException {
        return dataSource.getConnection();
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    @Override
    public Connection getConnection(String tenantIdentifier) throws SQLException {
        final Connection connection = getAnyConnection();
        try {
            if (tenantIdentifier != null && !tenantIdentifier.isBlank()) {
                validateSchemaName(tenantIdentifier);
                connection.setSchema(tenantIdentifier);
                log.debug("Veritabanı bağlantısı '{}' şemasına yönlendirildi", tenantIdentifier);
            } else {
                connection.setSchema(TenantContext.DEFAULT_TENANT);
            }
        } catch (SQLException e) {
            releaseAnyConnection(connection);
            throw new HibernateException("Şema değiştirilemedi: " + tenantIdentifier, e);
        }
        return connection;
    }

    @Override
    public void releaseConnection(String tenantIdentifier, Connection connection) throws SQLException {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.setSchema(TenantContext.DEFAULT_TENANT);
            }
        } catch (SQLException e) {
            log.warn("Bağlantı varsayılan şemaya sıfırlanırken hata oluştu: {}", e.getMessage());
        } finally {
            releaseAnyConnection(connection);
        }
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return false;
    }

    @Override
    public boolean isUnwrappableAs(Class<?> unwrapType) {
        return MultiTenantConnectionProvider.class.isAssignableFrom(unwrapType) ||
                DataSource.class.isAssignableFrom(unwrapType);
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T unwrap(Class<T> unwrapType) {
        if (isUnwrappableAs(unwrapType)) {
            return (T) this;
        }
        throw new UnknownUnwrapTypeException(unwrapType);
    }

    private void validateSchemaName(String schemaName) {
        if (!VALID_SCHEMA_PATTERN.matcher(schemaName).matches()) {
            throw new IllegalArgumentException("Geçersiz şema adı: " + schemaName);
        }
    }
}
