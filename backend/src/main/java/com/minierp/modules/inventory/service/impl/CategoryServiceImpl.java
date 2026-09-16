package com.minierp.modules.inventory.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.modules.inventory.dto.CategoryDto;
import com.minierp.modules.inventory.entity.Category;
import com.minierp.modules.inventory.mapper.CategoryMapper;
import com.minierp.modules.inventory.repository.CategoryRepository;
import com.minierp.modules.inventory.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    @Transactional
    public CategoryDto createCategory(CategoryDto dto) {
        if (categoryRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("Bu kategori kodu zaten mevcut: " + dto.getCode());
        }

        Category category = categoryMapper.toEntity(dto);
        category.setCode(dto.getCode().toUpperCase());
        Category saved = categoryRepository.save(category);
        return categoryMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryMapper.toDtoList(categoryRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", "id", id));
        return categoryMapper.toDto(category);
    }
}
