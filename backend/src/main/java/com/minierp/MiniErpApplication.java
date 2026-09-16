package com.minierp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MiniErpApplication {

    public static void main(String[] args) {
        // Railway / Heroku standard PostgreSQL URL adapter
        configureDatabaseUrlIfPresent();

        SpringApplication.run(MiniErpApplication.class, args);
    }

    /**
     * Railway veya benzeri PaaS platformlarında otomatik enjekte edilen
     * DATABASE_URL ("postgresql://..." veya "postgres://...") formatını
     * JDBC uyumlu ("jdbc:postgresql://...") formata dönüştürür.
     */
    private static void configureDatabaseUrlIfPresent() {
        String dbUrl = System.getenv("DATABASE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("DATABASE_PUBLIC_URL");
        }

        if (dbUrl != null && !dbUrl.isBlank()) {
            String jdbcUrl;
            if (dbUrl.startsWith("postgres://")) {
                jdbcUrl = "jdbc:postgresql://" + dbUrl.substring("postgres://".length());
            } else if (dbUrl.startsWith("postgresql://")) {
                jdbcUrl = "jdbc:" + dbUrl;
            } else if (dbUrl.startsWith("jdbc:")) {
                jdbcUrl = dbUrl;
            } else {
                jdbcUrl = "jdbc:postgresql://" + dbUrl;
            }
            System.setProperty("JDBC_DATABASE_URL", jdbcUrl);
        }
    }
}
