package com.minierp.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {

    private Long id;

    @NotBlank(message = "Kategori adı boş bırakılamaz")
    @Size(max = 100, message = "Kategori adı en fazla 100 karakter olabilir")
    private String name;

    @NotBlank(message = "Kategori kodu boş bırakılamaz")
    @Size(max = 50, message = "Kategori kodu en fazla 50 karakter olabilir")
    private String code;

    private String description;

    private OffsetDateTime createdAt;
}
