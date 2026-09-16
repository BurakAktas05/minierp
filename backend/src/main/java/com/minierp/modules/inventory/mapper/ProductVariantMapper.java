package com.minierp.modules.inventory.mapper;

import com.minierp.modules.inventory.dto.ProductVariantRequest;
import com.minierp.modules.inventory.dto.ProductVariantResponse;
import com.minierp.modules.inventory.entity.ProductVariant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ProductVariantMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "reservedStock", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    ProductVariant toEntity(ProductVariantRequest request);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "availableStock", source = "availableStock")
    ProductVariantResponse toResponse(ProductVariant entity);

    List<ProductVariantResponse> toResponseList(List<ProductVariant> entities);
}
