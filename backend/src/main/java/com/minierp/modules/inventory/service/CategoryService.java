package com.minierp.modules.inventory.service;

import com.minierp.modules.inventory.dto.CategoryDto;

import java.util.List;

public interface CategoryService {

    CategoryDto createCategory(CategoryDto dto);

    List<CategoryDto> getAllCategories();

    CategoryDto getCategoryById(Long id);
}
