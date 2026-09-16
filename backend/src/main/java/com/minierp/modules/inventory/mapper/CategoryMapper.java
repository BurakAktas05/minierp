package com.minierp.modules.inventory.mapper;

import com.minierp.modules.inventory.dto.CategoryDto;
import com.minierp.modules.inventory.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CategoryMapper {

    CategoryDto toDto(Category entity);

    Category toEntity(CategoryDto dto);

    List<CategoryDto> toDtoList(List<Category> entities);
}
