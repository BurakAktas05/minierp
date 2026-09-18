package com.minierp.core.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.InstantDeserializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.*;

/**
 * Jackson yapılandırması: Frontend tarafından gönderilen YYYY-MM-DD (LocalDate) veya ISO-8601 formatındaki
 * tarih dizgilerini OffsetDateTime nesnelerine otomatik ve esnek şekilde dönüştürür.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jsonCustomizer() {
        return builder -> {
            builder.deserializerByType(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
                @Override
                public OffsetDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
                    String text = p.getText();
                    if (text == null || text.isBlank()) {
                        return null;
                    }
                    text = text.trim();

                    // 1. Salt tarih formatı: "YYYY-MM-DD" (10 karakter)
                    if (text.length() == 10 && text.charAt(4) == '-' && text.charAt(7) == '-') {
                        LocalDate localDate = LocalDate.parse(text);
                        return localDate.atTime(23, 59, 59).atOffset(ZoneOffset.UTC);
                    }

                    // 2. Saatli ama offsetsiz: "YYYY-MM-DDTHH:mm:ss" veya "YYYY-MM-DDTHH:mm"
                    if ((text.length() == 16 || text.length() == 19) && !text.endsWith("Z") && !text.contains("+")) {
                        LocalDateTime ldt = LocalDateTime.parse(text);
                        return ldt.atOffset(ZoneOffset.UTC);
                    }

                    // 3. Standart ISO-8601 OffsetDateTime ("2027-11-06T23:59:59Z" veya "+03:00")
                    try {
                        return OffsetDateTime.parse(text);
                    } catch (Exception e) {
                        return InstantDeserializer.OFFSET_DATE_TIME.deserialize(p, ctxt);
                    }
                }
            });
        };
    }
}
