package com.minierp.modules.tenant.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.core.multitenancy.TenantProvisioningService;
import com.minierp.modules.tenant.dto.CreateTenantRequest;
import com.minierp.modules.tenant.dto.TenantResponse;
import com.minierp.modules.tenant.entity.Tenant;
import com.minierp.modules.tenant.mapper.TenantMapper;
import com.minierp.modules.tenant.repository.TenantRepository;
import com.minierp.modules.tenant.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final TenantProvisioningService tenantProvisioningService;
    private final TenantMapper tenantMapper;

    @Override
    @Transactional
    public TenantResponse createTenant(CreateTenantRequest request) {
        log.info("Yeni kiracı kaydı oluşturuluyor: tenantId={}", request.getTenantId());

        if (tenantRepository.existsByTenantId(request.getTenantId())) {
            throw new BusinessException("Bu Tenant ID zaten kullanılıyor: " + request.getTenantId());
        }

        if (tenantRepository.existsBySchemaName(request.getSchemaName())) {
            throw new BusinessException("Bu Şema Adı zaten kullanılıyor: " + request.getSchemaName());
        }

        // 1. MapStruct ile DTO -> Entity dönüşümü
        Tenant tenant = tenantMapper.toEntity(request);
        tenant.setTenantId(request.getTenantId().toLowerCase());
        tenant.setSchemaName(request.getSchemaName().toLowerCase());

        Tenant savedTenant = tenantRepository.save(tenant);

        // 2. PostgreSQL şemasını oluştur ve Flyway ile kiracı tablolarını kur
        tenantProvisioningService.initTenant(savedTenant.getSchemaName());

        return tenantMapper.toResponse(savedTenant);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantResponse> getAllTenants() {
        return tenantMapper.toResponseList(tenantRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public TenantResponse getTenantById(String tenantId) {
        Tenant tenant = tenantRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "tenantId", tenantId));
        return tenantMapper.toResponse(tenant);
    }
}
