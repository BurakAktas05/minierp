package com.minierp.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Spring Boot'un React Single Page Application (SPA) yönlendirmesini (React Router)
 * desteklemesini sağlayan yapılandırma sınıfı.
 *
 * Eğer istek "/api/**", "/health" veya "/bilgilendirme" değilse ve sunucuda doğrudan bir statik dosya
 * bulunamazsa, tarayıcıda sayfa yenilendiğinde 404 vermemesi için isteği otomatik olarak "index.html"
 * dosyasına yönlendirir.
 */
@Configuration
public class SpaWebMvcConfigurer implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        // API, health ve bilgilendirme isteklerini index.html'e yönlendirme
                        if (resourcePath.startsWith("api") ||
                            resourcePath.startsWith("bilgilendirme") ||
                            resourcePath.startsWith("health")) {
                            return null;
                        }
                        return location.createRelative("index.html");
                    }
                });
    }
}
