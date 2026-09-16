package com.minierp.modules.inventory.mapper;

import com.minierp.modules.inventory.dto.ProductCreateRequest;
import com.minierp.modules.inventory.dto.ProductResponse;
import com.minierp.modules.inventory.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {ProductVariantMapper.class})
public interface ProductMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    Product toEntity(ProductCreateRequest request);

    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "variants", source = "variants")
    ProductResponse toResponse(Product entity);

    List<ProductResponse> toResponseList(List<Product> entities);
}
